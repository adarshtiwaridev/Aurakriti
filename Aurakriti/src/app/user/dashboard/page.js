'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/ecommerce/Navbar';
import { getOrders } from '@/services/orderService';
import { getDashboardProfile } from '@/services/profileService';
import { toast } from 'sonner';

export default function UserDashboard() {
  const router = useRouter();
  const { initialized, isAuthenticated, user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoiceLoading, setInvoiceLoading] = useState({});

  const openInvoice = async (order) => {
    try {
      setInvoiceLoading((prev) => ({ ...prev, [order.id]: true }));

      let invoiceUrl = order.invoiceUrl;
      if (!invoiceUrl) {
        const response = await fetch('/api/invoice/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ orderId: order.id }),
        });

        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Unable to generate invoice.');
        }

        invoiceUrl = payload.data?.invoiceUrl || '';
      }

      if (!invoiceUrl) {
        throw new Error('Invoice URL is not available for this order.');
      }

      window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
      toast.success('Invoice opened in new tab.');
    } catch (invoiceError) {
      toast.error(invoiceError.message || 'Failed to open invoice.');
    } finally {
      setInvoiceLoading((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/user/dashboard');
      return;
    }

    if (user?.role !== 'user') {
      router.replace(user?.role === 'seller' ? '/seller/dashboard' : '/admin/dashboard');
    }
  }, [initialized, isAuthenticated, router, user?.role]);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError('');
        const [data, profileData] = await Promise.all([getOrders('user'), getDashboardProfile()]);
        if (!active) {
          return;
        }

        setOrders(data.orders ?? []);
        setProfile(profileData);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err.message || 'Failed to fetch orders');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (isAuthenticated && user?.role === 'user') {
      loadOrders();
    }

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!(isAuthenticated && user?.role === 'user')) {
      return;
    }

    const syncOrders = async () => {
      try {
        const [data, profileData] = await Promise.all([getOrders('user'), getDashboardProfile()]);
        setOrders(data.orders ?? []);
        setProfile(profileData);
      } catch {
        // ignore transient poll errors, next cycle retries
      }
    };

    const timer = setInterval(syncOrders, 6000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        syncOrders();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated, user?.role]);

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += order.totalAmount || 0;
        if (order.status === 'delivered') {
          acc.delivered += 1;
        }
        if (order.status === 'pending') {
          acc.pending += 1;
        }
        return acc;
      },
      { total: 0, delivered: 0, pending: 0 }
    );
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar searchTerm="" onSearch={() => {}} cartCount={0} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{profile?.user?.name ? `${profile.user.name}'s Dashboard` : 'My Dashboard'}</h1>
            <p className="mt-1 text-sm text-slate-600">Track your orders and recent purchases.</p>
            <p className="mt-2 text-sm text-slate-500">
              {profile?.user?.email || user?.email || 'No email'}
              {' · '}
              {profile?.metrics?.phone || profile?.user?.phone || 'No phone added'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile/edit"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Edit Profile
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Continue Shopping
            </Link>
            <Link
              href="/user/recommendations"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              AI Recommendations
            </Link>
            <button
              onClick={logout}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Total Orders" value={profile?.metrics?.orders ?? orders.length} />
          <StatCard label="Delivered" value={summary.delivered} />
          <StatCard label="Total Spent" value={`Rs ${(profile?.metrics?.totalSpent ?? summary.total).toFixed(2)}`} />
        </section>

        <section className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-[0_30px_70px_-35px_rgba(2,6,23,0.25)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-900">My Orders</h2>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Auto refresh: 6s</p>
          </div>

          {loading ? <p className="mt-4 text-sm text-slate-500">Loading orders...</p> : null}
          {!loading && error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          {!loading && !error && orders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-slate-600">No orders yet. Start shopping to place your first order.</p>
            </div>
          ) : null}

          {!loading && !error && orders.length > 0 ? (
            <div className="mt-6 space-y-4">
              <AnimatePresence mode="popLayout">
              {orders.map((order) => (
                <motion.article
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
                >
                  <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold">Order #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-slate-300">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <StatusBadge label={order.status} />
                      <PaymentBadge label={order.paymentStatus} />
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Rs {(order.totalAmount ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mt-1">
                      <OrderTimeline status={order.status} timeline={order.statusTimeline} />
                    </div>

                  {order.trackingDetails?.trackingNumber || order.trackingDetails?.trackingUrl ? (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                      <p className="font-semibold">Shipping</p>
                      <p>Tracking Number: {order.trackingDetails.trackingNumber || 'Not provided'}</p>
                      <p>Carrier: {order.trackingDetails.carrier || 'Not provided'}</p>
                      <p>
                        Estimated Delivery:{' '}
                        {order.trackingDetails.estimatedDelivery
                          ? new Date(order.trackingDetails.estimatedDelivery).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                      {order.trackingDetails.trackingUrl ? (
                        <a
                          href={order.trackingDetails.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block font-semibold text-blue-700 hover:text-blue-900"
                        >
                          Track Shipment
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    {(order.items ?? []).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <img src={item.image || 'https://via.placeholder.com/150?text=Product'} alt={item.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Qty: {item.quantity} • Unit: Rs {Number(item.price || 0).toFixed(2)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <ItemStatusBadge label={item.status} />
                            {item.productId ? (
                              <Link href={`/products/${item.productId}`} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                                View Product
                              </Link>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900">Rs {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openInvoice(order)}
                      disabled={order.paymentStatus !== 'paid' || Boolean(invoiceLoading[order.id])}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {invoiceLoading[order.id] ? 'Preparing Invoice...' : 'Download Invoice'}
                    </button>
                    {order.paymentStatus !== 'paid' ? (
                      <p className="text-xs text-slate-500">Invoice becomes available after successful payment.</p>
                    ) : null}
                  </div>
                  </div>
                </motion.article>
              ))}
              </AnimatePresence>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ label }) {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-cyan-100 text-cyan-800',
    shipped: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-rose-100 text-rose-800',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[label] ?? 'bg-slate-100 text-slate-700'}`}>
      {label}
    </span>
  );
}

function PaymentBadge({ label }) {
  const map = {
    created: 'bg-slate-100 text-slate-700',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[label] ?? 'bg-slate-100 text-slate-700'} bg-opacity-90`}>
      payment: {label}
    </span>
  );
}

function ItemStatusBadge({ label }) {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-cyan-100 text-cyan-800',
    shipped: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-rose-100 text-rose-800',
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${map[label] ?? 'bg-slate-100 text-slate-700'}`}>
      {label}
    </span>
  );
}

function OrderTimeline({ status, timeline = {} }) {
  const steps = [
    { key: 'pending', label: 'Pending', date: null },
    { key: 'confirmed', label: 'Confirmed', date: timeline.confirmedAt },
    { key: 'shipped', label: 'Shipped', date: timeline.shippedAt },
    { key: 'delivered', label: 'Delivered', date: timeline.deliveredAt },
    { key: 'cancelled', label: 'Cancelled', date: timeline.cancelledAt },
  ];

  const indexMap = steps.reduce((acc, step, idx) => {
    acc[step.key] = idx;
    return acc;
  }, {});

  const currentIndex = indexMap[status] ?? 0;
  const isCancelled = status === 'cancelled';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Order timeline</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        {steps.map((step, idx) => {
          const completed = isCancelled
            ? ['pending', 'confirmed', 'cancelled'].includes(step.key)
            : step.key !== 'cancelled' && idx <= currentIndex;
          return (
            <div
              key={step.key}
              className={`rounded-lg border px-2 py-2 text-center ${completed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{step.label}</p>
              <p className="mt-1 text-[10px]">
                {step.date ? new Date(step.date).toLocaleDateString('en-IN') : completed ? 'Updated' : 'Pending'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
