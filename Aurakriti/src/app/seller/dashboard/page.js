'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { createProduct, deleteProduct, getProducts, updateProduct } from '@/services/productService';
import { getOrders, updateOrderStatus } from '@/services/orderService';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notificationService';
import { uploadImages } from '@/services/profileService';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  category: PRODUCT_CATEGORIES[0],
  stock: '',
  tags: '',
  images: [],
};

const isStatusSelectable = (currentStatus, candidateStatus) => {
  if (candidateStatus === 'cancelled') {
    return ['pending', 'confirmed', 'shipped'].includes(currentStatus) || currentStatus === 'cancelled';
  }

  const currentIndex = ORDER_STATUSES.indexOf(currentStatus);
  const candidateIndex = ORDER_STATUSES.indexOf(candidateStatus);

  if (currentIndex === -1 || candidateIndex === -1) {
    return false;
  }

  return candidateIndex === currentIndex || candidateIndex === currentIndex + 1;
};

function normalizeTags(value) {
  return String(value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function SellerDashboard() {
  const router = useRouter();
  const { initialized, isAuthenticated, user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [chartReady, setChartReady] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/seller/dashboard');
      return;
    }

    if (user?.role !== 'seller' && user?.role !== 'admin') {
      router.replace('/user/dashboard');
    }
  }, [initialized, isAuthenticated, router, user?.role]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.local) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [imagePreviews]);

  const loadDashboardData = async ({ withLoader = true } = {}) => {
    try {
      if (withLoader) {
        setLoading(true);
      }
      setError('');

      const [productData, orderData, notificationData] = await Promise.all([
        getProducts({ mine: true }),
        getOrders('seller'),
        getNotifications({ limit: 12 }),
      ]);

      setProducts(productData.products ?? []);
      setOrders(orderData.orders ?? []);
      setNotifications(notificationData.notifications ?? []);
      setUnreadCount(Number(notificationData.unreadCount || 0));
    } catch (err) {
      const message = err.message || 'Failed to load seller dashboard data';
      setError(message);
    } finally {
      if (withLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'seller' || user?.role === 'admin')) {
      loadDashboardData();
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!(isAuthenticated && (user?.role === 'seller' || user?.role === 'admin'))) {
      return;
    }

    const timer = setInterval(() => {
      loadDashboardData({ withLoader: false });
    }, 10000);

    return () => clearInterval(timer);
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    setChartReady(true);
  }, []);

  const chartData = useMemo(() => {
    const monthMap = new Map();

    for (const order of orders) {
      for (const item of order.items ?? []) {
        if (String(item.sellerId) !== String(user?.id ?? user?._id)) {
          continue;
        }

        const date = new Date(order.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const label = date.toLocaleString('en-US', { month: 'short' });
        const prev = monthMap.get(key) ?? { name: label, revenue: 0, sales: 0 };

        prev.revenue += Number(item.price || 0) * Number(item.quantity || 0);
        prev.sales += Number(item.quantity || 0);
        monthMap.set(key, prev);
      }
    }

    return Array.from(monthMap.values());
  }, [orders, user?.id, user?._id]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => {
      const sellerTotal = (order.items ?? []).reduce((acc, item) => {
        if (String(item.sellerId) !== String(user?.id ?? user?._id)) {
          return acc;
        }
        return acc + Number(item.price || 0) * Number(item.quantity || 0);
      }, 0);

      return sum + sellerTotal;
    }, 0);

    const lowStockCount = products.filter((product) => Number(product.stock || 0) <= 3).length;
    const shippedOrders = orders.filter((order) => order.status === 'shipped' || order.status === 'delivered').length;

    return {
      totalRevenue,
      totalProducts: products.length,
      totalOrders: orders.length,
      shippedOrders,
      lowStockCount,
    };
  }, [orders, products, user?.id, user?._id]);

  const recentProducts = useMemo(
    () => products.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4),
    [products]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications]
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId('');
    setImagePreviews([]);
    setUploadProgress(0);
  };

  const submitProduct = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        stock: Number(form.stock),
        tags: normalizeTags(form.tags),
        images: form.images.filter(Boolean),
      };

      if (!payload.title || !payload.description) {
        throw new Error('Title and description are required.');
      }

      if (!payload.images.length) {
        throw new Error('At least one product image is required.');
      }

      const savedProduct = editingId
        ? await updateProduct(editingId, payload)
        : await createProduct(payload);

      if (editingId) {
        setProducts((prev) => prev.map((product) => (product.id === savedProduct.id ? savedProduct : product)));
        toast.success('Product updated successfully.');
      } else {
        setProducts((prev) => [savedProduct, ...prev]);
        toast.success('Product uploaded successfully.');
      }

      resetForm();
      setActiveTab('inventory');
    } catch (err) {
      const message = err.message || 'Unable to save product';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, imageIndex) => imageIndex !== index) }));
  };

const onProductImagesPick = async (event) => {
  const input = event.target; // store reference first
  const files = Array.from(input.files ?? []);

  if (!files.length) {
    return;
  }

  const localPreviews = files.map((file, index) => ({
    id: `${file.name}-${index}-${Date.now()}`,
    url: URL.createObjectURL(file),
    name: file.name,
    local: true,
  }));

  setImagePreviews((prev) => [...prev, ...localPreviews]);

  try {
    setUploading(true);
    setUploadProgress(0);
    setError('');

    const response = await uploadImages(files, 'products', {
      onProgress: (progress) => setUploadProgress(progress),
    });

    const urls = (response.files ?? [])
      .map((item) => item.url)
      .filter(Boolean);

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...urls],
    }));

    toast.success(
      `${urls.length} image${urls.length === 1 ? '' : 's'} uploaded successfully.`
    );
  } catch (err) {
    const message = err.message || 'Failed to upload product images';

    setError(message);
    toast.error(message);
  } finally {
    localPreviews.forEach((preview) =>
      URL.revokeObjectURL(preview.url)
    );

    setImagePreviews((prev) =>
      prev.filter(
        (preview) =>
          !localPreviews.some((local) => local.id === preview.id)
      )
    );

    setUploading(false);
    setUploadProgress(0);

    input.value = ''; // use stored input reference
  }
};

  const onEdit = (product) => {
    setEditingId(product.id);
    setForm({
      title: product.title || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      category: product.category || PRODUCT_CATEGORIES[0],
      stock: String(product.stock ?? ''),
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      images: product.images ?? [],
    });
    setImagePreviews([]);
    setActiveTab('add');
  };

  const onDelete = async (id) => {
    try {
      setSaving(true);
      await deleteProduct(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast.success('Product deleted successfully.');
    } catch (err) {
      const message = err.message || 'Unable to delete product';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = async (orderId, itemId, status) => {
    try {
      setSaving(true);
      let trackingDetails;

      if (status === 'shipped') {
        const trackingNumber = window.prompt('Enter tracking number (optional):', '')?.trim() || '';
        const carrier = window.prompt('Enter carrier/courier name (optional):', '')?.trim() || '';
        const trackingUrl = window.prompt('Enter tracking URL (optional):', '')?.trim() || '';
        const estimatedDeliveryInput = window.prompt('Estimated delivery date (YYYY-MM-DD, optional):', '')?.trim() || '';

        trackingDetails = {
          trackingNumber,
          carrier,
          trackingUrl,
          ...(estimatedDeliveryInput ? { estimatedDelivery: estimatedDeliveryInput } : {}),
        };
      }

      const result = await updateOrderStatus(orderId, status, itemId, trackingDetails);
      const updatedOrder = result.order;

      if (updatedOrder?.id) {
        setOrders((prev) => prev.map((entry) => (entry.id === updatedOrder.id ? updatedOrder : entry)));
      } else {
        await loadDashboardData({ withLoader: false });
      }

      toast.success(`Order item marked as ${status}.`);
    } catch (err) {
      const message = err.message || 'Failed to update order status';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((entry) => (entry.id === notification.id ? { ...entry, isRead: true, readAt: new Date().toISOString() } : entry))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (notification.orderId) {
        setActiveTab('orders');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update notification.');
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(err.message || 'Failed to update notifications.');
    }
  };

  if (!initialized || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fef3c7,_#f8fafc_40%,_#eef2ff)]">
        <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-6 py-3 shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
          <span className="text-sm font-semibold text-slate-700">Loading seller workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f8fafc_38%,_#ecfeff_100%)]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">Seller Studio</p>
              <h1 className="mt-3 font-[var(--font-playfair)] text-4xl font-bold text-slate-950">
                Build your catalog and stay ahead of every order.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Upload products, track payment-confirmed orders, and manage seller notifications from one polished workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-amber-100 bg-amber-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">New alerts</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{unreadCount}</p>
                <p className="mt-1 text-xs text-slate-600">Unread seller notifications</p>
              </div>

              <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Live inventory</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{products.length}</p>
                <p className="mt-1 text-xs text-slate-600">Products visible in your seller account</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {[
              ['overview', 'Overview'],
              ['add', editingId ? 'Edit Product' : 'Add Product'],
              ['inventory', 'Inventory'],
              ['orders', 'Orders'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  activeTab === key
                    ? 'bg-slate-950 text-white shadow-lg'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <Link
                href="/profile/edit"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Edit Profile
              </Link>
              <button
                onClick={logout}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                Logout
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

        {activeTab === 'overview' ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card title="Revenue" value={`Rs ${stats.totalRevenue.toFixed(2)}`} accent="amber" />
                <Card title="Products" value={stats.totalProducts} accent="emerald" />
                <Card title="Orders" value={stats.totalOrders} accent="sky" />
                <Card title="Low Stock" value={stats.lowStockCount} accent="rose" />
              </div>

              <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Performance</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Revenue Trend</h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {stats.shippedOrders} shipped or delivered
                  </div>
                </div>

                <div className="mt-5 h-72 w-full min-w-0">
                  {chartReady ? (
                    <ResponsiveContainer width="100%" height={280} minWidth={320}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#d97706" fill="url(#revGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recent products</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Freshly uploaded catalog</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    View all
                  </button>
                </div>

                {recentProducts.length === 0 ? (
                  <div className="mt-5 rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                    Your uploaded products will appear here after the first successful save.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {recentProducts.map((product) => (
                      <article key={product.id} className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/200x200?text=Product'}
                            alt={product.title}
                            className="h-20 w-20 rounded-2xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-slate-900">{product.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">Rs {product.price}</span>
                              <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
                                Stock {product.stock}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Seller notifications</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Order alerts</h2>
                  </div>
                  <button
                    onClick={markNotificationsAsRead}
                    disabled={unreadCount === 0}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {notifications.length === 0 ? (
                    <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                      No seller notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => openNotification(notification)}
                        className={`w-full rounded-[1.4rem] border p-4 text-left transition ${
                          notification.isRead
                            ? 'border-slate-200 bg-slate-50/80'
                            : 'border-amber-200 bg-amber-50/80 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{notification.message}</p>
                          </div>
                          {!notification.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" /> : null}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {notification.metadata?.orderCode ? (
                            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700">
                              Order #{notification.metadata.orderCode}
                            </span>
                          ) : null}
                          {notification.metadata?.paymentStatus ? (
                            <span className="rounded-full bg-white px-2.5 py-1 font-semibold capitalize text-slate-700">
                              Payment {notification.metadata.paymentStatus}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Action queue</p>
                <div className="mt-4 space-y-3">
                  <QueueRow label="Unread order notifications" value={unreadCount} tone="amber" />
                  <QueueRow label="Low-stock products" value={stats.lowStockCount} tone="rose" />
                  <QueueRow label="Orders waiting on seller action" value={orders.filter((order) => order.status !== 'delivered' && order.status !== 'cancelled').length} tone="sky" />
                </div>
              </div>
            </aside>
          </section>
        ) : null}

        {activeTab === 'add' ? (
          <section className="mt-6 rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Catalog editor</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  {editingId ? 'Update Product' : 'Upload New Product'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Add images, pricing, stock, category, and description in one clean flow.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                Products connect directly to your seller account and appear in inventory after save.
              </div>
            </div>

            <form onSubmit={submitProduct} className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} />
                  <Input
                    label="Price"
                    type="number"
                    value={form.price}
                    onChange={(value) => setForm((prev) => ({ ...prev, price: value }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
                    <select
                      value={form.category}
                      onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                    >
                      {PRODUCT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Stock"
                    type="number"
                    value={form.stock}
                    onChange={(value) => setForm((prev) => ({ ...prev, stock: value }))}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Describe craftsmanship, materials, fit, finish, and care details"
                    className="h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                  />
                </div>

                <Input
                  label="Tags"
                  value={form.tags}
                  onChange={(value) => setForm((prev) => ({ ...prev, tags: value }))}
                  placeholder="handmade, bridal, festive"
                />
              </div>

              <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Product images</p>
                    <p className="mt-1 text-xs text-slate-500">Preview before upload, then save product once ready.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {form.images.length} uploaded
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.images.map((url, index) => (
                    <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
                      <img src={url} alt={`Product image ${index + 1}`} className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {imagePreviews.map((preview) => (
                    <div key={preview.id} className="overflow-hidden rounded-[1.25rem] border border-dashed border-amber-300 bg-white">
                      <img src={preview.url} alt={preview.name} className="h-28 w-full object-cover opacity-80" />
                      <div className="px-3 py-2 text-[11px] font-semibold text-amber-700">Uploading {preview.name}</div>
                    </div>
                  ))}
                </div>

                {form.images.length === 0 && imagePreviews.length === 0 ? (
                  <div className="mt-4 rounded-[1.3rem] border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    No product images selected yet.
                  </div>
                ) : null}

                <label className="mt-4 flex cursor-pointer flex-col gap-3 rounded-[1.4rem] border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition hover:border-amber-400 hover:bg-amber-50/40">
                  <span className="font-semibold text-slate-900">Upload product images</span>
                  <span className="text-xs text-slate-500">Multiple allowed. Max 5 MB each. Supported: JPG, PNG, WEBP.</span>
                 <input
  type="file"
  multiple
  accept="image/*"
  onChange={onProductImagesPick}
/>
                </label>

                {uploading ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Uploading images...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving product...' : editingId ? 'Update Product' : 'Create Product'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === 'inventory' ? (
          <section className="mt-6 rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inventory</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">My Products</h2>
              </div>
              <button
                onClick={() => setActiveTab('add')}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Add another product
              </button>
            </div>

            {loading ? <p className="mt-5 text-sm text-slate-500">Loading products...</p> : null}

            {!loading && products.length === 0 ? (
              <div className="mt-5 rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <p className="text-lg font-semibold text-slate-900">No products yet</p>
                <p className="mt-2 text-sm text-slate-500">Upload your first product to start selling.</p>
              </div>
            ) : null}

            {!loading && products.length > 0 ? (
              <div className="mt-5 grid gap-4">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="grid gap-4 rounded-[1.8rem] border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[110px_1fr_auto]"
                  >
                    <img
                      src={product.image || product.images?.[0] || 'https://via.placeholder.com/200x200?text=Product'}
                      alt={product.title}
                      className="h-28 w-full rounded-[1.4rem] object-cover"
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-950">{product.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{product.description}</p>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {product.category}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">Rs {product.price}</span>
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">Stock {product.stock}</span>
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
                          {product.reviewCount || 0} reviews
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row gap-2 lg:flex-col">
                      <button
                        onClick={() => onEdit(product)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        disabled={saving}
                        className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'orders' ? (
          <section className="mt-6 rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Orders</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Orders For Your Products</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
                Seller updates sync every 10 seconds
              </div>
            </div>

            {loading ? <p className="mt-5 text-sm text-slate-500">Loading orders...</p> : null}

            {!loading && orders.length === 0 ? (
              <div className="mt-5 rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <p className="text-lg font-semibold text-slate-900">No seller orders found</p>
                <p className="mt-2 text-sm text-slate-500">New confirmed payments will appear here automatically.</p>
              </div>
            ) : null}

            {!loading && orders.length > 0 ? (
              <div className="mt-5 space-y-4">
                {orders.map((order) => (
                  <article key={order.id} className="rounded-[1.8rem] border border-slate-200 bg-slate-50/60 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Order #{order.id.slice(-8).toUpperCase()}</p>
                        <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
                          Payment {order.paymentStatus}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
                          Total Rs {Number(order.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {order.user?.name || order.shippingAddress?.name || 'Unknown customer'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{order.user?.email || order.shippingAddress?.email || 'No email available'}</p>
                      <p className="mt-2 text-xs text-slate-500">{order.shippingAddress?.address || 'No shipping address available'}</p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {(order.items ?? []).map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-slate-200 bg-white p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image || item.product?.image || 'https://via.placeholder.com/160x160?text=Item'}
                              alt={item.title}
                              className="h-16 w-16 rounded-2xl object-cover"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Qty {item.quantity} • Rs {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <select
                            value={item.status}
                            onChange={(event) => onStatusChange(order.id, item.id, event.target.value)}
                            disabled={saving}
                            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold capitalize text-slate-700"
                          >
                            {ORDER_STATUSES.map((status) => (
                              <option key={status} value={status} disabled={!isStatusSelectable(item.status, status)}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {order.trackingDetails?.trackingNumber || order.trackingDetails?.trackingUrl || order.trackingDetails?.estimatedDelivery ? (
                      <div className="mt-4 rounded-[1.4rem] border border-sky-100 bg-sky-50 p-4 text-sm text-sky-950">
                        <p className="font-semibold">Shipping Details</p>
                        <p className="mt-2">Tracking: {order.trackingDetails.trackingNumber || 'Not provided'}</p>
                        <p>Carrier: {order.trackingDetails.carrier || 'Not provided'}</p>
                        <p>
                          ETA:{' '}
                          {order.trackingDetails.estimatedDelivery
                            ? new Date(order.trackingDetails.estimatedDelivery).toLocaleDateString()
                            : 'Not provided'}
                        </p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Card({ title, value, accent = 'amber' }) {
  const tones = {
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    sky: 'border-sky-100 bg-sky-50/70 text-sky-700',
    rose: 'border-rose-100 bg-rose-50/70 text-rose-700',
  };

  return (
    <div className={`rounded-[1.8rem] border p-5 shadow-sm ${tones[accent] || tones.amber}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function QueueRow({ label, value, tone = 'amber' }) {
  const tones = {
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-800',
    sky: 'bg-sky-100 text-sky-800',
  };

  return (
    <div className="flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.amber}`}>{value}</span>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
      />
    </div>
  );
}
