'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RefreshCw, Download, Truck, PackageCheck, CircleDot, Box, XCircle, MapPin } from 'lucide-react';
import Navbar from '@/components/ecommerce/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { generateInvoiceForOrder, getOrders } from '@/services/orderService';

const TRACK_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

const STATUS_META = {
  pending: { label: 'Pending', icon: CircleDot, tone: 'bg-[#fff4de] text-[#9b7a48] border-[#f1e1c8]' },
  confirmed: { label: 'Confirmed', icon: PackageCheck, tone: 'bg-[#ecfdf3] text-[#1f7a48] border-[#c8f2da]' },
  shipped: { label: 'Shipped', icon: Truck, tone: 'bg-[#eef6ff] text-[#2463a8] border-[#cfe2fb]' },
  delivered: { label: 'Delivered', icon: Box, tone: 'bg-[#eefcf4] text-[#188b55] border-[#d0f4df]' },
  cancelled: { label: 'Cancelled', icon: XCircle, tone: 'bg-[#fff0f0] text-[#b84040] border-[#f7cccc]' },
  processing: { label: 'Processing', icon: PackageCheck, tone: 'bg-[#fff4de] text-[#9b7a48] border-[#f1e1c8]' },
};

function formatCurrency(amount) {
  return `Rs ${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getProgressIndex(status) {
  if (status === 'processing') return 1;
  const index = TRACK_STEPS.indexOf(status);
  return index === -1 ? 0 : index;
}

export default function UserOrdersPage() {
  const router = useRouter();
  const { initialized, isAuthenticated, user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [downloadState, setDownloadState] = useState({});

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/user/orders');
      return;
    }
    if (user?.role !== 'user') {
      router.replace(user?.role === 'seller' ? '/seller/dashboard' : '/admin/dashboard');
    }
  }, [initialized, isAuthenticated, router, user?.role]);

  const loadOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);
      setError('');
      const data = await getOrders('user');
      setOrders(data.orders ?? []);
    } catch (err) {
      setError(err.message || 'Unable to load your orders right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      loadOrders();
    }
  }, [isAuthenticated, user?.role, loadOrders]);

  // Re-fetch periodically so seller status changes reflect quickly for buyers.
  useEffect(() => {
    if (!(isAuthenticated && user?.role === 'user')) return undefined;
    const poll = setInterval(() => {
      loadOrders(true);
    }, 3000);

    const onFocus = () => loadOrders(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, user?.role, loadOrders]);

  const cartCount = useMemo(
    () => orders.reduce((acc, order) => acc + (order.items?.reduce((iAcc, item) => iAcc + Number(item.quantity || 0), 0) || 0), 0),
    [orders]
  );

  const handleDownloadInvoice = async (order) => {
    try {
      const orderId = order.id;
      setDownloadState((prev) => ({ ...prev, [orderId]: true }));

      let invoiceUrl = order.invoiceUrl;
      if (!invoiceUrl) {
        const generated = await generateInvoiceForOrder(orderId);
        invoiceUrl = generated.invoiceUrl;
        setOrders((prev) =>
          prev.map((entry) => (entry.id === orderId ? { ...entry, invoiceUrl } : entry))
        );
      }

      if (invoiceUrl) {
        window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err.message || 'Unable to download invoice.');
    } finally {
      setDownloadState((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  if (!initialized || !isAuthenticated || user?.role !== 'user') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffcf8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#eadfce] border-t-[#c9a14a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffcf8] to-white">
      <Navbar cartCount={cartCount} searchTerm="" onSearch={() => {}} />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9f7a40]">Aurakriti Orders</p>
            <h1 className="luxury-serif mt-2 text-4xl text-[#2f241b]">My Orders</h1>
            <p className="mt-2 text-sm text-[#7b6652]">Real-time tracking and downloadable invoices.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadOrders(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-semibold text-[#6b5645] hover:border-[#d9c9b1]"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link href="/shop" className="rounded-full bg-[#c9a14a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b88f37]">
              Shop More
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-[#f2d2d2] bg-[#fff5f5] px-4 py-3 text-sm text-[#a23b3b]">{error}</div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 rounded-3xl border border-[#eadfce] bg-white animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-[#eadfce] bg-white p-12 text-center">
            <h2 className="luxury-serif text-3xl text-[#3d2f24]">No orders yet</h2>
            <p className="mt-2 text-[#7b6652]">Your jewellery orders will appear here once you checkout.</p>
            <Link href="/shop" className="mt-6 inline-flex rounded-full bg-[#c9a14a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b88f37]">
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const currentStatus = String(order.status || 'pending').toLowerCase();
              const progressIndex = getProgressIndex(currentStatus);
              const statusMeta = STATUS_META[currentStatus] || STATUS_META.pending;
              const StatusIcon = statusMeta.icon;
              const isCancelled = currentStatus === 'cancelled';

              return (
                <motion.article
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6 shadow-[0_18px_45px_-35px_rgba(147,112,43,0.24)]"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-[#9f7a40]">Order</p>
                      <h3 className="luxury-serif text-2xl text-[#2f241b]">#{order.id.slice(-8).toUpperCase()}</h3>
                      <p className="mt-1 text-xs text-[#7b6652]">Placed on {formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusMeta.tone}`}>
                      <StatusIcon size={14} /> {statusMeta.label}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mb-6 rounded-2xl border border-[#f0e5d6] bg-[#fffdfa] p-4">
                    <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9f7a40]">
                      <span>Order Tracking</span>
                      <span>{isCancelled ? 'Cancelled' : `Step ${Math.min(progressIndex + 1, 4)} of 4`}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {TRACK_STEPS.map((step, index) => {
                        const active = !isCancelled && index <= progressIndex;
                        const reached = !isCancelled && index < progressIndex;
                        return (
                          <div key={step} className="space-y-2">
                            <div className={`h-2 rounded-full transition-all ${active ? 'bg-[#c9a14a]' : 'bg-[#ece3d6]'}`} />
                            <p className={`text-[11px] font-semibold capitalize ${reached || active ? 'text-[#7d623d]' : 'text-[#b7a58b]'}`}>
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-3">
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#f3eadc] p-3">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="h-16 w-16 rounded-lg object-cover object-center" loading="lazy" />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#f6ecde] text-[#c9a14a]">✦</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-semibold text-[#2f241b]">{item.title}</p>
                            <p className="text-xs text-[#8a7256]">Qty {item.quantity} · {formatCurrency(item.price)}</p>
                          </div>
                          <div className="text-sm font-semibold text-[#3d2f24]">
                            {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <aside className="rounded-2xl border border-[#f0e5d6] bg-[#fffdfa] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9f7a40]">Summary</p>
                      <div className="mt-3 space-y-2 text-sm text-[#6b5645]">
                        <p>Total: <span className="font-semibold text-[#2f241b]">{formatCurrency(order.totalAmount)}</span></p>
                        <p>Payment: <span className="font-semibold text-[#2f241b]">{order.paymentDetails?.mode === 'cod' ? 'Cash on Delivery' : 'Online'}</span></p>
                        <p className="flex items-start gap-1"><MapPin size={13} className="mt-0.5" />
                          <span className="line-clamp-2">
                            {order.shippingAddress?.address || 'Address unavailable'}
                          </span>
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <Link
                          href="/user/dashboard"
                          className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-white px-4 py-2 text-xs font-semibold text-[#6b5645] hover:border-[#d9c9b1]"
                        >
                          Track Order
                        </Link>
                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          disabled={!!downloadState[order.id]}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c9a14a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b88f37] disabled:opacity-70"
                        >
                          <Download size={14} />
                          {downloadState[order.id] ? 'Preparing...' : 'Download Invoice'}
                        </button>
                      </div>
                    </aside>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
