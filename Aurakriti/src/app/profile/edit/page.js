'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Navbar from '@/components/ecommerce/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/redux/slices/authSlice';
import { getProfile, updateProfile, uploadImages } from '@/services/profileService';

export default function EditProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { initialized, isAuthenticated, user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    profileImage: '',
    addressLine: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/profile/edit');
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await getProfile();
        if (!active) {
          return;
        }

        const profile = data.user;
        setForm({
          name: profile.name || '',
          phone: profile.phone || '',
          profileImage: profile.profileImage || '',
          addressLine: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          zipCode: profile.address?.zipCode || '',
          country: profile.address?.country || '',
        });
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load profile');
        }
      }
    }

    if (isAuthenticated) {
      loadProfile();
    }

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const onImagePick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setError('');
      const result = await uploadImages([file], 'profiles');
      const url = result.files?.[0]?.url;
      if (url) {
        setForm((prev) => ({ ...prev, profileImage: url }));
      }
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const payload = {
        name: form.name,
        phone: form.phone,
        profileImage: form.profileImage,
        address: {
          street: form.addressLine,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        },
      };

      const data = await updateProfile(payload);
      dispatch(updateUser(data.user));
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const backRoute = user?.role === 'seller' ? '/seller/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar searchTerm="" onSearch={() => {}} cartCount={0} />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900">Edit Profile</h1>
          <button onClick={() => router.push(backRoute)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Back
          </button>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mb-4 text-sm text-green-700">{message}</p> : null}

        <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={form.profileImage || 'https://via.placeholder.com/96x96.png?text=Profile'}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border border-slate-200"
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700">Profile Image</label>
              <input type="file" accept="image/*" onChange={onImagePick} className="mt-2 block text-sm" />
              {uploading ? <p className="mt-1 text-xs text-slate-500">Uploading image...</p> : null}
            </div>
          </div>

          <Field label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <Field label="Phone" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
          <Field label="Address" value={form.addressLine} onChange={(value) => setForm((prev) => ({ ...prev, addressLine: value }))} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
            <Field label="State" value={form.state} onChange={(value) => setForm((prev) => ({ ...prev, state: value }))} />
            <Field label="Zip Code" value={form.zipCode} onChange={(value) => setForm((prev) => ({ ...prev, zipCode: value }))} />
            <Field label="Country" value={form.country} onChange={(value) => setForm((prev) => ({ ...prev, country: value }))} />
          </div>

          <button type="submit" disabled={saving || uploading} className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
      />
    </div>
  );
}
