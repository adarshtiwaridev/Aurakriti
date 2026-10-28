"use client";

import Link from "next/link";
import { useState } from "react";

/* ---------------------------
   CATEGORY DATA
---------------------------- */
export const DEFAULT_CATEGORIES = [
  { slug: "all", label: "All Collections", icon: "✨" },
  { slug: "necklace", label: "Necklaces & Chokers", icon: "📿", productCount: 48 },
  { slug: "earrings", label: "Jhumkas & Studs", icon: "💎", productCount: 64 },
  { slug: "rings", label: "Solitaires & Bands", icon: "💍", productCount: 32 },
  { slug: "bracelets", label: "Bracelets & Cuffs", icon: "✨", productCount: 28 },
  { slug: "bangles", label: "Polki & Bangles", icon: "🪙", productCount: 42 },
  { slug: "bridal", label: "Bridal Sets", icon: "👑", productCount: 19 },
];

/* ---------------------------
   HERO SECTION (HOME)
---------------------------- */
export function Hero() {
  return (
    <div className="text-center py-16 px-4 bg-[#FDFBF7]">
      <span className="text-xs uppercase tracking-[0.25em] text-[#C5A059] font-medium block mb-2">
        Haute Joaillerie & Artisanal Maison
      </span>
      <h1 className="text-3xl sm:text-5xl font-serif text-[#0B0F17] tracking-tight">
        Timeless Elegance, Rendered in Real-Time
      </h1>
      <p className="mt-3 text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
        Curated certified gold, diamonds, and heritage polki with precision AR virtual fitting.
      </p>

      <Link
        href="/shop"
        className="inline-block mt-6 px-7 py-3 rounded-sm bg-[#0B0F17] text-white hover:bg-[#1E293B] text-xs uppercase tracking-widest transition shadow-sm"
      >
        Explore Collections
      </Link>
    </div>
  );
}

/* ---------------------------
   CATEGORY PILLS
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
            className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs uppercase tracking-wider shrink-0 transition-all duration-200"
            style={{
              background: isActive ? "#0B0F17" : "#FFFFFF",
              color: isActive ? "#C5A059" : "#4B5563",
              border: isActive ? "1px solid #0B0F17" : "1px solid #EAE6DF",
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------
   CATEGORY GRID
---------------------------- */
export function CategoryGrid({
  categories = DEFAULT_CATEGORIES.slice(1),
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 px-2">
      {categories.map(({ slug, label, productCount }) => (
        <Link
          key={slug}
          href={`/shop?category=${slug}`}
          className="
            group flex flex-col items-center justify-center gap-2
            p-5 rounded-sm bg-white border border-[#EAE6DF]
            hover:border-[#C5A059] hover:shadow-md transition-all duration-200
          "
        >
          <div className="text-center">
            <p className="text-xs font-serif font-semibold text-[#0B0F17] group-hover:text-[#C5A059] transition-colors">{label}</p>
            <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">
              {productCount ? `${productCount} pieces` : "Atelier Vault"}
            </p>
          </div>

          <span className="text-[10px] uppercase tracking-widest text-[#C5A059] opacity-0 group-hover:opacity-100 transition mt-1">
            Discover →
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ---------------------------
   PRODUCT FILTER BAR
---------------------------- */
export function ProductFilters({ active, setActive }) {
  const filters = ["all", "popular", "new", "discounted"];

  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#EAE6DF] px-3 py-2 flex gap-2 overflow-x-auto">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setActive(f)}
          className="px-4 py-1.5 rounded-sm text-xs uppercase tracking-wider transition whitespace-nowrap"
          style={{
            background: active === f ? "#0B0F17" : "#F7F5F0",
            color: active === f ? "#C5A059" : "#6B7280",
            border: active === f ? "1px solid #0B0F17" : "1px solid #EAE6DF",
          }}
        >
          {f}
        </button>
      ))}
    </div>
  );
}