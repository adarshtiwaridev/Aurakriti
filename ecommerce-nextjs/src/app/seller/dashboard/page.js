'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/ecommerce/Navbar';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { createProduct, deleteProduct, getProducts, updateProduct } from '@/services/productService';
import { getOrders, updateOrderStatus } from '@/services/orderService';
import { uploadImages } from '@/services/profileService';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

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

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  category: PRODUCT_CATEGORIES[0],
  stock: '',
  images: [],
};

export default function SellerDashboard() {
  const router = useRouter();
  const { initialized, isAuthenticated, user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');

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

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [productData, orderData] = await Promise.all([
        getProducts({ mine: true }),
        getOrders('seller'),
      ]);

      setProducts(productData.products ?? []);
      setOrders(orderData.orders ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load seller dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'seller' || user?.role === 'admin')) {
      loadAll();
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!(isAuthenticated && (user?.role === 'seller' || user?.role === 'admin'))) {
      return;
    }

    const timer = setInterval(() => {
      loadAll();
    }, 15000);

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

    const shippedOrders = orders.filter((order) => order.status === 'shipped' || order.status === 'delivered').length;

    return {
      totalRevenue,
      totalProducts: products.length,
      totalOrders: orders.length,
      shippedOrders,
    };
  }, [orders, products.length, user?.id, user?._id]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId('');
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
        images: form.images.filter(Boolean),
      };

      if (!payload.title || !payload.description) {
        throw new Error('Title and description are required.');
      }

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }

      await loadAll();
      resetForm();
      setActiveTab('inventory');
    } catch (err) {
      setError(err.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const onProductImagesPick = async (event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    try {
      setUploading(true);
      setError('');
      const response = await uploadImages(files, 'products');
      const urls = (response.files ?? []).map((item) => item.url).filter(Boolean);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      setError(err.message || 'Failed to upload product images');
    } finally {
      setUploading(false);
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
      images: product.images ?? [],
    });
    setActiveTab('add');
  };

  const onDelete = async (id) => {
    try {
      setSaving(true);
      await deleteProduct(id);
      await loadAll();
    } catch (err) {
      setError(err.message || 'Unable to delete product');
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = async (orderId, itemId, status) => {
    try {
      setSaving(true);
      let trackingDetails = undefined;
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
        await loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setSaving(false);
    }
  };

  if (!initialized || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar searchTerm="" onSearch={() => {}} cartCount={0} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Seller Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your products and orders in real time.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile/edit"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Edit Profile
            </Link>
            <button onClick={logout} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            ['overview', 'Overview'],
            ['add', editingId ? 'Edit Product' : 'Add Product'],
            ['inventory', 'My Inventory'],
            ['orders', 'Orders'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === key ? 'bg-green-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        {activeTab === 'overview' ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card title="Revenue" value={`Rs ${stats.totalRevenue.toFixed(2)}`} />
              <Card title="Products" value={stats.totalProducts} />
              <Card title="Orders" value={stats.totalOrders} />
              <Card title="Shipped" value={stats.shippedOrders} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-black text-slate-900">Revenue Trend</h2>
              <div className="h-72 w-full min-w-0">
                {chartReady ? (
                  <ResponsiveContainer width="100%" height={280} minWidth={320}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="url(#revGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'add' ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-900">{editingId ? 'Update Product' : 'Add Product'}</h2>

            <form onSubmit={submitProduct} className="grid gap-4 md:grid-cols-2">
              <Input label="Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} />
              <Input label="Price" type="number" value={form.price} onChange={(value) => setForm((prev) => ({ ...prev, price: value }))} />

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Describe your product"
                  className="h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Product Images</label>

                {form.images.length > 0 ? (
                  <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {form.images.map((url, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-xl border border-slate-200">
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="h-24 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-3 text-xs text-slate-400">No images added yet.</p>
                )}

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:border-green-400 hover:bg-green-50 transition-colors">
                  <span className="text-green-600 font-semibold">+ Upload Images</span>
                  <span className="text-slate-400">(multiple allowed, max 5 MB each)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onProductImagesPick}
                    className="hidden"
                  />
                </label>
                {uploading ? (
                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
                    Uploading images...
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={saving || uploading} className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white">
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700"
                  >
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === 'inventory' ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-900">My Products</h2>

            {loading ? <p className="text-sm text-slate-500">Loading products...</p> : null}

            {!loading && products.length === 0 ? (
              <p className="text-sm text-slate-600">No products yet. Add your first product.</p>
            ) : null}

            {!loading && products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <article key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <div>
                      <p className="font-semibold text-slate-900">{product.title}</p>
                      <p className="text-xs text-slate-500">{product.category} | Stock: {product.stock} | Rs {product.price}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        disabled={saving}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
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
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-900">Orders For Your Products</h2>

            {loading ? <p className="text-sm text-slate-500">Loading orders...</p> : null}

            {!loading && orders.length === 0 ? <p className="text-sm text-slate-600">No seller orders found.</p> : null}

            {!loading && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <article key={order.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">Order #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="space-y-2">
                      {(order.items ?? []).map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.title} x {item.quantity}</p>
                            <p className="text-xs text-slate-500">Rs {(item.price * item.quantity).toFixed(2)}</p>
                          </div>

                          <select
                            value={item.status}
                            onChange={(event) => onStatusChange(order.id, item.id, event.target.value)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs"
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
                      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                        <p className="font-semibold">Shipping Details</p>
                        <p>Tracking: {order.trackingDetails.trackingNumber || 'Not provided'}</p>
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

function Card({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
      />
    </div>
  );
}
