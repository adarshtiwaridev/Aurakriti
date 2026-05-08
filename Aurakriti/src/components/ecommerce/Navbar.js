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
  const { cartCount } = useCart();
  const { user, isAuthenticated, initialized, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for dynamic counts
  useEffect(() => {
    setMounted(true);
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const dashboardHref = useMemo(() => {
    if (user?.role === "seller") return "/seller/dashboard";
    if (user?.role === "admin") return "/admin/dashboard";
    return "/user/dashboard";
  }, [user]);

  const visibleNavLinks = useMemo(
    () => NAV_LINKS.filter((l) => !l.authOnly || isAuthenticated),
    [isAuthenticated]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(query)}`);
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-[60] w-full transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-white"
        } border-b border-gray-100`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* LOGO */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-black tracking-tighter text-gray-900">
                Aura<span className="text-indigo-600">kriti</span>
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  href={label === "Dashboard" ? dashboardHref : href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    pathname === href
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* SEARCH DESKTOP */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search unique crafts..."
                  className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <SearchIcon className="absolute left-3 top-2.5 text-gray-400" />
              </form>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
              <Link href="/wishlist" className="hidden sm:flex icon-btn" title="Wishlist">
                <HeartIcon />
              </Link>

              <Link href="/user/cart" className="icon-btn relative">
                <CartIcon />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              <div className="hidden md:block h-6 w-[1px] bg-gray-200 mx-2" />

              {initialized && (
                isAuthenticated ? (
                  <Link href={dashboardHref} className="hidden md:flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                      {user?.name?.charAt(0)}
                    </div>
                  </Link>
                ) : (
                  <Link href="/auth/login" className="hidden md:block bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-800 transition">
                    Login
                  </Link>
                )
              )}

              <button className="md:hidden icon-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE OVERLAY MENU */}
        <div className={`fixed inset-0 z-50 md:hidden transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-3/4 bg-white shadow-xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <span className="font-bold text-lg">Menu</span>
                    <button onClick={() => setMenuOpen(false)}><CloseIcon /></button>
                </div>
                <nav className="flex flex-col gap-4">
                    {visibleNavLinks.map((link) => (
                        <Link 
                            key={link.label} 
                            href={link.href} 
                            onClick={() => setMenuOpen(false)}
                            className="text-xl font-semibold text-gray-800 border-b pb-2 border-gray-50"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {isAuthenticated && (
                        <button 
                            onClick={() => { logout(); setMenuOpen(false); }}
                            className="text-xl font-semibold text-red-500 text-left"
                        >
                            Logout
                        </button>
                    )}
                </nav>
            </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION (UX BEST PRACTICE) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-[60] flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex flex-col items-center gap-1">
            <HomeIcon className={pathname === "/" ? "text-indigo-600" : "text-gray-400"} />
            <span className={`text-[10px] ${pathname === "/" ? "text-indigo-600 font-bold" : "text-gray-400"}`}>Home</span>
        </Link>
        <Link href="/shop" className="flex flex-col items-center gap-1">
            <SearchIcon className={pathname === "/shop" ? "text-indigo-600" : "text-gray-400"} />
            <span className={`text-[10px] ${pathname === "/shop" ? "text-indigo-600 font-bold" : "text-gray-400"}`}>Shop</span>
        </Link>
        <Link href="/user/cart" className="flex flex-col items-center gap-1 relative">
            <CartIcon className={pathname === "/user/cart" ? "text-indigo-600" : "text-gray-400"} />
            <span className={`text-[10px] ${pathname === "/user/cart" ? "text-indigo-600 font-bold" : "text-gray-400"}`}>Cart</span>
        </Link>
        <Link href={isAuthenticated ? dashboardHref : "/auth/login"} className="flex flex-col items-center gap-1">
            <UserIcon className={pathname.includes("/dashboard") ? "text-indigo-600" : "text-gray-400"} />
            <span className={`text-[10px] ${pathname.includes("/dashboard") ? "text-indigo-600 font-bold" : "text-gray-400"}`}>Account</span>
        </Link>
      </div>

      <style jsx>{`
        .icon-btn {
          @apply p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700;
        }
      `}</style>
    </>
  );
}

/* ---------------- ICONS ---------------- */
function HomeIcon({ className }) {
    return <svg className={className} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
}
function UserIcon({ className }) {
    return <svg className={className} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
}
function HeartIcon() {
    return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
}
function SearchIcon({ className = "" }) {
  return <svg className={className} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
}
function CartIcon({ className = "" }) {
  return <svg className={className} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
}
function MenuIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16m-7 6h7"/></svg>
}
function CloseIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l18 18"/></svg>
}