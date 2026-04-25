import { Providers } from "./providers";
import Navbar from "../components/ecommerce/Navbar";
import Footer from "@/components/Footer";
import { getAppUrl, getAppUrlObject } from "@/lib/app-url";
import "./globals.css";

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
    >
      <body
        style={{
          fontFamily: "var(--font-body)",
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
          <a
            href="#main-content"
            style={{
              position: "absolute",
              left: "-9999px",
              top: "auto",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
            onFocus={(e) => {
              e.target.style.left = "1rem";
              e.target.style.top = "1rem";
              e.target.style.width = "auto";
              e.target.style.height = "auto";
              e.target.style.zIndex = 9999;
              e.target.style.background = "var(--brand-500)";
              e.target.style.color = "#fff";
              e.target.style.padding = "0.5rem 1rem";
              e.target.style.borderRadius = "var(--radius-md)";
            }}
            onBlur={(e) => {
              e.target.style.left = "-9999px";
            }}
          >
            Skip to main content
          </a>

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
