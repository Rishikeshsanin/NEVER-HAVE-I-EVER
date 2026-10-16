# NEVER HAVE I EVER 🔥

**The truth gets hotter.** A fast, private, mobile-first party confession game made for friend groups and Minglecade.

Repository: https://github.com/Rishikeshsanin/NEVER-HAVE-I-EVER
Minglecade: https://minglecade.vercel.app

## How to play

1. Pick a mode, heat level, and topic. No account or separate phones needed.
2. Read the confession aloud: "Never have I ever..."
3. In Classic mode, start with ten fingers and lower one for each thing you've done.
4. Tell a story only if you want to. Anyone can skip a question without explaining.
5. Tap Next or Skip. Adjust the heat whenever the group agrees.

### Heat levels

| Heat | Tone | Requirements |
|---|---|---|
| 😇 Chill | Easy icebreakers | All |
| 😂 Funny | Everyday embarrassment and chaos | All |
| 👀 Juicy | Crushes, friends, harmless secrets | All |
| 🌶️ Spicy | Bolder romantic stories | Explicit group 18+ confirmation |
| 😈 After Dark | Non-graphic adult relationship experiences | Explicit group 18+ confirmation |

Heat never increases automatically. Auto Heat can suggest a change after every six new questions, but only the players can accept it. Mature levels also require two group-consent checkboxes.

### Modes

- Classic: physical ten-finger game, no recorded responses.
- Endless: an open-ended party session.
- Quick Fire: five-minute countdown.
- My Questions: create a private custom pack with its own heat and category.

The question bank has 301 original questions: 61 Chill, 60 Funny, 60 Juicy, 60 Spicy, and 60 After Dark. Includes India/college-themed questions across the first four levels.

## Features

Neon mobile-first interface, keyboard left/right navigation, optional fullscreen and sound, reduced-motion support, accessible buttons, question history, favorites, sharing, no-repeat active sessions, clear pool exhaustion, one-tap back to Chill, and tab-scoped refresh recovery for non-mature sessions.

Settings, favorites, and custom questions are stored locally on the device. No personal confessions are stored. The app does not use a database, user accounts, analytics, trackers, or alcohol mechanics. Custom questions are private but are not moderated.

## Technology

Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Lucide React, Vitest, Playwright, GitHub Actions, and Vercel static hosting.

- src/app: Next routes and styling
- src/components/game-app.tsx: party screens and game interaction
- src/lib/engine.ts: shared question engine and validation
- src/lib/storage.ts: local-only persistence
- src/data: curated library by heat level
- src/lib/engine.test.ts: logic tests
- e2e/game.spec.ts: browser acceptance tests
- .github/workflows/ci.yml: automated lint, typecheck, test, and build

## Run locally

Node.js 22 recommended.

    npm install
    npm run dev

Open http://localhost:3000.

## Quality checks

    npm run lint
    npm run typecheck
    npm test
    npm run build
    npx playwright install chromium
    npm run test:e2e

## Deploy

Import Rishikeshsanin/NEVER-HAVE-I-EVER to Vercel as a Next.js project with root directory /. Static export is configured in next.config.ts. No environment variables needed. Vercel's Git integration handles deployments; GitHub Actions validates commits.

## Privacy and respect

Players can skip any prompt. No pressure to disclose sensitive information. Levels 4 and 5 are for consenting adults only, with explicit group confirmation. Changing heat does not bypass consent. Refreshing a mature session returns to setup so the group can opt in again.

## Roadmap

Optional share graphics, custom-pack import/export, better party presentation, and Minglecade listing after the standalone experience has been verified.

This repository is independent; Minglecade and other game repositories are not modified.
