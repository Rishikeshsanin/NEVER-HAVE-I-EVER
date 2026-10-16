import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Never Have I Ever — The Truth Gets Hotter",
  description: "The ultimate neon party confession game. Five heat levels, 300+ questions, and endless stories. No login. Just friends.",
  metadataBase: new URL("https://never-have-i-ever-game.vercel.app"),
  openGraph: {
    title: "Never Have I Ever — The Truth Gets Hotter",
    description: "Innocent laughs to after-dark secrets. Your next game night starts here.",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Never Have I Ever party game" }],
    type: "website",
  },
  icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#110d20" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
