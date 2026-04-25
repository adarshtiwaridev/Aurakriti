"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useDispatch } from "react-redux";
// Adjust this import to match your actual Redux action
// import { addToCart } from "@/redux/cartSlice";

/**
 * ProductCard — generic, works for any product category.
 *
 * Props:
 *  product: {
 *    _id, name, price, originalPrice?, images[], category,
 *    rating, reviewCount, badge? ("sale"|"hot"|"new"), stock
 *  }
 *  compact?: boolean  — smaller card for sidebar / related
 */
export default function ProductCard({ product, compact = false }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const {
    _id,
    name,
    price,
    originalPrice,
    images,
    category,
    rating = 0,
    reviewCount = 0,
    badge,
    stock = 99,
  } = product;

  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const imgSrc = images?.[0] ?? null;
  const outOfStock = stock === 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (outOfStock || added) return;
    // dispatch(addToCart({ productId: _id, quantity: 1 }));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    setWishlisted((v) => !v);
  };

  return (
    <Link
      href={`/products/${_id}`}
      className="block group"
      style={{ textDecoration: "none" }}
    >
      <article
        className="card overflow-hidden h-full flex flex-col"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        {/* Image area */}
        <div
          className="relative overflow-hidden bg-gray-50"
          style={{ aspectRatio: compact ? "4/3" : "1/1" }}
        >
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <PlaceholderImage category={category} />
          )}

          {/* Badge */}
          {badge && !outOfStock && (
            <span className={`badge badge-${badge} absolute top-2.5 left-2.5`}>
              {badge === "sale" && `${discount}% off`}
              {badge === "hot"  && "🔥 Hot"}
              {badge === "new"  && "New"}
            </span>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="badge badge-danger text-sm px-3 py-1">Out of stock</span>
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="
              absolute top-2.5 right-2.5
              w-8 h-8 rounded-full bg-white shadow-sm
              flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity
              border border-gray-100
            "
          >
            <HeartIcon filled={wishlisted} />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-3 gap-1.5">
          {/* Category */}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {category}
          </p>

          {/* Name */}
          <h3
            className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 flex-1"
            title={name}
          >
            {name}
          </h3>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={rating} />
              <span className="text-[11px] text-gray-400">({reviewCount})</span>
            </div>
          )}

          {/* Price + Add to cart */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div>
              <span className="text-base font-bold text-gray-900">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-gray-400 line-through ml-1.5">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              aria-label="Add to cart"
              className="
                w-8 h-8 rounded-lg flex items-center justify-center
                text-sm font-bold transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
              "
              style={{
                background: added ? "var(--success-bg)" : "var(--brand-500)",
                color: added ? "var(--success-text)" : "#fff",
              }}
            >
              {added ? "✓" : "+"}
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function StarRating({ rating }) {
  return (
    <div className="flex" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="11" height="11"
          viewBox="0 0 20 20"
          fill={star <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "#94A3B8"} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  );
}

// Generic placeholder when no image is provided
const CATEGORY_EMOJI = {
  electronics: "📱",
  footwear:    "👟",
  fashion:     "👗",
  home:        "🏠",
  sports:      "🏅",
  beauty:      "💄",
  books:       "📚",
  toys:        "🧸",
};

function PlaceholderImage({ category = "" }) {
  const emoji =
    CATEGORY_EMOJI[category?.toLowerCase()] ??
    CATEGORY_EMOJI[Object.keys(CATEGORY_EMOJI).find((k) => category?.toLowerCase().includes(k))] ??
    "🛍️";

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: "var(--brand-50)", fontSize: "3.5rem" }}
    >
      {emoji}
    </div>
  );
}
