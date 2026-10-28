"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notificationService";
import { toast } from "sonner";
import {
  Search,
  Heart,
  ShoppingBag,
  Bell,
  Menu,
  X,
  Sparkles,
  Camera,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Package
} from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Necklaces", href: "/shop?category=necklaces" },
  { label: "Earrings", href: "/shop?category=earrings" },
  { label: "Bracelets", href: "/shop?category=bracelets" },
  { label: "Rings", href: "/shop?category=rings" },
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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") {
      return;
    }

    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const data = await getNotifications({ limit: 8 });
        if (!isMounted) return;
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unreadCount || 0));
      } catch {
        if (!isMounted) return;
      }
    };

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 12000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [isAuthenticated]);

  const dashboardHref = useMemo(() => {
    if (user?.role === "seller") return "/seller/dashboard";
    if (user?.role === "admin") return "/admin/dashboard";
    return "/user/dashboard";
  }, [user]);

  const showGuestActions = initialized ? !isAuthenticated : true;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    setUserDropdownOpen(false);
    setNotificationOpen(false);
    router.replace("/auth/login");
  };

  const openNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((entry) => (entry.id === notification.id ? { ...entry, isRead: true } : entry))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotificationOpen(false);

      if (notification.orderId) {
        if (user?.role === "seller") {
          router.push("/seller/dashboard");
          return;
        }

        if (user?.role === "admin") {
          router.push("/admin/orders");
          return;
        }

        router.push("/user/orders");
      }
    } catch (error) {
      toast.error(error.message || "Failed to open notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((entry) => ({ ...entry, isRead: true })));
      setUnreadCount(0);
      toast.success("Notifications marked as read");
    } catch (error) {
      toast.error(error.message || "Failed to update notifications");
    }
  };

  return (
    <>
      {/* ── TOP LUXURY ANNOUNCEMENT BANNER ────────────────────── */}
      <div className="bg-[#0B0F17] text-[#EDE8DD] text-[11px] font-medium tracking-[0.14em] uppercase py-2 px-4 border-b border-[#C5A059]/25 text-center transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-2 text-stone-400 text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>100% Certified Ethical Maison</span>
          </div>

          <div className="mx-auto flex items-center gap-2 sm:mx-0">
            <span className="text-[#C5A059]">✦</span>
            <span>Complimentary Insured Courier • Virtual 3D & AR Try-On Suite • Lifetime Atelier Care</span>
            <span className="text-[#C5A059]">✦</span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-[11px] tracking-normal text-stone-300">
            <Link href="/about" className="hover:text-[#E5C378] transition">Atelier</Link>
            <span className="text-stone-600">|</span>
            <Link href="/contact" className="hover:text-[#E5C378] transition">Concierge</Link>
          </div>
        </div>
      </div>

      {/* ── STICKY GLASS HEADER ───────────────────────────────── */}
      <header
        className={`sticky top-0 z-[60] w-full transition-all duration-300 ${
          scrolled ? "bg-[#FDFBF7]/95 backdrop-blur-md shadow-sm border-b border-[#EAE6DF]" : "bg-[#FDFBF7] border-b border-[#EAE6DF]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* BRAND LOGO */}
            <Link href="/" className="flex-shrink-0 group flex flex-col">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B0F17] font-serif transition-colors group-hover:opacity-90">
                AURA<span className="text-[#C5A059] font-normal italic ml-0.5">KRITI</span>
              </span>
              <span className="text-[8px] uppercase tracking-[0.32em] text-[#8A92A0] font-semibold -mt-1">
                Haute Joaillerie
              </span>
            </Link>

            {/* DESKTOP NAV LINKS */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {NAV_LINKS.map(({ label, href }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`px-3 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 relative ${
                      isActive
                        ? "text-[#0B0F17] font-bold"
                        : "text-[#545B67] hover:text-[#0B0F17]"
                    }`}
                  >
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C5A059]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* SEARCH DESKTOP */}
            <div className="hidden md:flex flex-1 max-w-xs xl:max-w-sm mx-2">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search solitaire, necklaces, rings..."
                  className="w-full bg-[#FFFFFF] border border-[#EAE6DF] rounded-full py-2 pl-9 pr-4 text-xs font-medium text-[#0B0F17] placeholder:text-[#9BA3AF] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all shadow-sm"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9BA3AF]" />
              </form>
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* AR TRY-ON BADGE / BUTTON */}
              <Link
                href="/shop"
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#C5A059] text-[10px] font-bold tracking-wider text-[#8A6827] uppercase hover:bg-[#F7EEDB] transition shadow-xs"
                title="Explore collections with Virtual AR Try-On"
              >
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>AR Salon</span>
              </Link>

              {/* WISHLIST */}
              <Link
                href="/wishlist"
                className="p-2.5 rounded-full hover:bg-[#F7F5F0] text-[#545B67] hover:text-[#0B0F17] transition"
                title="Saved Wishlist"
              >
                <Heart className="w-4 h-4" />
              </Link>

              {/* CART */}
              <Link
                href="/user/cart"
                className="p-2.5 rounded-full hover:bg-[#F7F5F0] text-[#545B67] hover:text-[#0B0F17] transition relative"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute 0 top-1 right-1 bg-[#C5A059] text-[#0B0F17] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* NOTIFICATIONS */}
              {!showGuestActions && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen((prev) => !prev);
                      setUserDropdownOpen(false);
                    }}
                    className="p-2.5 rounded-full hover:bg-[#F7F5F0] text-[#545B67] hover:text-[#0B0F17] transition relative"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-4 h-4 rounded-full bg-[#BE123C] px-1 text-[9px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 top-12 z-[80] w-80 sm:w-96 overflow-hidden rounded-2xl border border-[#EAE6DF] bg-white shadow-xl animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between border-b border-[#EAE6DF] px-4 py-3 bg-[#FDFBF7]">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#0B0F17]">Notifications</p>
                          <p className="text-[11px] text-[#64748B]">{unreadCount} unread update{unreadCount !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          disabled={unreadCount === 0}
                          className="text-[11px] font-semibold text-[#C5A059] hover:underline disabled:opacity-40"
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[#EAE6DF]">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs text-[#64748B]">
                            No notifications at this time.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => openNotification(n)}
                              className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[#FDFBF7] ${
                                n.isRead ? "bg-white" : "bg-[#FDFBF7]/80"
                              }`}
                            >
                              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.isRead ? "bg-[#CBD5E1]" : "bg-[#C5A059]"}`} />
                              <div className="min-w-0 flex-1">
                                <span className="block text-xs font-bold text-[#0B0F17]">{n.title}</span>
                                <span className="mt-0.5 block text-xs text-[#64748B] leading-relaxed">{n.message}</span>
                                <span className="mt-1 block text-[10px] text-[#94A3B8]">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* USER PROFILE / AUTH BUTTONS */}
              {showGuestActions ? (
                <div className="hidden sm:flex items-center gap-2 ml-1">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#0B0F17] hover:text-[#C5A059] transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 rounded-full bg-[#0B0F17] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#161F2E] transition shadow-xs"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen((prev) => !prev);
                      setNotificationOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 pl-2 rounded-full border border-[#EAE6DF] bg-white hover:border-[#C5A059] transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0B0F17] text-[#EDE8DD] flex items-center justify-center text-xs font-bold uppercase">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                    <span className="hidden md:inline text-xs font-semibold text-[#0B0F17] max-w-[6rem] truncate">
                      {user?.name || "Account"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400 mr-1" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 top-12 z-[80] w-52 overflow-hidden rounded-2xl border border-[#EAE6DF] bg-white shadow-xl py-2 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-[#EAE6DF]">
                        <p className="text-xs font-bold text-[#0B0F17] truncate">{user?.name}</p>
                        <p className="text-[10px] text-[#64748B] truncate">{user?.email}</p>
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#F7EEDB] text-[#8A6827]">
                          {user?.role || "Member"}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          href={dashboardHref}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0B0F17] hover:bg-[#FDFBF7] transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#C5A059]" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/user/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0B0F17] hover:bg-[#FDFBF7] transition"
                        >
                          <Package className="w-4 h-4 text-[#C5A059]" />
                          <span>My Orders</span>
                        </Link>
                      </div>

                      <div className="border-t border-[#EAE6DF] pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#BE123C] hover:bg-[#FFF1F2] transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MOBILE MENU TOGGLE */}
              <button
                type="button"
                className="lg:hidden p-2.5 rounded-full hover:bg-[#F7F5F0] text-[#0B0F17] transition"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE OVERLAY MENU ───────────────────────────────── */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-[#0B0F17]/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#FDFBF7] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-[#EAE6DF]">
                  <div>
                    <span className="text-xl font-bold font-serif text-[#0B0F17]">AURA<span className="text-[#C5A059] italic font-normal">KRITI</span></span>
                    <p className="text-[9px] uppercase tracking-widest text-[#8A92A0]">Maison Collections</p>
                  </div>
                  <button onClick={() => setMenuOpen(false)} className="p-2 text-stone-500 hover:text-stone-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative mt-4">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search collection..."
                    className="w-full bg-white border border-[#EAE6DF] rounded-full py-2.5 pl-9 pr-4 text-xs font-medium text-[#0B0F17] placeholder:text-[#9BA3AF] focus:outline-none focus:border-[#C5A059]"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-[#9BA3AF]" />
                </form>

                {/* Navigation links */}
                <nav className="flex flex-col gap-1 mt-6">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-semibold tracking-wider uppercase transition ${
                        pathname === link.href
                          ? "bg-[#0B0F17] text-white"
                          : "text-[#545B67] hover:bg-[#F7F5F0] hover:text-[#0B0F17]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/user/orders"
                    onClick={() => setMenuOpen(false)}
                    className="py-2.5 px-3 rounded-lg text-sm font-semibold tracking-wider uppercase text-[#545B67] hover:bg-[#F7F5F0] hover:text-[#0B0F17]"
                  >
                    Track Orders
                  </Link>
                </nav>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-[#EAE6DF] space-y-3">
                {showGuestActions ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setMenuOpen(false)}
                      className="w-full py-2.5 text-center rounded-xl border border-[#0B0F17] text-xs font-bold uppercase tracking-wider text-[#0B0F17]"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMenuOpen(false)}
                      className="w-full py-2.5 text-center rounded-xl bg-[#0B0F17] text-xs font-bold uppercase tracking-wider text-white"
                    >
                      Create Account
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={dashboardHref}
                      onClick={() => setMenuOpen(false)}
                      className="block w-full py-2.5 text-center rounded-xl bg-[#0B0F17] text-xs font-bold uppercase tracking-wider text-white"
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full py-2 text-center text-xs font-semibold text-[#BE123C]"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
