"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Heart,
  Eye,
  ShoppingBag,
  Star,
  Check,
  Camera,
  Sparkles
} from "lucide-react";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function PlaceholderImage({ category }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7F5F0] text-[#9BA3AF] p-6 text-center">
      <Sparkles className="w-8 h-8 text-[#C5A059] opacity-60 mb-2" />
      <span className="text-xs uppercase tracking-widest font-semibold text-[#64748B]">
        {category || "Fine Jewelry"}
      </span>
      <span className="text-[10px] text-[#94A3B8] mt-1">Aurakriti Atelier</span>
    </div>
  );
}

export default function ProductCard({
  product,
  compact = false,
  onAddToCart,
}) {
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered] = useState(false);

  const {
    id,
    _id,
    name,
    title,
    price,
    originalPrice,
    images = [],
    image,
    category,
    rating = 4.8,
    reviews,
    reviewCount = 0,
    badge,
    stock = 99,
  } = product || {};

  const productId = id || _id;
  const productTitle = name || title || "Artisanal Piece";

  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const outOfStock = stock === 0;

  const productImages = useMemo(() => {
    if (images?.length > 0) return images;
    if (image) return [image];
    return [];
  }, [images, image]);

  const activeImage =
    hovered && productImages[1]
      ? productImages[1]
      : productImages[0];

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (outOfStock || added || !onAddToCart) return;

    await onAddToCart({
      ...product,
      id: productId,
      productId: productId,
      title: productTitle,
      price: Number(price || 0),
      image: activeImage || "",
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
  };

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col h-full bg-white rounded-2xl border border-[#EAE6DF] hover:border-[#C5A059]/50 overflow-hidden transition-all duration-300 hover:shadow-[0_12px_36px_-6px_rgba(11,15,23,0.08)]"
    >
      {/* ── IMAGE SECTION ───────────────────────────────────── */}
      <div
        className="relative overflow-hidden bg-[#F7F5F0]"
        style={{ aspectRatio: compact ? "4/4.2" : "1/1" }}
      >
        <Link href={`/products/${productId}`} className="block w-full h-full">
          {activeImage ? (
            <Image
              src={activeImage}
              alt={productTitle}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <PlaceholderImage category={category} />
          )}
        </Link>

        {/* TOP STATUS BADGES */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20 pointer-events-none">
          {outOfStock ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0B0F17]/80 text-white backdrop-blur-xs">
              Out of Stock
            </span>
          ) : (
            <>
              {badge && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDFBF7]/95 text-[#8A6827] border border-[#C5A059]/60 shadow-xs">
                  {badge === "sale" && discount ? `${discount}% OFF` : badge === "hot" ? "Bestseller" : "New Arrival"}
                </span>
              )}
              {discount && !badge && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#15803D] text-white">
                  {discount}% OFF
                </span>
              )}
            </>
          )}
        </div>

        {/* WISHLIST BUTTON */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-[#EAE6DF] flex items-center justify-center text-[#545B67] hover:text-[#BE123C] transition shadow-xs"
          title="Save to Wishlist"
        >
          <Heart
            className={`w-4 h-4 transition ${
              wishlisted ? "fill-[#BE123C] text-[#BE123C]" : ""
            }`}
          />
        </button>

        {/* AR TRY-ON BADGE / BUTTON */}
        <div className="absolute bottom-3 left-3 z-20">
          <Link
            href={`/try-on/${productId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B0F17]/85 hover:bg-[#0B0F17] text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md border border-[#C5A059]/50 shadow-sm transition hover:scale-105"
            title="Launch AR Virtual Try-On for this jewelry piece"
          >
            <Camera className="w-3 h-3 text-[#E5C378]" />
            <span>AR Try-On</span>
          </Link>
        </div>

        {/* QUICK VIEW TRIGGER */}
        <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            href={`/products/${productId}`}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#0B0F17] text-[#0B0F17] hover:text-white border border-[#EAE6DF] flex items-center justify-center shadow-md transition"
            title="Quick View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── CARD CONTENT ────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Category Kicker */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A92A0]">
              {category || "High Jewelry"}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#545B67]">
              <Star className="w-3 h-3 fill-[#C5A059] text-[#C5A059]" />
              <span className="font-semibold">{Number(rating || 4.8).toFixed(1)}</span>
            </div>
          </div>

          {/* Product Title */}
          <Link href={`/products/${productId}`} className="block mt-1.5 group/title">
            <h3 className="text-sm sm:text-base font-semibold text-[#0B0F17] line-clamp-1 group-hover/title:text-[#C5A059] transition-colors">
              {productTitle}
            </h3>
          </Link>
        </div>

        {/* Price & Add to Bag Row */}
        <div className="mt-4 pt-3 border-t border-[#EAE6DF]/70 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-[#0B0F17]">
                {formatPrice(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-[#9BA3AF] line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock || added}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition flex items-center gap-1.5 shrink-0 ${
              added
                ? "bg-[#15803D] text-white"
                : outOfStock
                ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                : "bg-[#0B0F17] text-white hover:bg-[#C5A059] hover:text-[#0B0F17]"
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Bag</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}