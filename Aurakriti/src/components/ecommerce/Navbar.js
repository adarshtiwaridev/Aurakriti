'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart, UserCircle, SearchIcon, Menu, LogOut, User, X, Bell, Grid3X3, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import authService from '@/services/authService';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';

export default function Navbar({ cartCount = 0, searchTerm, onSearch }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [inputValue, setInputValue] = useState(searchTerm ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const canUseCart = !user || user.role === 'user';
  const showCartCount = cartCount > 0;

  useEffect(() => {
    setInputValue(searchTerm ?? '');
  }, [searchTerm]);

  // Load categories once for nav dropdown
  useEffect(() => {
    let active = true;
    async function fetchCategories() {
      try {
        const res = await fetch('/api/category', { credentials: 'include', cache: 'no-store' });
        const payload = await res.json();
        if (!active || !payload.success) return;
        setCategories(payload.data?.categories ?? []);
      } catch {
        // ignore category fetch failures; nav still works
      }
    }
    fetchCategories();
    return () => { active = false; };
  }, []);

  // Poll notifications for authenticated users; this acts as real-time fallback.
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let active = true;

    const loadNotifications = async () => {
      try {
        setNotifLoading(true);
        const data = await getNotifications({ limit: 25 });
        if (!active) return;
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      } catch {
        // ignore transient poll errors; next interval retries
      } finally {
        if (active) {
          setNotifLoading(false);
        }
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const query = inputValue.trim();
    if (!query) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=6`, {
          credentials: 'include',
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Search failed');
        }

        setSuggestions(payload.data?.products ?? []);
        setSuggestionsOpen(true);
      } catch {
        setSuggestions([]);
        setSuggestionsOpen(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSearchChange = (value) => {
    setInputValue(value);
    onSearch?.(value);
  };

  const openSuggestion = (productId) => {
    setSuggestionsOpen(false);
    setInputValue('');
    onSearch?.('');
    router.push(`/products/${productId}`);
  };

  const openChatbot = (query) => {
    setSuggestionsOpen(false);
    window.dispatchEvent(new CustomEvent('eco:open-chatbot', { detail: { query } }));
  };

  const openCategory = (categoryName) => {
    setCategoriesOpen(false);
    router.push(`/?category=${encodeURIComponent(categoryName)}`);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // fail silently; navigation still happens
    }

    setShowNotifs(false);

    if (notification.orderId) {
      if (user?.role === 'seller' || user?.role === 'admin') {
        router.push('/seller/dashboard');
      } else {
        router.push('/user/dashboard');
      }
      return;
    }

    if (notification.productId) {
      router.push(`/products/${notification.productId}`);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore action failure
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      setShowDropdown(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDashboardRoute = (role) => {
    if (role === 'seller') return '/seller/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/user/dashboard';
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* LEFT: Logo & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-lg shadow-green-200 transition-transform group-hover:scale-105">
              <span className="font-bold text-xl">E</span>
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">Eco</span>
              <span className="text-sm font-black text-slate-800 leading-none">Commerce</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {['Home', 'About', 'Contact'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors"
              >
                {item}
              </Link>
            ))}

            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoriesOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-green-200 hover:bg-green-50"
              >
                <Grid3X3 size={14} />
                Categories
                <ChevronDown size={14} className={`transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {categoriesOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    <div className="max-h-80 overflow-y-auto pr-1">
                      {categories.map((category) => (
                        <button
                          key={category.slug || category.name}
                          type="button"
                          onClick={() => openCategory(category.name)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <span>{category.name}</span>
                          <span className="text-xs text-slate-400">{category.count}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* CENTER: Search Bar */}
        <div className="flex-1 px-4 sm:px-8 hidden lg:block">
          <div className="relative mx-auto max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length) {
                  setSuggestionsOpen(true);
                }
              }}
              placeholder="Search products..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-50"
            />

            {suggestionsOpen && suggestions.length ? (
              <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {suggestions.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => openSuggestion(product.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                        {product.image ? <img src={product.image} alt={product.title} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{product.title}</p>
                        <p className="truncate text-xs text-slate-500">{product.category} | Rs {Number(product.price || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => openChatbot(product.title)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700"
                    >
                      Ask AI
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Cart Button */}
          {canUseCart && (
            <Link
              href="/user/cart"
              className="group relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart size={22} className="group-hover:text-green-600" />
              {showCartCount && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifs((prev) => !prev);
                setShowDropdown(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell size={20} className={unreadCount > 0 ? 'text-green-600' : ''} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifs ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-black text-slate-900">Notifications</p>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          onClick={handleMarkAllNotificationsRead}
                          className="text-[11px] font-semibold text-green-700 hover:text-green-800"
                        >
                          Mark all read
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setShowNotifs(false)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {notifLoading ? (
                    <p className="px-4 py-5 text-center text-sm text-slate-500">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="px-4 py-5 text-center text-sm text-slate-500">No notifications yet.</p>
                  ) : (
                    <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                      {notifications.map((notification) => (
                        <li key={notification.id}>
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-semibold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                {notification.title || 'Notification'}
                              </p>
                              {!notification.isRead ? <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" /> : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2">{notification.message}</p>
                            <p className="mt-2 text-[11px] text-slate-400">
                              {new Date(notification.createdAt).toLocaleString('en-IN')}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          {/* Auth Section */}
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
            </div>
          ) : isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
                title={user?.name || 'Profile'}
              >
                <UserCircle size={22} className="hover:text-green-600" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{user?.name || 'Account'}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        router.replace(getDashboardRoute(user?.role));
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User size={16} className="text-green-600" />
                      Dashboard
                    </button>
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-md shadow-green-100"
              >
                Login
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden animate-in fade-in duration-200">
          <div className="space-y-1 px-4 py-3">
            <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
              Home
            </Link>
            <Link href="/about" className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
              About
            </Link>
            <Link href="/contact" className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
              Contact
            </Link>
            {categories.length ? (
              <div className="pt-3">
                <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Categories</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {categories.slice(0, 8).map((category) => (
                    <button
                      key={category.slug || category.name}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openCategory(category.name);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
