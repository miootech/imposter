import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Imposter",
  description: "Lokales Secret-Role-/Impostor-Partyspiel für 3–12 Spieler. 100% offline. Keine Accounts.",
  keywords: ["Imposter", "Impostor", "Secret Role", "Party Game", "Pass and Play", "Offline"],
  authors: [{ name: "Imposter" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Imposter",
    description: "Lokales Pass-and-Play Partyspiel für 3–12 Spieler",
    type: "website",
    images: [{ url: "/logo.svg", width: 512, height: 512, alt: "Imposter" }],
  },
  twitter: {
    card: "summary",
    title: "Imposter",
    description: "Lokales Pass-and-Play Partyspiel für 3–12 Spieler",
    images: ["/logo.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#B8C0EC",
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
