"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * GenericCategories — horizontal scroll pill list + icon grid.
 *
 * Props:
 *   categories: Array<{ slug, label, emoji, productCount? }>
 *   onSelect?:  (slug: string) => void  — optional controlled mode
 *   defaultSelected?: string
 */
export const DEFAULT_CATEGORIES = [
  { slug: "all",          label: "All",          emoji: "🛍️" },
  { slug: "electronics",  label: "Electronics",   emoji: "📱", productCount: 1240 },
  { slug: "footwear",     label: "Footwear",      emoji: "👟", productCount: 340 },
  { slug: "fashion",      label: "Fashion",        emoji: "👗", productCount: 890 },
  { slug: "home",         label: "Home & Living",  emoji: "🏠", productCount: 620 },
  { slug: "sports",       label: "Sports",         emoji: "🏅", productCount: 410 },
  { slug: "beauty",       label: "Beauty",         emoji: "💄", productCount: 310 },
  { slug: "books",        label: "Books",          emoji: "📚", productCount: 205 },
  { slug: "toys",         label: "Toys",           emoji: "🧸", productCount: 180 },
];

export function CategoryPills({ categories = DEFAULT_CATEGORIES, onSelect, defaultSelected = "all" }) {
  const [active, setActive] = useState(defaultSelected);

  const handleClick = (slug) => {
    setActive(slug);
    onSelect?.(slug);
  };

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {categories.map(({ slug, label, emoji }) => {
        const isActive = active === slug;
        return (
          <button
            key={slug}
            onClick={() => handleClick(slug)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium shrink-0 transition-all"
            style={{
              background: isActive ? "var(--brand-500)" : "var(--surface-card)",
              color:      isActive ? "#fff"             : "var(--gray-600)",
              border:     isActive ? "none"             : "1px solid var(--gray-200)",
              boxShadow:  isActive ? "var(--shadow-brand)" : "none",
            }}
          >
            <span>{emoji}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function CategoryGrid({ categories = DEFAULT_CATEGORIES.slice(1) }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-9 gap-3">
      {categories.map(({ slug, label, emoji, productCount }) => (
        <Link
          key={slug}
          href={`/products?category=${slug}`}
          className="
            group flex flex-col items-center gap-2 p-3 rounded-xl
            bg-white border border-gray-200 text-center
            hover:border-indigo-300 hover:bg-indigo-50 transition-all
          "
          style={{ textDecoration: "none" }}
        >
          <span
            className="text-2xl leading-none group-hover:scale-110 transition-transform"
            style={{ display: "block" }}
          >
            {emoji}
          </span>
          <span className="text-[11px] font-semibold text-gray-600 leading-tight">{label}</span>
          {productCount != null && (
            <span className="text-[10px] text-gray-400">{productCount.toLocaleString()}</span>
          )}
        </Link>
      ))}
    </div>
  );
}

/**
 * PromoBanner — full-width dismissible sale strip.
 */
export function PromoBanner({
  title = "Weekend Sale — Up to 60% Off",
  subtitle = "Limited time on Electronics & Fashion. Ends Sunday midnight.",
  ctaLabel = "Shop the sale",
  ctaHref = "/deals",
  color = "green",   // "green" | "indigo" | "amber"
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const themes = {
    green:  { bg: "#F0FDF4", border: "#A7F3D0", titleColor: "#065F46", subColor: "#047857", btnBg: "#065F46" },
    indigo: { bg: "var(--brand-50)", border: "var(--brand-200)", titleColor: "var(--brand-700)", subColor: "var(--brand-600)", btnBg: "var(--brand-600)" },
    amber:  { bg: "#FFFBEB", border: "#FCD34D", titleColor: "#92400E", subColor: "#B45309", btnBg: "#92400E" },
  };
  const t = themes[color] ?? themes.green;

  return (
    <div
      className="relative flex items-center justify-between gap-4 rounded-xl px-6 py-4 flex-wrap"
      style={{ background: t.bg, border: `1px solid ${t.border}` }}
    >
      <div>
        <p className="font-bold text-base" style={{ color: t.titleColor }}>🎉 {title}</p>
        <p className="text-sm mt-0.5" style={{ color: t.subColor }}>{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={ctaHref}
          className="btn btn-sm"
          style={{ background: t.btnBg, color: "#fff", border: "none" }}
        >
          {ctaLabel}
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-lg leading-none opacity-40 hover:opacity-70 transition-opacity"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
