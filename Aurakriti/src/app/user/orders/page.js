'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const orders = [
  {
    id: 'ODR-1047',
    placedAt: '2026-03-28',
    status: 'Shipped',
    total: 74.98,
    items: 3,
    delivery: 'Apr 5, 2026',
    tracking: 'A4F9-21',
  },
  {
    id: 'ODR-1039',
    placedAt: '2026-03-14',
    status: 'Delivered',
    total: 42.5,
    items: 2,
    delivery: 'Mar 20, 2026',
    tracking: 'B3K2-19',
  },
  {
    id: 'ODR-1021',
    placedAt: '2026-02-26',
    status: 'Processing',
    total: 129.99,
    items: 5,
    delivery: 'Apr 1, 2026',
    tracking: 'C7L8-05',
  },
];

const statusStyles = {
  Delivered: 'bg-green-100 text-green-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Processing: 'bg-yellow-100 text-yellow-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const { user, isAuthenticated, logout, isUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!isUser()) {
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user?.role === 'seller') {
        router.push('/seller/dashboard');
      }
    }
  }, [isAuthenticated, user, router, isUser]);

  if (!isAuthenticated || !isUser()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <Link href="/user/dashboard" className="text-2xl font-semibold text-slate-900">
                EcoCommerce
              </Link>
              <p className="mt-1 text-sm text-slate-500">Your complete order history in one place.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Hello, {user.name}</span>
              <Link href="/shop" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Continue Shopping
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Order History</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">My Orders</h1>
              <p className="mt-3 text-sm text-slate-500 max-w-2xl">
                Review each purchase, check delivery status, and manage your order timeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/user/dashboard" className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Back to Dashboard
              </Link>
              <Link href="/shop" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Shop More
              </Link>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Order ID</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Placed</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Items</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Total</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Delivery</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Tracking</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5 font-medium text-slate-900">{order.id}</td>
                    <td className="px-6 py-5 text-slate-500">{order.placedAt}</td>
                    <td className="px-6 py-5 text-slate-500">{order.items}</td>
                    <td className="px-6 py-5 text-slate-500">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-5 text-slate-500">{order.delivery}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500">{order.tracking}</td>
                    <td className="px-6 py-5">
                      <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Need help with an order?</p>
            <p className="mt-2">Email us at <a href="mailto:support@eco-commerce.com" className="font-medium text-slate-900 underline">support@eco-commerce.com</a> or use the chat support from your account page.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
