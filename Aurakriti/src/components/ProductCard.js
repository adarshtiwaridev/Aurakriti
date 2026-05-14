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
} from "lucide-react";

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
    rating = 0,
    reviewCount = 0,
    reviews,
    badge,
    stock = 99,
  } = product;

  const productId = id || _id;
  const productTitle = name || title || "Product";

  const discount =
    originalPrice && originalPrice > price
      ? Math.round(
          ((originalPrice - price) / originalPrice) * 100
        )
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

    if (outOfStock || added || !onAddToCart) return;

    await onAddToCart({
      ...product,
      id: productId,
      title: productTitle,
      image: activeImage || "",
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  return (
    <Link
      href={`/products/${productId}`}
      className="block group h-full"
      style={{ textDecoration: "none" }}
    >
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="
          relative overflow-hidden h-full flex flex-col
          rounded-3xl border border-gray-200/70
          bg-white/80 backdrop-blur-xl
          transition-all duration-500
          hover:-translate-y-2
          hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]
        "
      >
        {/* ================= IMAGE SECTION ================= */}

        <div
          className="
            relative overflow-hidden bg-gradient-to-br
            from-gray-50 to-gray-100
          "
          style={{
            aspectRatio: compact ? "4/4.2" : "1/1",
          }}
        >
          {/* Product Image */}
          {activeImage ? (
            <Image
              src={activeImage}
              alt={productTitle}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="
                object-cover
                transition-all duration-700
                group-hover:scale-110
              "
            />
          ) : (
            <PlaceholderImage category={category} />
          )}

          {/* Gradient Overlay */}
          <div
            className="
              absolute inset-0
              bg-gradient-to-t
              from-black/10
              via-transparent
              to-transparent
              opacity-0 group-hover:opacity-100
              transition duration-500
            "
          />

          {/* Badge */}
          {!outOfStock && badge && (
            <div className="absolute top-3 left-3 z-20">
              <span
                className={`
                  px-3 py-1 rounded-full text-[11px]
                  font-semibold tracking-wide shadow-lg
                  backdrop-blur-md border border-white/30
                  ${
                    badge === "sale"
                      ? "bg-rose-500 text-white"
                      : badge === "hot"
                      ? "bg-orange-500 text-white"
                      : "bg-emerald-500 text-white"
                  }
                `}
              >
                {badge === "sale" && `${discount}% OFF`}
                {badge === "hot" && "🔥 Trending"}
                {badge === "new" && "✨ New"}
              </span>
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setWishlisted(!wishlisted);
            }}
            className="
              absolute top-3 right-3 z-20
              w-10 h-10 rounded-full
              backdrop-blur-xl
              bg-white/80
              border border-white/40
              flex items-center justify-center
              shadow-lg
              transition-all duration-300
              hover:scale-110
            "
          >
            <Heart
              size={18}
              className={`transition ${
                wishlisted
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600"
              }`}
            />
          </button>

          {/* Quick Actions */}
          <div
            className="
              absolute bottom-4 left-1/2 -translate-x-1/2
              flex items-center gap-2
              opacity-0 translate-y-6
              group-hover:opacity-100
              group-hover:translate-y-0
              transition-all duration-500
            "
          >
            <button
              className="
                w-11 h-11 rounded-full
                bg-white text-gray-800
                shadow-xl flex items-center justify-center
                hover:bg-black hover:text-white
                transition
              "
            >
              <Eye size={18} />
            </button>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="
                px-5 h-11 rounded-full
                bg-black text-white
                shadow-xl text-sm font-semibold
                flex items-center gap-2
                hover:scale-105
                transition-all duration-300
                disabled:opacity-50
              "
            >
              {added ? (
                <>
                  <Check size={16} />
                  Added
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  Add
                </>
              )}
            </button>
          </div>

          {/* Out of Stock */}
          {outOfStock && (
            <div
              className="
                absolute inset-0
                bg-white/70 backdrop-blur-sm
                flex items-center justify-center
              "
            >
              <span
                className="
                  px-5 py-2 rounded-full
                  bg-red-500 text-white
                  font-semibold text-sm
                  shadow-lg
                "
              >
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ================= CONTENT ================= */}

        <div className="flex flex-col flex-1 p-4">
          {/* Category */}
          <p
            className="
              text-[11px] uppercase tracking-[0.2em]
              text-gray-400 font-semibold mb-2
            "
          >
            {category}
          </p>

          {/* Title */}
          <h3
            className="
              text-[15px] md:text-base
              font-semibold text-gray-900
              leading-snug line-clamp-2
              min-h-[44px]
            "
          >
            {productTitle}
          </h3>

          {/* Rating */}
          {(reviewCount || reviews) > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star
                  size={15}
                  className="fill-yellow-400 text-yellow-400"
                />
                <span className="text-sm font-semibold">
                  {rating.toFixed(1)}
                </span>
              </div>

              <span className="text-sm text-gray-400">
                ({reviewCount || reviews} reviews)
              </span>
            </div>
          )}

          {/* Stock Indicator */}
          {!outOfStock && stock < 10 && (
            <div className="mt-2">
              <span
                className="
                  text-xs font-medium
                  text-orange-600
                "
              >
                Only {stock} left in stock
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-auto pt-4">
            <div className="flex items-end gap-2 flex-wrap">
              <span className="text-2xl font-bold text-gray-900">
                ₹{price.toLocaleString("en-IN")}
              </span>

              {originalPrice &&
                originalPrice > price && (
                  <>
                    <span
                      className="
                        text-sm line-through
                        text-gray-400
                      "
                    >
                      ₹
                      {originalPrice.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                    <span
                      className="
                        px-2 py-1 rounded-full
                        bg-emerald-100 text-emerald-700
                        text-xs font-semibold
                      "
                    >
                      Save {discount}%
                    </span>
                  </>
                )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

const CATEGORY_EMOJI = {
  electronics: "📱",
  footwear: "👟",
  fashion: "👗",
  home: "🏠",
  sports: "🏅",
  beauty: "💄",
  books: "📚",
  toys: "🧸",
};

function PlaceholderImage({ category = "" }) {
  const emoji =
    CATEGORY_EMOJI[
      category?.toLowerCase()
    ] || "🛍️";

  return (
    <div
      className="
        w-full h-full
        flex items-center justify-center
        text-6xl
      "
    >
      {emoji}
    </div>
  );
}