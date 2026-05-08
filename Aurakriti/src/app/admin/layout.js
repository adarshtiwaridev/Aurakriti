'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Boxes, LayoutDashboard, LogOut, PackageSearch, ShieldCheck, ShoppingCart, Users } from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/sellers', label: 'Sellers', icon: ShieldCheck },
  { href: '/admin/products', label: 'Products', icon: Boxes },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminLayout({ children }) {
  const { user, isAuthenticated, initialized, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/auth/login');
    }
  }, [initialized, isAuthenticated, user?.role, router]);

  if (!initialized || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fffdf8_0%,#f6f8fb_100%)]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f6f8fb_100%)]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80">
          <div className="flex h-full flex-col rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_20px_70px_-48px_rgba(24,24,27,0.35)]">
            <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,#18181b_0%,#44403c_100%)] p-5 text-white">
              <div className="inline-flex rounded-full bg-white/10 p-3">
                <PackageSearch className="h-5 w-5" />
              </div>
              <h1 className="mt-4 text-xl font-semibold">Admin Console</h1>
              <p className="mt-2 text-sm text-stone-200">{user.name || 'Administrator'}</p>
              <p className="truncate text-xs text-stone-300">{user.email}</p>
            </div>

            <nav className="mt-6 flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={logout}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
