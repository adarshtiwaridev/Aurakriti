'use client';

import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CartItem({ item, onIncrement, onDecrement, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="relative h-32 w-32 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100">
          {item.image ? (
            <img src={item.image} alt={item.title} className="h-full w-full object-cover hover:scale-110 transition-transform duration-300" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
              <span className="text-4xl">📦</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 hover:text-green-600 transition-colors">{item.title}</h3>
          <p className="mt-3 text-sm sm:text-base font-black text-green-600">₹{item.price.toFixed(2)}</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">Per item</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:items-end">
        {/* Quantity Selector */}
        <motion.div className="flex items-center rounded-full border border-slate-200 bg-slate-50 overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => onDecrement(item.id)}
            className="h-11 w-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition font-bold text-lg"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="px-6 py-2 text-sm font-black text-slate-900 min-w-[3rem] text-center">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onIncrement(item.id)}
            className="h-11 w-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition font-bold text-lg"
            aria-label="Increase quantity"
          >
            +
          </button>
        </motion.div>

        {/* Subtotal */}
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">Subtotal</p>
          <motion.p
            key={item.quantity}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-lg sm:text-xl font-black text-slate-900"
          >
            ₹{(item.price * item.quantity).toFixed(2)}
          </motion.p>
        </div>

        {/* Remove Button */}
        <motion.button
          type="button"
          onClick={() => onRemove(item.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
          aria-label="Remove item"
        >
          <X size={16} />
          <span className="hidden sm:inline">Remove</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
