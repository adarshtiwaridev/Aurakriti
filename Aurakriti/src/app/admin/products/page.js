'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Search, Star, Trash2 } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState('');
  const [notice, setNotice] = useState(null);

  const showNotice = (message, tone = 'success') => {
    setNotice({ message, tone });
    window.setTimeout(() => setNotice(null), 2600);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter !== '') params.set('isActive', statusFilter);
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load products');
      }

      setProducts(data.data.products || []);
      setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      showNotice(error.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleActive = async (productId, current) => {
    setActionLoading(productId);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, isActive: !current }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Update failed');
      }

      setProducts((prev) =>
        prev.map((product) => (String(product._id) === String(productId) ? { ...product, isActive: !current } : product))
      );
      showNotice(`Product ${current ? 'hidden' : 'activated'} successfully.`);
    } catch (error) {
      showNotice(error.message || 'Update failed', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const deleteProduct = async (productId, title) => {
    if (!window.confirm(`Delete "${title}" permanently?`)) {
      return;
    }

    setActionLoading(productId);
    try {
      const res = await fetch(`/api/admin/products?productId=${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Delete failed');
      }

      setProducts((prev) => prev.filter((product) => String(product._id) !== String(productId)));
      showNotice('Product deleted.');
    } catch (error) {
      showNotice(error.message || 'Delete failed', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const formatPrice = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Catalog Control</p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-950">Products</h1>
            <p className="mt-2 text-sm text-stone-500">{pagination.total} total products across all sellers.</p>
          </div>

          <div className="grid w-full gap-3 md:w-auto md:grid-cols-[minmax(260px,320px)_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search title or description"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
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
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => <div key={index} className="skeleton h-36 rounded-[1.7rem]" />)
        ) : products.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold text-stone-900">No products found</p>
            <p className="mt-2 text-sm text-stone-500">Try a different filter or search query.</p>
          </div>
        ) : (
          products.map((product) => (
            <article
              key={product._id}
              className="grid gap-5 rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[120px_1fr_auto]"
            >
              <div className="overflow-hidden rounded-[1.3rem] bg-stone-100">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.title} className="h-28 w-full object-cover" />
                ) : (
                  <div className="flex h-28 items-center justify-center text-sm font-semibold text-stone-400">No image</div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-950">{product.title}</h2>
                    <p className="mt-1 text-sm text-stone-500">Seller: {product.seller?.name || 'Unknown seller'}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {product.isActive ? 'Visible' : 'Hidden'}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{product.description}</p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-600">
                  <span className="rounded-full bg-stone-100 px-3 py-1">{product.category}</span>
                  <span className="rounded-full bg-stone-100 px-3 py-1">{formatPrice(product.price)}</span>
                  <span className="rounded-full bg-stone-100 px-3 py-1">Stock {product.stock}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {Number(product.rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:w-44">
                <button
                  onClick={() => toggleActive(product._id, product.isActive)}
                  disabled={actionLoading === product._id}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
                >
                  {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {product.isActive ? 'Hide' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteProduct(product._id, product.title)}
                  disabled={actionLoading === product._id}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
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
