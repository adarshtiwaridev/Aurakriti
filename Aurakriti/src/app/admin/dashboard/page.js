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

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);
  const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
        <p className="text-gray-500 text-sm mt-1">Platform overview and quick actions</p>
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
