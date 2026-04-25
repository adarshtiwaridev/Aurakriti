"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const NAV_LINKS = [
  { label: "Home",     href: "/" },
  { label: "Shop",     href: "/products" },
  { label: "Deals",    href: "/deals" },
  { label: "Brands",   href: "/brands" },
  { label: "About",    href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]         = useState("");

  // Pull cart count from Redux (adjust selector to match your store shape)
  const cartCount = useSelector(
    (state) => state.cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  );

  const notifCount = useSelector(
    (state) => state.notifications?.unread ?? 0
  );

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <header
        className={`
          sticky top-0 z-50 w-full transition-all duration-200
          ${scrolled
            ? "bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
            : "bg-white border-b border-gray-100"}
        `}
      >
        <div className="section-container">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 mr-4">
              <span
                className="text-xl font-extrabold tracking-tight text-gray-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Aura<span className="text-indigo-500">kriti</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {NAV_LINKS.map(({ label, href }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${active
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
                    `}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Search bar — desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-sm">
              <div className="relative w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search products, brands…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input pl-8 py-2 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  style={{ borderRadius: "var(--radius-full)", paddingLeft: "2rem" }}
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto md:ml-0">

              {/* Mobile search toggle */}
              <button
                className="md:hidden icon-btn"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <SearchIcon />
              </button>

              {/* Notifications */}
              <Link href="/user/notifications" className="icon-btn relative" aria-label="Notifications">
                <BellIcon />
                {notifCount > 0 && (
                  <span className="
                    absolute -top-1 -right-1
                    bg-red-500 text-white text-[9px] font-bold
                    w-4 h-4 rounded-full flex items-center justify-center
                  ">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="icon-btn relative" aria-label="Cart">
                <CartIcon />
                {cartCount > 0 && (
                  <span className="
                    absolute -top-1 -right-1
                    bg-indigo-500 text-white text-[9px] font-bold
                    w-4 h-4 rounded-full flex items-center justify-content-center
                    flex items-center justify-center
                  ">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex btn btn-primary btn-sm ml-2"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="hidden sm:inline-flex btn btn-ghost btn-sm"
              >
                Register
              </Link>

              {/* Hamburger — mobile */}
              <button
                className="md:hidden icon-btn ml-1"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {searchOpen && (
            <div className="md:hidden pb-3">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search products…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input pl-8"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile nav menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="section-container py-3 flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={`
                    px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${pathname === href
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-700 hover:bg-gray-100"}
                  `}
                >
                  {label}
                </Link>
              ))}
              <hr className="my-1 border-gray-100" />
              <Link href="/auth/login"  className="btn btn-primary btn-sm w-full justify-center mt-1">Sign in</Link>
              <Link href="/auth/signup" className="btn btn-ghost btn-sm w-full justify-center mt-1">Register</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Icon button shared style — injected here for convenience */}
      <style>{`
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: var(--radius-md);
          background: transparent; border: none; cursor: pointer; color: var(--gray-600);
          transition: background 0.15s, color 0.15s; position: relative;
        }
        .icon-btn:hover { background: var(--gray-100); color: var(--gray-900); }
      `}</style>
    </>
  );
}

/* ── Inline SVG icons ─────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.51l1.65-8.49H6"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}




