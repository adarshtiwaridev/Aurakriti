'use client';

import Image from 'next/image';
import { X, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}) {
  const subtotal = item.price * item.quantity;

  const lowStock = item.stock && item.stock <= 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="
        group relative overflow-hidden
        rounded-[30px]
        border border-[#efe4d4]
        bg-white/90 backdrop-blur-xl
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]
        transition-all duration-500
      "
    >
      {/* Background Glow */}
      <div
        className="
          absolute inset-0 opacity-0
          group-hover:opacity-100
          transition duration-500
          bg-gradient-to-r
          from-[#fff7ed]
          via-transparent
          to-[#fffaf3]
          pointer-events-none
        "
      />

      <div
        className="
          relative z-10
          flex flex-col gap-5
          p-5 sm:p-6
          lg:flex-row lg:items-center lg:justify-between
        "
      >
        {/* ================= LEFT ================= */}

        <div className="flex gap-4 sm:gap-5 flex-1 min-w-0">
          {/* Product Image */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="
              relative h-28 w-28 sm:h-32 sm:w-32
              overflow-hidden rounded-3xl
              bg-gradient-to-br
              from-[#f8ecdc]
              to-[#efe2cf]
              border border-[#f4e7d7]
              flex-shrink-0
            "
          >
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="128px"
                className="
                  object-cover
                  transition-transform duration-500
                  group-hover:scale-110
                "
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-5xl">
                ✨
              </div>
            )}

            {/* Quantity Badge */}
            <div
              className="
                absolute top-2 right-2
                h-7 min-w-[28px]
                px-2 rounded-full
                bg-white/90 backdrop-blur-md
                border border-white
                flex items-center justify-center
                text-xs font-black text-[#3d2f24]
                shadow-md
              "
            >
              {item.quantity}
            </div>
          </motion.div>

          {/* Product Info */}
          <div className="flex flex-col min-w-0 flex-1">
            {/* Category */}
            {item.category && (
              <p
                className="
                  text-[11px]
                  uppercase tracking-[0.2em]
                  text-[#b99662]
                  font-bold
                  mb-1
                "
              >
                {item.category}
              </p>
            )}

            {/* Title */}
            <h3
              className="
                text-base sm:text-lg lg:text-xl
                font-black text-[#2f241c]
                leading-snug line-clamp-2
                transition-colors duration-300
                group-hover:text-[#c3922e]
              "
            >
              {item.title}
            </h3>

            {/* Description */}
            {item.description && (
              <p
                className="
                  mt-2 text-sm
                  text-[#8b7355]
                  line-clamp-2
                  max-w-xl
                "
              >
                {item.description}
              </p>
            )}

            {/* Price */}
            <div className="mt-4 flex items-end gap-3 flex-wrap">
              <span
                className="
                  text-2xl sm:text-3xl
                  font-black text-[#c3922e]
                "
              >
                ₹{item.price.toFixed(2)}
              </span>

              {item.originalPrice &&
                item.originalPrice > item.price && (
                  <>
                    <span
                      className="
                        text-sm line-through
                        text-[#b9a28a]
                      "
                    >
                      ₹{item.originalPrice.toFixed(2)}
                    </span>

                    <span
                      className="
                        px-2.5 py-1 rounded-full
                        bg-green-100
                        text-green-700
                        text-xs font-bold
                      "
                    >
                      Save{' '}
                      {Math.round(
                        ((item.originalPrice - item.price) /
                          item.originalPrice) *
                          100
                      )}
                      %
                    </span>
                  </>
                )}
            </div>

            {/* Extra Info */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-[#8b7355]">
                <Truck size={14} />
                Free Delivery
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#8b7355]">
                <ShieldCheck size={14} />
                Secure Checkout
              </div>

              {lowStock && (
                <div
                  className="
                    text-xs font-semibold
                    text-orange-600
                  "
                >
                  Only {item.stock} left
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT ================= */}

        <div
          className="
            flex flex-row items-center justify-between
            gap-4
            lg:flex-col lg:items-end
            lg:min-w-[220px]
          "
        >
          {/* Quantity Controller */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="
              flex items-center
              rounded-full
              border border-[#f1e5d5]
              bg-[#fffaf3]
              p-1
              shadow-inner
            "
          >
            <button
              type="button"
              onClick={() => onDecrement(item.id)}
              className="
                h-10 w-10 rounded-full
                flex items-center justify-center
                text-[#5f4c3c]
                hover:bg-white
                transition-all
              "
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>

            <motion.span
              key={item.quantity}
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              className="
                min-w-[50px]
                text-center
                text-base font-black
                text-[#2f241c]
              "
            >
              {item.quantity}
            </motion.span>

            <button
              type="button"
              onClick={() => onIncrement(item.id)}
              className="
                h-10 w-10 rounded-full
                flex items-center justify-center
                text-[#5f4c3c]
                hover:bg-white
                transition-all
              "
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </motion.div>

          {/* Subtotal */}
          <div className="text-right">
            <p className="text-xs text-[#9b7a48] mb-1 uppercase tracking-wide">
              Subtotal
            </p>

            <motion.p
              key={subtotal}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="
                text-2xl sm:text-3xl
                font-black text-[#2f241c]
              "
            >
              ₹{subtotal.toFixed(2)}
            </motion.p>
          </div>

          {/* Remove Button */}
          <motion.button
            type="button"
            onClick={() => onRemove(item.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="
              inline-flex items-center gap-2
              rounded-full
              border border-red-100
              bg-red-50
              px-5 py-2.5
              text-sm font-bold text-red-600
              hover:bg-red-100
              transition-all duration-300
            "
            aria-label="Remove item"
          >
            <X size={16} />
            <span>Remove</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}