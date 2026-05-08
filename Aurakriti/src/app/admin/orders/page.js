'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS = ['', 'created', 'paid', 'failed'];

function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState('');
  const [notice, setNotice] = useState(null);

  const showNotice = (message, tone = 'success') => {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice(null), 2600);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (paymentFilter) params.set('paymentStatus', paymentFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load orders');
      }

      setOrders(data.data.orders || []);
      setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      showNotice(error.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    setActionLoading(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Update failed');
      }

      setOrders((prev) => prev.map((order) => (String(order._id) === String(orderId) ? { ...order, status } : order)));
      showNotice('Order status updated.');
    } catch (error) {
      showNotice(error.message || 'Update failed', 'error');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <section className="space-y-6">
      {notice ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            notice.tone === 'error' ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Order Oversight</p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-950">Orders</h1>
            <p className="mt-2 text-sm text-stone-500">{pagination.total} orders currently in the system.</p>
          </div>

          <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[minmax(260px,320px)_180px_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search customer or order"
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-stone-400"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(event) => {
                setPaymentFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400"
            >
              <option value="">All payments</option>
              {PAYMENT_OPTIONS.filter(Boolean).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => <div key={index} className="skeleton h-44 rounded-[1.8rem]" />)
        ) : orders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-stone-900">No orders found</p>
            <p className="mt-2 text-sm text-stone-500">Adjust your filters or wait for new orders to come in.</p>
          </div>
        ) : (
          orders.map((order) => (
            <article key={order._id} className="rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Order</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-950">#{String(order._id).slice(-8).toUpperCase()}</h2>
                  <p className="mt-1 text-sm text-stone-500">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="grid gap-2 sm:text-right">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : order.paymentStatus === 'failed'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    Payment: {order.paymentStatus}
                  </span>
                  <p className="text-sm font-semibold text-stone-900">{formatPrice(order.totalAmount)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
                <div className="space-y-4">
                  <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-sm font-semibold text-stone-900">{order.user?.name || 'Unknown customer'}</p>
                    <p className="mt-1 text-sm text-stone-500">{order.user?.email || 'No email available'}</p>
                    <p className="mt-3 text-sm text-stone-600">
                      {order.shippingAddress?.address || 'Address not available'}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {(order.items || []).map((item) => (
                      <div key={item._id || item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-stone-200 p-4">
                        <div>
                          <p className="font-semibold text-stone-900">{item.title}</p>
                          <p className="mt-1 text-sm text-stone-500">
                            Qty {item.quantity} • {formatPrice(item.price)} • {item.category || 'General'}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-stone-900">
                          {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 lg:w-56 lg:content-start">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Order status</label>
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus(order._id, event.target.value)}
                    disabled={actionLoading === order._id}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold capitalize outline-none transition focus:border-stone-400 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                    <p className="font-semibold text-stone-900">Item count</p>
                    <p className="mt-2">{order.items?.length || 0} line item(s)</p>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {pagination.pages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-stone-200 bg-white px-5 py-4">
          <p className="text-sm text-stone-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
              disabled={page === pagination.pages}
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
