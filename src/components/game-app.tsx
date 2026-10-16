"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight,
  Clock3, Flame, Heart, Infinity as InfinityIcon, Maximize2, Minus,
  PencilLine, Plus, RotateCcw, Settings2, Share2, ShieldCheck, Shuffle,
  SkipForward, Sparkles, Volume2, VolumeX, X, Zap,
} from "lucide-react";
import { CATEGORIES, HEAT_LEVELS, MODES, type Category, type Heat, type Question } from "@/lib/types";
import { DEFAULT_SETTINGS, loadCustom, loadSession, loadSettings, saveCustom, saveSession, saveSettings, type Settings } from "@/lib/storage";
import { nextQuestion, normalizedCustomText, validateCustomQuestion } from "@/lib/engine";
import { QUESTIONS } from "@/data";

type Screen = "home" | "play" | "summary" | "custom";
const initialCategory: Category = "Friends";
const isAdult = (heat: Heat) => heat >= 4;
const heatInfo = (heat: Heat) => HEAT_LEVELS[heat - 1];

function ping(enabled: boolean, frequency = 540) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.11);
    void ctx.close().catch(() => {});
  } catch {}
  if ("vibrate" in navigator) navigator.vibrate(12);
}

const exampleText = [
  "stalked my crush's profile.",
  "practiced an argument in the shower.",
  "had a crush on someone in this room.",
  "flirted just to see if they'd flirt back.",
  "had a secret romantic encounter.",
];

export default function GameApp() {
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<Question[]>([]);
  const [cursor, setCursor] = useState(0);
  const [custom, setCustom] = useState<Question[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [remaining, setRemaining] = useState(300);
  const [consentLevel, setConsentLevel] = useState<3 | 4 | 5>(3);
  const [pendingHeat, setPendingHeat] = useState<Heat | null>(null);
  const [pendingStart, setPendingStart] = useState(false);
  const [adultAge, setAdultAge] = useState(false);
  const [adultAgreement, setAdultAgreement] = useState(false);
  const [heatPrompt, setHeatPrompt] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [message, setMessage] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [customHeat, setCustomHeat] = useState<Heat>(2);
  const [customCategory, setCustomCategory] = useState<Category>(initialCategory);
  const [customError, setCustomError] = useState("");
  const lastSuggested = useRef(0);

  const current = history[cursor] ?? null;
  const total = history.length;
  const info = heatInfo(settings.heat);
  const favoritesSet = new Set(favorites);

  useEffect(() => {
    const storedSettings = loadSettings();
    const storedCustom = loadCustom();
    setSettings(storedSettings);
    setCustom(storedCustom);
    try {
      const value = JSON.parse(localStorage.getItem("nhie-v1-favorites") || "[]");
      if (Array.isArray(value)) setFavorites(value.filter(v => typeof v === "string"));
    } catch {}
    const stored = loadSession();
    if (stored && !stored.completed && stored.settings.heat <= 3 && Array.isArray(stored.historyIds)) {
      const lookup = new Map([...QUESTIONS, ...storedCustom].map(q => [q.id, q]));
      const restored = stored.historyIds.map(id => lookup.get(id)).filter((q): q is Question => Boolean(q));
      if (restored.length === stored.historyIds.length && restored.length > 0) {
        setHistory(restored);
        setCursor(Math.min(Math.max(stored.cursor, 0), restored.length - 1));
        setRemaining(Math.max(0, Math.min(300, stored.remainingSeconds)));
        setSettings(stored.settings);
        setScreen("play");
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);
  useEffect(() => {
    if (hydrated) saveCustom(custom);
  }, [custom, hydrated]);
  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem("nhie-v1-favorites", JSON.stringify(favorites)); } catch {}
    }
  }, [favorites, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    if (screen === "play" && history.length > 0) {
      saveSession({ settings, historyIds: history.map(q => q.id), cursor, remainingSeconds: remaining, completed: false });
    } else if (screen === "home" || screen === "summary") {
      saveSession(null);
    }
  }, [settings, history, cursor, remaining, screen, hydrated]);

  useEffect(() => {
    if (screen !== "play" || settings.mode !== "quickfire" || remaining <= 0 || pendingHeat || heatPrompt) return;
    const timer = window.setInterval(() => setRemaining(s => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [screen, settings.mode, remaining, pendingHeat, heatPrompt]);
  useEffect(() => {
    if (screen === "play" && settings.mode === "quickfire" && remaining === 0) setScreen("summary");
  }, [remaining, screen, settings.mode]);

  function updateSettings(patch: Partial<Settings>) {
    setSettings(previous => ({ ...previous, ...patch }));
    setMessage("");
  }
  function begin(nextSettings: Settings = settings) {
    const source = nextSettings.mode === "custom" ? custom : QUESTIONS;
    const first = nextQuestion(source, nextSettings.heat, nextSettings.category, []);
    if (!first) {
      setMessage(nextSettings.mode === "custom"
        ? "No matching questions in your pack. Add some or switch to Mixed."
        : "No questions for this combination. Try Mixed or another heat level.");
      return;
    }
    setSettings(nextSettings);
    setHistory([first]);
    setCursor(0);
    setRemaining(300);
    setExhausted(false);
    setHeatPrompt(false);
    lastSuggested.current = 0;
    setScreen("play");
    setMessage("");
    ping(nextSettings.sound, 620);
  }
  function requestHeat(level: Heat, beginAfter = false) {
    if (isAdult(level) && consentLevel < level) {
      setPendingHeat(level);
      setPendingStart(beginAfter);
      setAdultAge(false);
      setAdultAgreement(false);
      return;
    }
    const category = settings.category === "After Dark" && level !== 5 ? "Mixed" : settings.category;
    const nextSettings = { ...settings, category, heat: level };
    setSettings(nextSettings);
    setExhausted(false);
    ping(settings.sound, 380 + level * 110);
    if (beginAfter) begin(nextSettings);
  }
  function confirmHeat() {
    if (!pendingHeat || !adultAge || !adultAgreement) return;
    const heat = pendingHeat;
    setConsentLevel(heat as 4 | 5);
    const next = { ...settings, heat };
    setSettings(next);
    setPendingHeat(null);
    if (pendingStart) begin(next);
    setPendingStart(false);
  }
  function start() {
    if (isAdult(settings.heat) && consentLevel < settings.heat) {
      requestHeat(settings.heat, true);
    } else begin();
  }
  function advance() {
    if (screen !== "play" || !current) return;
    if (cursor < total - 1) {
      setCursor(i => i + 1);
      setExhausted(false);
      ping(settings.sound);
      return;
    }
    const source = settings.mode === "custom" ? custom : QUESTIONS;
    const next = nextQuestion(source, settings.heat, settings.category, history.map(q => q.id));
    if (!next) {
      setExhausted(true);
      ping(settings.sound, 250);
      return;
    }
    const count = total + 1;
    setHistory(previous => [...previous, next]);
    setCursor(count - 1);
    setExhausted(false);
    ping(settings.sound, 620);
    if (settings.autoHeat && settings.heat < 5 && count % 6 === 0 && count !== lastSuggested.current) {
      lastSuggested.current = count;
      setHeatPrompt(true);
    }
  }
  function goBack() {
    if (cursor > 0) {
      setCursor(i => i - 1);
      setExhausted(false);
      ping(settings.sound, 460);
    }
  }
  useEffect(() => {
    if (screen !== "play") return;
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT","SELECT","TEXTAREA","BUTTON"].includes(target?.tagName)) return;
      if (pendingHeat || heatPrompt) return;
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        advance();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  function finish() { setScreen("summary"); setHeatPrompt(false); setExhausted(false); ping(settings.sound, 740); }
  function goHome() { setScreen("home"); setHistory([]); setCursor(0); setHeatPrompt(false); setExhausted(false); }
  function newCustom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateCustomQuestion(customInput, custom);
    if (error) { setCustomError(error); return; }
    const text = normalizedCustomText(customInput);
    const id = "custom-" + (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));
    setCustom(previous => [...previous, { id, text, heat: customHeat, category: customCategory, custom: true }]);
    setCustomInput("");
    setCustomError("");
    setMessage("Question added to your private pack.");
  }
  function toggleFavorite() {
    if (!current) return;
    setFavorites(previous => previous.includes(current.id)
      ? previous.filter(id => id !== current.id)
      : [...previous, current.id]);
    ping(settings.sound, 800);
  }
  async function share() {
    const shareData = { title: "Never Have I Ever", text: "The truth gets hotter. Play with us!", url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        setMessage("Game link copied. Send it to the group!");
      }
    } catch {}
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }
  const heatButtons = (compact = false) => (
    <div className={compact ? "heat-choices heat-choices-compact" : "heat-choices"} role="group" aria-label="Heat level">
      {HEAT_LEVELS.map(level => (
        <button key={level.id} type="button"
          className={"heat-choice " + (settings.heat === level.id ? "selected" : "")}
          style={{ "--chip": level.color } as React.CSSProperties}
          onClick={() => requestHeat(level.id)}
          aria-pressed={settings.heat === level.id}
          aria-label={level.name + (level.id >= 4 ? " 18 plus" : "")}>
          <span className="heat-emoji" aria-hidden="true">{level.emoji}</span>
          <span className="heat-label">{level.name}</span>
          {settings.heat === level.id && <span className="heat-active-dot" />}
        </button>
      ))}
    </div>
  );
  const categorySelector = (id: string) => (
    <label className="select-wrap" htmlFor={id}>
      <span className="field-title">QUESTION CATEGORY</span>
      <select id={id} value={settings.category}
        onChange={e => updateSettings({ category: e.target.value as Category })}>
        {CATEGORIES.filter(c => c !== "After Dark" || settings.heat === 5).map(c =>
          <option key={c} value={c}>{c === "Mixed" ? "✦ All topics (best mix)" : c === "India Special" ? "🇮🇳 India / college special" : c}</option>
        )}
      </select>
    </label>
  );

  return (
    <div className={"app-shell stage-" + screen} style={{ "--heat-color": info.color } as React.CSSProperties}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient-grid" aria-hidden="true" />
      <header className="topbar container">
        <button type="button" className="brand" onClick={goHome} aria-label="Never Have I Ever, back to home">
          <span className="brand-icon"><Flame size={23} fill="currentColor" /></span>
          <span className="brand-copy">NEVER HAVE <b>I EVER<span>.</span></b></span>
        </button>
        <div className="header-right">
          <span className="header-hint"><span className="online-dot" /> THE PARTY STARTS HERE</span>
          <button className="icon-button" type="button" onClick={share} aria-label="Share game" title="Share game"><Share2 size={19} /></button>
          <button className="icon-button" type="button" onClick={() => updateSettings({ sound: !settings.sound })} aria-label={settings.sound ? "Mute sound" : "Enable sound"} title="Toggle sound">
            {settings.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>
      </header>

      {screen === "home" && (
        <main className="container home-grid">
          <section className="hero">
            <div className="eyebrow"><span className="eyebrow-star">✳</span> THE ULTIMATE PARTY CONFESSION GAME</div>
            <h1>NEVER HAVE<br /><span>I <em>EVER.</em></span></h1>
            <p className="hero-tagline">The truth gets <span>hotter.</span> <Flame size={27} fill="currentColor" aria-hidden="true" /></p>
            <p className="hero-copy">From innocent little secrets to absolute chaos. Grab your people, drop your fingers, and find out what nobody&apos;s admitting.</p>
            <div className="hero-stats" aria-label="Game features">
              <div><strong>300+</strong><span>CONFESSIONS</span></div>
              <i />
              <div><strong>05</strong><span>HEAT LEVELS</span></div>
              <i />
              <div><strong>0</strong><span>SIGN-UPS</span></div>
            </div>
            <div className="teaser-card" aria-label="Example question">
              <div className="teaser-tag"><Sparkles size={15} /> A LITTLE SNEAK PEEK</div>
              <p>&ldquo;Never have I ever <span>{exampleText[settings.heat - 1]}</span>&rdquo;</p>
              <div className="teaser-footer"><span>BE HONEST NOW...</span><span>{info.emoji} {info.name}</span></div>
            </div>
            <div className="hero-caption">✴ NO DOWNLOADS. NO AWKWARD RULES. JUST GOOD STORIES.</div>
          </section>

          <section className="setup-wrap" aria-label="Game setup">
            <div className="setup-card">
              <div className="setup-top">
                <div>
                  <span className="panel-kicker">YOUR PARTY, YOUR RULES</span>
                  <h2>Set the <i>vibe.</i></h2>
                </div>
                <div className="setup-spark"><Sparkles size={27} /></div>
              </div>
              <div className="section-heading"><span>01</span> PICK YOUR MODE</div>
              <div className="mode-grid" role="group" aria-label="Game mode">
                {MODES.map(mode => {
                  const selected = settings.mode === mode.id;
                  const Icon = mode.id === "classic" ? Shuffle : mode.id === "endless" ? InfinityIcon : mode.id === "quickfire" ? Zap : PencilLine;
                  return <button key={mode.id} type="button" className={"mode-tile " + (selected ? "selected" : "")}
                    onClick={() => updateSettings({ mode: mode.id })} aria-pressed={selected}>
                    <span className="mode-symbol"><Icon size={18} /></span>
                    <strong>{mode.name}</strong><small>{mode.description}</small>
                    {selected && <span className="tile-check"><Check size={12} /></span>}
                  </button>;
                })}
              </div>
              <div className="section-heading heat-heading"><span>02</span> CHOOSE YOUR HEAT <span className="on-fire">🔥</span></div>
              {heatButtons()}
              <div className="level-caption">
                <span style={{ color: info.color }}>{info.emoji} {info.name}</span>
                <span>{info.subtitle}</span>
              </div>
              <div className="heat-progress" aria-hidden="true"><span style={{ width: settings.heat * 20 + "%" }} /></div>
              <div className="section-heading category-heading"><span>03</span> YOUR TOPICS</div>
              {categorySelector("home-category")}
              <div className="setup-options">
                <label className="toggle-row" htmlFor="autoheat">
                  <span><Settings2 size={17} /><b>Auto Heat suggestions</b><small>Ask before turning things up</small></span>
                  <input type="checkbox" id="autoheat" checked={settings.autoHeat} onChange={e => updateSettings({ autoHeat: e.target.checked })} />
                  <span className="toggle-track" aria-hidden="true" />
                </label>
              </div>
              {message && <p className="inline-message" role="status">{message}</p>}
              <button type="button" className="start-button" onClick={start}>
                <Flame size={21} fill="currentColor" /> START PLAYING <ArrowUpRight size={22} />
              </button>
              <div className="under-button"><ShieldCheck size={14} /> No accounts, no ads, no data collection.</div>
              <button className="custom-link" type="button" onClick={() => { setScreen("custom"); setMessage(""); }}>
                <PencilLine size={15} /> Create your own questions <ChevronRight size={15} />
              </button>
            </div>
          </section>
        </main>
      )}

      {screen === "play" && current && (
        <main className="container play-layout">
          <div className="play-topline">
            <span><span className="sparkle-orange">✳</span> THE CONFESSION ZONE</span>
            <div className="play-top-actions">
              <button type="button" className="tiny-button" onClick={toggleFullscreen}><Maximize2 size={15} /> <span>FULL SCREEN</span></button>
              <button type="button" className="tiny-button" onClick={finish}><X size={16} /> <span>END GAME</span></button>
            </div>
          </div>
          <div className="play-main">
            <section className="play-center">
              <div className="session-labels">
                <span className="round-pill">ROUND {String(cursor + 1).padStart(2, "0")}</span>
                <span className="heat-pill" data-testid="active-heat"><Flame size={15} fill="currentColor" /> {info.emoji} {info.name}</span>
                {settings.mode === "quickfire" && <span className="round-pill timer-pill"><Clock3 size={15} /> {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}</span>}
              </div>
              <div className="question-card" key={current.id} data-testid="question-card">
                <div className="question-top"><span>THE QUESTION IS...</span><span>✦ {current.category.toUpperCase()} ✦</span></div>
                <div className="question-body">
                  <div className="question-quote" aria-hidden="true">&ldquo;</div>
                  <p><span>Never have I ever </span><br /><strong>{current.text.replace(/^Never have I ever\s*/i, "")}</strong></p>
                </div>
                <div className="question-bottom">
                  <span><span className="asterisk">✳</span> {settings.mode === "classic" ? "PUT A FINGER DOWN IF YOU HAVE" : "EVER DONE IT? NO JUDGMENT."}</span>
                  <button type="button" className={"favorite-button " + (favoritesSet.has(current.id) ? "is-favorite" : "")} onClick={toggleFavorite}
                    title={favoritesSet.has(current.id) ? "Remove from favorites" : "Add to favorites"}
                    aria-label={favoritesSet.has(current.id) ? "Remove favorite" : "Favorite question"}>
                    <Heart size={22} fill={favoritesSet.has(current.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
              <div className="play-buttons">
                <button type="button" className="secondary-action" onClick={goBack} disabled={cursor === 0} aria-label="Previous question"><ChevronLeft size={22}/><span>BACK</span></button>
                <button type="button" className="secondary-action" onClick={advance} aria-label="Skip question"><SkipForward size={20}/><span>SKIP</span></button>
                <button type="button" className="next-action" onClick={advance} aria-label="Next question"><span>NEXT QUESTION</span><ArrowRight size={22}/></button>
              </div>
              {exhausted && <div className="exhausted-message" role="status">You&apos;ve seen every question at this heat/category! Change the heat, select Mixed, or restart the session. No repeats here. ✨</div>}
              <div className="play-helper">
                <span><ShieldCheck size={15} /> Everyone can skip. Nobody has to explain.</span>
                <span className="keyboard-hint">← / → TO NAVIGATE</span>
              </div>
            </section>
            <aside className="play-sidebar">
              <div className="side-card side-heat">
                <span className="panel-kicker">CONTROL THE CHAOS</span>
                <h3>Turn up the <em>heat.</em></h3>
                <p>Change the vibe whenever the group feels like it. The next question matches your new heat.</p>
                {heatButtons(true)}
                <div className="heat-description">{info.emoji} <b>{info.name}</b> <span>{info.subtitle}</span></div>
                <button type="button" className="chill-link" onClick={() => requestHeat(1)}><Minus size={16} /> Back to Chill</button>
              </div>
              <div className="side-card side-options">
                <span className="panel-kicker">THE LITTLE DETAILS</span>
                {categorySelector("play-category")}
                <div className="game-stat-line"><span>QUESTIONS PLAYED</span><b>{total}</b></div>
                <div className="game-stat-line"><span>GAME MODE</span><b>{MODES.find(m => m.id === settings.mode)?.name}</b></div>
                {settings.mode === "classic" && <p className="fingers-reminder">✋ Start with 10 fingers. Put one down whenever you&apos;ve done it.</p>}
                <button type="button" className="text-action" onClick={finish}>End &amp; view summary <ArrowRight size={15}/></button>
              </div>
            </aside>
          </div>
        </main>
      )}

      {screen === "summary" && (
        <main className="container summary-layout">
          <div className="summary-glow" aria-hidden="true">✳</div>
          <span className="eyebrow">✦ WHAT A NIGHT ✦</span>
          <h1>SECRETS <em>SPILLED.</em></h1>
          <p>Some things just can&apos;t be unheard. Thanks for playing — and keeping the good stories coming.</p>
          <div className="summary-stats">
            <div><strong>{total}</strong><span>QUESTIONS PLAYED</span></div>
            <div><strong>{history.filter(q => q.heat >= 4).length}</strong><span>SPICY MOMENTS</span></div>
            <div><strong>{new Set(history.map(q => q.heat)).size}</strong><span>HEAT LEVELS EXPLORED</span></div>
          </div>
          <div className="summary-actions">
            <button className="start-button" type="button" onClick={() => begin()}><RotateCcw size={20}/> PLAY AGAIN <ArrowRight size={20}/></button>
            <button className="secondary-action" type="button" onClick={goHome}><ArrowLeft size={18}/> CHANGE SETTINGS</button>
          </div>
          <p className="summary-privacy"><ShieldCheck size={16}/> No personal answers were recorded, ever.</p>
        </main>
      )}

      {screen === "custom" && (
        <main className="container custom-page">
          <button className="tiny-button" type="button" onClick={() => { setScreen("home"); setMessage(""); }}><ArrowLeft size={17}/> BACK TO SETUP</button>
          <div className="custom-grid">
            <section className="custom-intro">
              <span className="eyebrow">✳ YOUR GAME, YOUR SECRETS</span>
              <h1>MAKE IT<br/><em>PERSONAL.</em></h1>
              <p>Create your own prompts for the group. They stay on this device, not a server. You can delete them anytime.</p>
              <div className="custom-benefit"><ShieldCheck size={19}/> Private on this device</div>
              <div className="custom-benefit"><Heart size={19}/> Made for your own friend group</div>
              <div className="custom-benefit"><Flame size={19}/> Assign any heat level</div>
            </section>
            <section className="setup-card custom-editor">
              <span className="panel-kicker">ADD A CONFESSION</span>
              <h2>Make them <i>spill.</i></h2>
              <form onSubmit={newCustom}>
                <label htmlFor="custom-text" className="field-title">YOUR QUESTION</label>
                <textarea id="custom-text" value={customInput} onChange={e => setCustomInput(e.target.value)}
                  placeholder="Never have I ever..." maxLength={180} rows={3} aria-label="Your question" />
                <div className="custom-selectors">
                  <label htmlFor="custom-level"><span className="field-title">HEAT LEVEL</span>
                    <select id="custom-level" value={customHeat} onChange={e => setCustomHeat(Number(e.target.value) as Heat)}>
                      {HEAT_LEVELS.map(l => <option key={l.id} value={l.id}>{l.emoji} {l.name}{l.id>=4?" (18+)":""}</option>)}
                    </select>
                  </label>
                  <label htmlFor="custom-cat"><span className="field-title">CATEGORY</span>
                    <select id="custom-cat" value={customCategory} onChange={e => setCustomCategory(e.target.value as Category)}>
                      {CATEGORIES.filter(c => c !== "Mixed" && c !== "India Special").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
                {customError && <p className="inline-message" role="alert">{customError}</p>}
                {message && <p className="success-message" role="status">{message}</p>}
                <button type="submit" className="start-button"><Plus size={20}/> ADD TO PACK <ArrowRight size={20}/></button>
              </form>
              <div className="custom-list-head"><b>YOUR PRIVATE PACK</b><span>{custom.length} QUESTIONS</span></div>
              <div className="custom-list">
                {custom.length === 0 && <p className="custom-empty">Your pack is empty. Write the first question above!</p>}
                {custom.map(q => <div key={q.id} className="custom-item">
                  <div><span>{heatInfo(q.heat).emoji} {heatInfo(q.heat).name}</span><p>{q.text}</p></div>
                  <button type="button" aria-label={"Remove question " + q.text} title="Remove question" onClick={() => setCustom(prev => prev.filter(item => item.id !== q.id))}><X size={17}/></button>
                </div>)}
              </div>
            </section>
          </div>
        </main>
      )}

      <footer className="footer container"><span>✳ GOOD STORIES MAKE GREAT NIGHTS.</span><span>MADE FOR FRIEND GROUPS <span className="footer-heart">♥</span> PART OF <b>MINGLECADE</b></span></footer>

      {pendingHeat && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="consent-title">
            <button className="modal-close" type="button" aria-label="Close" onClick={() => { setPendingHeat(null); setPendingStart(false); }}><X size={20}/></button>
            <div className="modal-emoji">{heatInfo(pendingHeat).emoji}</div>
            <span className="panel-kicker">BEFORE WE TURN IT UP</span>
            <h2 id="consent-title">{heatInfo(pendingHeat).name} <em>is 18+.</em></h2>
            <p>This level has more personal dating and intimacy questions. Make sure everyone is comfortable — and remember, anyone can skip for any reason.</p>
            <label className="consent-check"><input type="checkbox" checked={adultAge} onChange={e => setAdultAge(e.target.checked)}/><span>Everyone playing is at least 18.</span></label>
            <label className="consent-check"><input type="checkbox" checked={adultAgreement} onChange={e => setAdultAgreement(e.target.checked)}/><span>Everyone in the group agrees to this level and can skip without explaining.</span></label>
            <button type="button" className="start-button" disabled={!adultAge || !adultAgreement} onClick={confirmHeat}><ShieldCheck size={20}/> UNLOCK THIS HEAT <ArrowRight size={19}/></button>
            <button type="button" className="modal-cancel" onClick={() => { setPendingHeat(null); setPendingStart(false); }}>Keep things lighter</button>
          </div>
        </div>
      )}

      {heatPrompt && screen === "play" && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="rising-title">
            <div className="modal-emoji">🌶️</div>
            <span className="panel-kicker">THE TEMPERATURE IS RISING</span>
            <h2 id="rising-title">Getting <em>comfortable?</em></h2>
            <p>That was a fun round. Want to turn up the heat? The whole group decides — no automatic upgrades.</p>
            <button type="button" className="start-button" onClick={() => { setHeatPrompt(false); requestHeat(Math.min(5, settings.heat + 1) as Heat); }}><Flame size={19}/> TURN UP THE HEAT <ArrowRight size={18}/></button>
            <button type="button" className="modal-cancel" onClick={() => setHeatPrompt(false)}>Stay right here</button>
            <button type="button" className="modal-cancel" onClick={() => { setHeatPrompt(false); requestHeat(1); }}>Lower to Chill</button>
          </div>
        </div>
      )}
      {!hydrated && <span className="sr-only">Loading your game preferences</span>}
    </div>
  );
}
