"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Orders", href: "/user/orders", authOnly: true },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]         = useState("");
  const [mounted, setMounted]     = useState(false);
  const { cartCount } = useCart();
  const { user, isAuthenticated, initialized, logout } = useAuth();

  /* ---------------------------
     ROLE DASHBOARD ROUTING
  ---------------------------- */
  const dashboardHref = useMemo(() => {
    if (user?.role === "seller") return "/seller/dashboard";
    if (user?.role === "admin") return "/admin/dashboard";
    return "/user/dashboard";
  }, [user]);

  const visibleNavLinks = useMemo(
    () => NAV_LINKS.filter((l) => !l.authOnly || isAuthenticated),
    [isAuthenticated]
  );

  /* ---------------------------
     ACTIVE ROUTE CHECK (SMART)
  ---------------------------- */
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  /* ---------------------------
     SCROLL EFFECT
  ---------------------------- */
  useEffect(() => {
    setMounted(true);
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* ---------------------------
     SEARCH HANDLER
  ---------------------------- */
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch {}
  };

  return (
    <header
      className={`
        sticky top-0 z-50 w-full transition-all duration-200
        ${scrolled
          ? "bg-white/95 backdrop-blur-md border-b shadow-sm"
          : "bg-white border-b border-gray-100"}
      `}
    >
      <div className="section-container">
        <div className="flex items-center h-16 gap-4">

          {/* ---------------- LOGO ---------------- */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl font-extrabold tracking-tight">
              Aura<span className="text-indigo-500">kriti</span>
            </span>
          </Link>

          {/* ---------------- DESKTOP NAV ---------------- */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {visibleNavLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={label === "Dashboard" ? dashboardHref : href}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition
                  ${isActive(href)
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100"}
                `}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ---------------- SEARCH DESKTOP ---------------- */}
          <div className="hidden lg:flex flex-1 max-w-sm">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="input bg-gray-50 text-sm pl-10"
              />
              <SearchIcon className="absolute left-3 top-3 text-gray-400" />
            </form>
          </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
  href="/wishlist"
  className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#5d4b36] shadow-sm transition-colors duration-300 hover:bg-[#fff6e6]"
  title="Wishlist"
>
  ❤️
</Link>
          {/* Cart Button */}
          {canUseCart && (
            <Link
              href="/user/cart"
              className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#5d4b36] shadow-sm transition-colors duration-300 hover:bg-[#fff6e6]"
              title="Shopping Cart"
            >
              <SearchIcon />
            </button>

            {/* Dashboard */}
            {isAuthenticated && (
              <Link
                href={dashboardHref}
                className="hidden sm:inline-flex btn btn-ghost btn-sm"
              >
                Dashboard
              </Link>
            )}

            {/* Cart */}
            <Link href="/user/cart" className="icon-btn relative">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {initialized && isAuthenticated ? (
              <>
                <span className="hidden xl:block text-sm text-gray-600">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex btn btn-ghost btn-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-primary btn-sm hidden sm:inline-flex">
                  Login
                </Link>
              </>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden icon-btn"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* ---------------- MOBILE SEARCH ---------------- */}
        {searchOpen && (
          <div className="lg:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="input pl-10"
                autoFocus
              />
              <SearchIcon className="absolute left-3 top-3 text-gray-400" />
            </form>
          </div>
        )}

        {/* ---------------- MOBILE MENU ---------------- */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="section-container py-3 flex flex-col gap-2">
              {visibleNavLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
                >
                  {label}
                </Link>
              ))}

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

              {isAuthenticated ? (
                <>
                  <Link href={dashboardHref} className="btn btn-sm btn-secondary">
                    Dashboard
                  </Link>
                  <Link href="/user/cart" className="btn btn-sm btn-ghost">
                    Cart
                  </Link>
                  <button onClick={handleLogout} className="btn btn-sm btn-ghost">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-sm btn-primary">
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* ICON STYLE */}
      <style>{`
        .icon-btn {
          width: 36px;
          height: 36px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius: 10px;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .icon-btn:hover {
          background: #f3f4f6;
        }
      `}</style>
    </header>
  );
}

/* ---------------- ICONS ---------------- */
function SearchIcon({ className = "" }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2 13h13l3-8H6"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}