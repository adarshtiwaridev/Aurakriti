'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Store, 
  PackageCheck, 
  ShoppingBag, 
  BarChart3, 
  Image as ImageIcon,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Layers
} from 'lucide-react';

const cards = [
  { href: '/admin/users', label: 'Manage Clients & Artisans', desc: 'View, edit roles, verify or manage accounts.', icon: Users },
  { href: '/admin/sellers', label: 'Maison Sellers', desc: 'Monitor artisanal partners and performance metrics.', icon: Store },
  { href: '/admin/products', label: 'Jewellery Moderation', desc: 'Approve, certify, or manage catalog listings.', icon: PackageCheck },
  { href: '/admin/orders', label: 'Client Orders', desc: 'Oversight of luxury orders and shipping stages.', icon: ShoppingBag },
  { href: '/admin/analytics', label: 'Atelier Intelligence', desc: 'Revenue, high-ticket pieces, and growth analysis.', icon: BarChart3 },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSummary(d.data.summary);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#EAE6DF] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#C5A059] font-medium block">
            Maison Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#0B0F17] mt-1">
            Executive Command Suite
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Role: High Atelier Admin</span>
        </div>
      </div>

      {/* Primary Action Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/admin/products" 
          className="bg-white p-6 rounded-sm border border-[#EAE6DF] hover:border-[#C5A059] transition-all duration-200 group flex items-start justify-between shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-[#0B0F17] text-[#C5A059] flex items-center justify-center shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-serif font-semibold text-[#0B0F17] group-hover:text-[#C5A059] transition-colors">
                Product Catalog Moderation
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Certify 3D models, review hallmarking metadata, and approve new listings.
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-[#C5A059] transition-colors shrink-0" />
        </Link>

        <Link 
          href="/admin/carousel" 
          className="bg-white p-6 rounded-sm border border-[#EAE6DF] hover:border-[#C5A059] transition-all duration-200 group flex items-start justify-between shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-[#F7F5F0] text-[#0B0F17] flex items-center justify-center shrink-0 border border-[#EAE6DF]">
              <ImageIcon className="w-6 h-6 text-[#C5A059]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-semibold text-[#0B0F17] group-hover:text-[#C5A059] transition-colors">
                Showcase Editorial Carousel
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Curate hero campaigns, seasonal bridal spotlights, and high-jewelry banners.
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-[#C5A059] transition-colors shrink-0" />
        </Link>
      </div>

      {/* Live Financial & Order Metrics */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-sm border border-[#EAE6DF] p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span className="uppercase tracking-wider">Gross Revenue</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-2xl font-serif text-[#0B0F17] mt-2">{summary.totalRevenue}</p>
          </div>

          <div className="bg-white rounded-sm border border-[#EAE6DF] p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span className="uppercase tracking-wider">Total Orders</span>
              <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
            </div>
            <p className="text-2xl font-serif text-[#0B0F17] mt-2">{summary.totalOrders}</p>
          </div>

          <div className="bg-white rounded-sm border border-[#EAE6DF] p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span className="uppercase tracking-wider">Active Clients</span>
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-2xl font-serif text-[#0B0F17] mt-2">{summary.totalUsers}</p>
          </div>

          <div className="bg-white rounded-sm border border-[#EAE6DF] p-5 shadow-sm">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span className="uppercase tracking-wider">Live Vault Pieces</span>
              <Layers className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-2xl font-serif text-[#0B0F17] mt-2">{summary.activeProducts}</p>
          </div>
        </div>
      )}

      {/* Operations Navigation */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-stone-500 mb-4 font-medium">
          Maison Operations Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white rounded-sm border border-[#EAE6DF] hover:border-[#C5A059] transition-all duration-200 p-5 flex items-start gap-4 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-sm bg-[#F7F5F0] border border-[#EAE6DF] flex items-center justify-center text-[#0B0F17] group-hover:bg-[#0B0F17] group-hover:text-[#C5A059] transition-colors shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0B0F17] group-hover:text-[#C5A059] transition-colors flex items-center gap-1">
                    {card.label}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{card.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}