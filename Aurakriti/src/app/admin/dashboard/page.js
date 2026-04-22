'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const cards = [
  { href: '/admin/users', label: 'Manage Users', desc: 'View, edit roles, verify or delete users.', icon: '👥', color: 'indigo' },
  { href: '/admin/sellers', label: 'Sellers', desc: 'Monitor seller accounts and performance.', icon: '🏪', color: 'blue' },
  { href: '/admin/products', label: 'Product Moderation', desc: 'Approve, deactivate or remove listings.', icon: '📦', color: 'yellow' },
  { href: '/admin/orders', label: 'Order Oversight', desc: 'View all platform orders and update status.', icon: '🛒', color: 'purple' },
  { href: '/admin/analytics', label: 'Analytics', desc: 'Revenue, top products, user growth charts.', icon: '📊', color: 'green' },
];

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  green: 'bg-green-50 text-green-600 border-green-100',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSummary(d.data.summary); })
      .catch(() => {});
  }, []);

                <Link href="/admin/products" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Products</h3>
                    <p className="text-gray-600 text-sm mb-4">Review and moderate product listings.</p>
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">Manage Products</span>
                  </div>
                </Link>

                <Link href="/admin/carousel" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-center">
                    <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Carousel</h3>
                    <p className="text-gray-600 text-sm mb-4">Manage homepage carousel slides.</p>
                    <span className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium">Manage Carousel</span>
                  </div>
                </Link>
              </div>

      {/* Live Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold text-green-600 mt-1">{fmt(summary.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">{fmtNum(summary.totalOrders)}</p>
            <p className="text-xs text-gray-400">{summary.recentOrders} this week</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Users</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{fmtNum(summary.totalUsers)}</p>
            <p className="text-xs text-gray-400">{fmtNum(summary.totalSellers)} sellers</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Active Products</p>
            <p className="text-xl font-bold text-yellow-600 mt-1">{fmtNum(summary.activeProducts)}</p>
            <p className="text-xs text-gray-400">of {fmtNum(summary.totalProducts)} total</p>
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-5 flex items-start gap-4 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${colorMap[card.color]}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{card.label}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
