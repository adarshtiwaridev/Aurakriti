'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ label, value, sub, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]?.split(' ')[1] ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || 'Failed to load analytics');
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  const { summary, topProducts, topSellers, dailyRevenue, userGrowth, orderStatusBreakdown } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">Overview of platform performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(summary.totalRevenue)} sub={`${fmtNum(summary.paidOrders)} paid orders`} color="green" />
        <StatCard label="Total Orders" value={fmtNum(summary.totalOrders)} sub={`${summary.recentOrders} in last 7 days`} color="indigo" />
        <StatCard label="Total Users" value={fmtNum(summary.totalUsers)} sub={`${summary.totalSellers} sellers`} color="blue" />
        <StatCard label="Active Products" value={fmtNum(summary.activeProducts)} sub={`of ${fmtNum(summary.totalProducts)} total`} color="yellow" />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Daily Revenue (Last 30 Days)</h3>
        {dailyRevenue.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No revenue data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} labelFormatter={(l) => `Date: ${l}`} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Order Status Breakdown</h3>
          {orderStatusBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orderStatusBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                  {orderStatusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">User Signups (Last 30 Days)</h3>
          {userGrowth.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No signup data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(l) => `Date: ${l}`} />
                <Bar dataKey="count" fill="#22c55e" name="New Users" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Top Products by Revenue</h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-gray-800 truncate">{p.title}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm font-semibold text-gray-900">{fmt(p.revenue)}</div>
                    <div className="text-xs text-gray-400">{p.unitsSold} sold</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Top Sellers by Revenue</h3>
          {topSellers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No seller data yet</p>
          ) : (
            <div className="space-y-3">
              {topSellers.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-800 truncate">{s.name ?? 'Unknown'}</div>
                      <div className="text-xs text-gray-400 truncate">{s.email}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm font-semibold text-gray-900">{fmt(s.revenue)}</div>
                    <div className="text-xs text-gray-400">{s.orderCount} orders</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
