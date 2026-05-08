import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Providers } from "./providers";
import Navbar from "../components/ecommerce/Navbar";
import Footer from "@/components/Footer";
import SkipLink from "@/components/SkipLink";
import { getAppUrl, getAppUrlObject } from "@/lib/app-url";
import "./globals.css";

/* ── Google Fonts ───────────────────────────────────────────────── */
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
  variable: "--font-playfair",
});

/* ── Metadata ───────────────────────────────────────────────── */
export const metadata = {
  title: {
    default: "Aurakriti — Shop Smarter, Live Better",
    template: "%s | Aurakriti",
  },
  description:
    "Discover thousands of curated products from trusted brands. Fast delivery, easy returns, and deals every day.",
  keywords: ["ecommerce", "online shopping", "deals", "products", "brands"],
  authors: [{ name: "Aurakriti" }],
  creator: "Aurakriti",
  metadataBase: getAppUrlObject(),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: getAppUrl(),
    siteName: "Aurakriti",
    title: "Aurakriti — Shop Smarter, Live Better",
    description:
      "Discover thousands of curated products from trusted brands.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aurakriti",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurakriti — Shop Smarter, Live Better",
    description:
      "Discover thousands of curated products from trusted brands.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

/* ── Viewport ───────────────────────────────────────────────── */
export const viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
};

/* ── Root Layout ────────────────────────────────────────────── */
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${playfairDisplay.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
      </head>
      <body
        style={{
          fontFamily: "var(--font-geist)",
          background: "var(--surface-page)",
          color: "var(--gray-900)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Redux + any other client providers */}
        <Providers>

          {/* ── Skip to content (accessibility) ── */}
          <SkipLink />

          {/* ── Navbar ── */}
          <Navbar />

          {/* ── Page content ── */}
          <main id="main-content" style={{ flex: 1 }}>
            {children}
          </main>

          {/* ── Footer ── */}
          <Footer />

          {/* ── Global toast container (optional) ── */}
          <div id="toast-root" />

        </Providers>
      </body>
    </html>
  );
}
