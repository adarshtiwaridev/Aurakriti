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
      .then((d) => {
        if (d.success) setSummary(d.data.summary);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6">

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        <Link href="/admin/products" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              📦
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Products</h3>
            <p className="text-gray-600 text-sm mb-4">Review and moderate product listings.</p>
          </div>
        </Link>

        <Link href="/admin/carousel" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              🖼️
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carousel</h3>
            <p className="text-gray-600 text-sm mb-4">Manage homepage carousel slides.</p>
          </div>
        </Link>

      </div>

      {/* Live Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold text-green-600 mt-1">{summary.totalRevenue}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">{summary.totalOrders}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Users</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{summary.totalUsers}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500">Active Products</p>
            <p className="text-xl font-bold text-yellow-600 mt-1">{summary.activeProducts}</p>
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
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {card.label}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}