"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { motion } from "framer-motion";

export default function CartItem({ item, onIncrement, onDecrement, onRemove }) {
  const subtotal = item.price * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col sm:flex-row gap-5 rounded-3xl border border-[#eadfce] bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition"
    >

      {/* ---------------- IMAGE + DETAILS ---------------- */}
      <div className="flex gap-4 flex-1">
        <div className="relative h-28 w-28 sm:h-32 sm:w-32 flex-shrink-0 rounded-2xl overflow-hidden bg-[#f9f0e3]">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="128px"
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#f2e5d4] to-[#e7dccf]">
              <span className="text-3xl">✨</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-[#3d2f24] line-clamp-2">
            {item.title}
          </h3>

          <p className="mt-2 text-sm font-bold text-[#c9a14a]">
            ₹{item.price.toFixed(2)}
          </p>

          <p className="text-xs text-[#9b7a48] mt-1">Per item</p>

          {/* Mobile subtotal */}
          <p className="sm:hidden mt-3 text-sm font-semibold text-[#3d2f24]">
            Subtotal: ₹{subtotal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ---------------- CONTROLS ---------------- */}
      <div className="flex flex-col gap-4 sm:items-end">

        {/* Quantity */}
        <div className="flex items-center rounded-full border border-[#f2e5d4] bg-[#f9f0e3] overflow-hidden w-fit">
          
          <button
            type="button"
            onClick={() => onDecrement(item.id)}
            disabled={item.quantity <= 1}
            className="h-10 w-10 flex items-center justify-center text-[#5a4a3c] hover:bg-[#fff4de] disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-lg"
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span className="px-5 py-2 text-sm font-bold text-[#3d2f24] min-w-[2.5rem] text-center">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onIncrement(item.id)}
            className="h-10 w-10 flex items-center justify-center text-[#5a4a3c] hover:bg-[#fff4de] transition font-bold text-lg"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Subtotal (desktop) */}
        <div className="hidden sm:block text-right">
          <p className="text-xs text-[#9b7a48]">Subtotal</p>

          <motion.p
            key={subtotal}
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg font-black text-[#c9a14a]"
          >
            ₹{subtotal.toFixed(2)}
          </motion.p>
        </div>

        {/* Remove */}
        <motion.button
          type="button"
          onClick={() => onRemove(item.id)}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
          aria-label="Remove item"
        >
          <X size={16} />
          <span className="hidden sm:inline">Remove</span>
        </motion.button>
      </div>
    </motion.div>
  );
}