"use client";

import Link from "next/link";
import { useState } from "react";

/* ---------------------------
   CATEGORY DATA
---------------------------- */
export const DEFAULT_CATEGORIES = [
  { slug: "all", label: "All", emoji: "🛍️" },
  { slug: "electronics", label: "Electronics", emoji: "📱", productCount: 1240 },
  { slug: "footwear", label: "Footwear", emoji: "👟", productCount: 340 },
  { slug: "fashion", label: "Fashion", emoji: "👗", productCount: 890 },
  { slug: "home", label: "Home & Living", emoji: "🏠", productCount: 620 },
  { slug: "sports", label: "Sports", emoji: "🏅", productCount: 410 },
  { slug: "beauty", label: "Beauty", emoji: "💄", productCount: 310 },
  { slug: "books", label: "Books", emoji: "📚", productCount: 205 },
];

/* ---------------------------
   HERO SECTION (HOME)
---------------------------- */
export function Hero() {
  return (
    <div className="text-center py-14 px-4">
      <h1 className="text-3xl sm:text-5xl font-bold text-gray-900">
        Discover Products You’ll Love
      </h1>
      <p className="mt-3 text-gray-500 text-sm sm:text-base">
        Smart categories • Fast browsing • Best deals in one place
      </p>

      <Link
        href="/products"
        className="inline-block mt-6 px-6 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition"
      >
        Start Shopping
      </Link>
    </div>
  );
}

/* ---------------------------
   CATEGORY PILLS (HOME)
---------------------------- */
export function CategoryPills({
  categories = DEFAULT_CATEGORIES,
  onSelect,
  defaultSelected = "all",
}) {
  const [active, setActive] = useState(defaultSelected);

  const handleClick = (slug) => {
    setActive(slug);
    onSelect?.(slug);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
      {categories.map((c) => {
        const isActive = active === c.slug;

        return (
          <button
            key={c.slug}
            onClick={() => handleClick(c.slug)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: isActive
                ? "linear-gradient(135deg, #4F46E5, #6366F1)"
                : "#ffffff",
              color: isActive ? "#fff" : "#374151",
              border: "1px solid #E5E7EB",
              boxShadow: isActive ? "0 8px 20px rgba(79,70,229,0.25)" : "none",
            }}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------
   CATEGORY GRID (HOME DISCOVERY)
---------------------------- */
export function CategoryGrid({
  categories = DEFAULT_CATEGORIES.slice(1),
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-4 px-2">
      {categories.map(({ slug, label, emoji, productCount }) => (
        <Link
          key={slug}
          href={`/products?category=${slug}`}
          className="
            group flex flex-col items-center justify-center gap-2
            p-4 rounded-2xl bg-white border border-gray-100
            hover:shadow-lg hover:-translate-y-1 transition-all duration-200
          "
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">
            {emoji}
          </span>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="text-[11px] text-gray-400">
              {productCount?.toLocaleString()} items
            </p>
          </div>

          <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition">
            Explore →
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ---------------------------
   PRODUCT FILTER BAR (PRODUCT PAGE)
---------------------------- */
export function ProductFilters({ active, setActive }) {
  const filters = ["all", "popular", "new", "discounted"];

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b px-3 py-2 flex gap-2 overflow-x-auto">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setActive(f)}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap"
          style={{
            background: active === f ? "#111827" : "#F3F4F6",
            color: active === f ? "#fff" : "#374151",
          }}
        >
          {f}
        </button>
      ))}
    </div>
  );
}