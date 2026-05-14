"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CartItem({ item, onIncrement, onDecrement, onRemove, disabled = false }) {
  const subtotal = Number(item?.price || 0) * Number(item?.quantity || 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden rounded-[2rem] border border-[#eadfce] bg-white p-5 shadow-[0_24px_70px_-50px_rgba(146,110,50,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_90px_-50px_rgba(146,110,50,0.55)] sm:p-6"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fff7e8] via-[#fffdf8] to-transparent opacity-70" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-4">
          <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-[1.5rem] border border-[#f0e4d3] bg-[#f9f0e3] sm:h-32 sm:w-32">
            {item?.image ? (
              <Image
                src={item.image}
                alt={item.title || "Cart item"}
                fill
                sizes="128px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f2e5d4] to-[#e7dccf]">
                <ShoppingBag className="h-8 w-8 text-[#b99662]" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {item?.category ? (
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#b99662]">
                    {item.category}
                  </p>
                ) : null}

                <h3 className="line-clamp-2 text-lg font-bold text-[#3d2f24]">
                  {item?.title || "Product"}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#8a7256]">
                  <span className="rounded-full bg-[#fff7e8] px-3 py-1 font-semibold">
                    Unit price ₹{Number(item?.price || 0).toFixed(2)}
                  </span>
                  {typeof item?.stock === "number" ? (
                    <span className="rounded-full bg-[#f9f1e3] px-3 py-1 font-semibold">
                      {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                    </span>
                  ) : null}
                </div>
              </div>

              {item?.productId ? (
                <Link
                  href={`/products/${item.productId}`}
                  className="text-sm font-semibold text-[#9b7a48] transition hover:text-[#c3922e]"
                >
                  View product
                </Link>
              ) : null}
            </div>

            <p className="mt-4 text-sm text-[#7b6652]">
              Subtotal <span className="ml-1 font-bold text-[#3d2f24]">₹{subtotal.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-[#f2e5d4] bg-[#fffaf3] p-4 sm:min-w-[18rem] sm:flex-col sm:items-stretch">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#7b6652]">Quantity</span>
            <div className="flex w-fit items-center overflow-hidden rounded-full border border-[#eadfce] bg-white shadow-inner">
              <button
                type="button"
                onClick={() => onDecrement(item.id)}
                disabled={disabled || Number(item?.quantity || 0) <= 1}
                className="flex h-10 w-10 items-center justify-center text-[#5a4a3c] transition hover:bg-[#fff4de] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>

              <span className="min-w-[2.5rem] px-5 py-2 text-center text-sm font-bold text-[#3d2f24]">
                {item?.quantity || 1}
              </span>

              <button
                type="button"
                onClick={() => onIncrement(item.id)}
                disabled={disabled}
                className="flex h-10 w-10 items-center justify-center text-[#5a4a3c] transition hover:bg-[#fff4de] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#9b7a48]">Subtotal</p>
              <motion.p
                key={subtotal}
                initial={{ scale: 0.95, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xl font-black text-[#c9a14a]"
              >
                ₹{subtotal.toFixed(2)}
              </motion.p>
            </div>

            <motion.button
              type="button"
              onClick={() => onRemove(item.id)}
              whileTap={{ scale: 0.95 }}
              disabled={disabled}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove item"
            >
              <Trash2 size={16} />
              <span>Remove</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
