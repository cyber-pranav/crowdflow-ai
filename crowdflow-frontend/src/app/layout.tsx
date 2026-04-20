import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrowdFlow AI — Intelligent Stadium Management",
  description:
    "Real-time crowd intelligence, predictive analytics, smart routing, and AI-powered assistance for live stadium events.",
  keywords: [
    "crowd management",
    "stadium",
    "AI",
    "real-time",
    "heatmap",
    "pathfinding",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0c0e12" />
        <meta name="color-scheme" content="dark" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface min-h-dvh antialiased selection:bg-primary/30">
        {/* Skip to main content — accessibility landmark */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
