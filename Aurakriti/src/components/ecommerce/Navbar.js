"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

const NAV_LINKS = [
  { label: "Home",     href: "/" },
  { label: "Shop",     href: "/shop" },
  { label: "Dashboard", href: "/user/dashboard", authOnly: true },
  { label: "Orders",   href: "/user/orders", authOnly: true },
  { label: "About",    href: "/about" },
  { label: "Contact",  href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]         = useState("");
  const [mounted, setMounted]     = useState(false);
  const { cartCount } = useCart();
  const { user, isAuthenticated, initialized, logout } = useAuth();

  const dashboardHref = user?.role === "seller"
    ? "/seller/dashboard"
    : user?.role === "admin"
      ? "/admin/dashboard"
      : "/user/dashboard";

  const visibleNavLinks = NAV_LINKS.filter((link) => !link.authOnly || isAuthenticated);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch {
      // Keep UI responsive even if logout cleanup fails.
    }
  };

  useEffect(() => {
    setMounted(true);
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
              {visibleNavLinks.map(({ label, href }) => {
                const resolvedHref = label === "Dashboard" ? dashboardHref : href;
                const active = pathname === resolvedHref;
                return (
                  <Link
                    key={label}
                    href={resolvedHref}
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

            <div className="hidden lg:flex items-center flex-1 max-w-sm">
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
                  className="input py-2 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  style={{ borderRadius: "var(--radius-full)", paddingLeft: "2rem" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <button
                className="lg:hidden icon-btn"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <SearchIcon />
              </button>

              {isAuthenticated ? (
                <Link
                  href={dashboardHref}
                  className="hidden sm:inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <DashboardIcon />
                  <span className="ml-2">Dashboard</span>
                </Link>
              ) : null}

              <Link href="/user/cart" className="icon-btn relative" aria-label="Cart">
                <CartIcon />
                {mounted && cartCount > 0 && (
                  <span className="
                    absolute -top-1 -right-1
                    bg-indigo-500 text-white text-[9px] font-bold
                    w-4 h-4 rounded-full flex items-center justify-center
                  ">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {initialized && isAuthenticated ? (
                <>
                  <span className="hidden xl:block px-3 text-sm font-medium text-slate-600">
                    {user?.name || "Account"}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden sm:inline-flex btn btn-ghost btn-sm ml-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="hidden sm:inline-flex btn btn-primary btn-sm ml-2"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="hidden sm:inline-flex btn btn-ghost btn-sm"
                  >
                    Register
                  </Link>
                </>
              )}

              <button
                className="md:hidden icon-btn ml-1"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="lg:hidden pb-3">
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
                  className="input"
                  autoFocus
                  style={{ paddingLeft: "2rem" }}
                />
              </div>
            </div>
          )}
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="section-container py-3 flex flex-col gap-1">
              {visibleNavLinks.map(({ label, href }) => {
                const resolvedHref = label === "Dashboard" ? dashboardHref : href;
                const active = pathname === resolvedHref;
                return (
                  <Link
                    key={label}
                    href={resolvedHref}
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
              <hr className="my-1 border-gray-100" />
              {initialized && isAuthenticated ? (
                <>
                  <Link href={dashboardHref} className="btn btn-secondary btn-sm w-full justify-center mt-1">Open Dashboard</Link>
                  <Link href="/user/cart" className="btn btn-ghost btn-sm w-full justify-center mt-1">View Cart</Link>
                  <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm w-full justify-center mt-1">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-primary btn-sm w-full justify-center mt-1">Login</Link>
                  <Link href="/auth/register" className="btn btn-ghost btn-sm w-full justify-center mt-1">Register</Link>
                </>
              )}
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

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.51l1.65-8.49H6"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
      <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
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




