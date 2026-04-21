'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const EMPTY_FORM = {
  title: '', subtitle: '', image: '', offerLabel: '',
  offerPrice: '', originalPrice: '', productLink: '', ctaText: 'Shop Now',
  isActive: true, order: 0,
};

export default function AdminCarouselPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/carousel');
      const data = await res.json();
      if (data.success) setItems(data.data.items);
    } catch {
      showToast('Failed to load carousel items', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setImageFile(null);
    setImagePreview('');
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (item) => {
    setForm({
      title: item.title ?? '',
      subtitle: item.subtitle ?? '',
      image: item.image ?? '',
      offerLabel: item.offerLabel ?? '',
      offerPrice: item.offerPrice ?? '',
      originalPrice: item.originalPrice ?? '',
      productLink: item.productLink ?? '',
      ctaText: item.ctaText ?? 'Shop Now',
      isActive: item.isActive ?? true,
      order: item.order ?? 0,
    });
    setEditId(item._id);
    setImagePreview(item.image ?? '');
    setImageFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      if (editId) fd.append('id', editId);
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch('/api/admin/carousel', {
        method: editId ? 'PATCH' : 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        showToast(editId ? 'Carousel item updated' : 'Carousel item created');
        resetForm();
        fetchItems();
      } else {
        showToast(data.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    setActionLoading(item._id);
    try {
      const fd = new FormData();
      fd.append('id', item._id);
      fd.append('isActive', String(!item.isActive));
      const res = await fetch('/api/admin/carousel', { method: 'PATCH', body: fd });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.map((i) => i._id === item._id ? { ...i, isActive: !item.isActive } : i));
        showToast(`Item ${!item.isActive ? 'activated' : 'deactivated'}`);
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch {
      showToast('Update failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteItem = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/carousel?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i._id !== id));
        showToast('Item deleted');
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      showToast('Delete failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const fmt = (n) => n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—';

  return (
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Carousel Management</h2>
          <p className="text-gray-500 text-sm mt-1">{items.length} carousel items</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            + Add Slide
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">{editId ? 'Edit Slide' : 'New Slide'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slide Image</label>
              <div className="flex items-start gap-4">
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="w-32 h-20 object-cover rounded-lg border" />
                )}
                <div className="flex-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">Or paste an image URL below</p>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageFile ? '' : form.image}
                    onChange={(e) => { setForm((f) => ({ ...f, image: e.target.value })); setImagePreview(e.target.value); setImageFile(null); }}
                    disabled={!!imageFile}
                    className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Label <span className="text-gray-400 font-normal">(e.g. "20% OFF")</span></label>
                <input value={form.offerLabel} onChange={(e) => setForm((f) => ({ ...f, offerLabel: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                <input value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Price (₹)</label>
                <input type="number" min="0" value={form.offerPrice} onChange={(e) => setForm((f) => ({ ...f, offerPrice: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                <input type="number" min="0" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Link</label>
                <input type="url" placeholder="https://..." value={form.productLink} onChange={(e) => setForm((f) => ({ ...f, productLink: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input type="number" min="0" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible on homepage)</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
                {saving ? 'Saving...' : editId ? 'Update Slide' : 'Create Slide'}
              </button>
              <button type="button" onClick={resetForm}
                className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Slide</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Offer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No carousel items yet. Add your first slide.</td></tr>
            ) : items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.title} className="w-16 h-10 object-cover rounded-lg border flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      {item.subtitle && <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.subtitle}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {item.offerLabel && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{item.offerLabel}</span>
                  )}
                  {item.offerPrice != null && (
                    <div className="text-xs text-gray-600 mt-1">
                      {fmt(item.offerPrice)}
                      {item.originalPrice != null && <span className="line-through text-gray-400 ml-1">{fmt(item.originalPrice)}</span>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.order}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(item)}
                    disabled={actionLoading === item._id}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(item)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                    <button onClick={() => deleteItem(item._id, item.title)} disabled={actionLoading === item._id}
                      className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
