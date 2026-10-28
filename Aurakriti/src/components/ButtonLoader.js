'use client';

import { motion } from 'framer-motion';

export default function ButtonLoader({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const variantStyles =
    variant === 'gold'
      ? 'bg-[#C5A059] hover:bg-[#B38E46] text-[#0B0F17] shadow-sm'
      : variant === 'secondary'
      ? 'bg-white hover:bg-[#F7F5F0] text-[#0B0F17] border border-[#EAE6DF] shadow-xs'
      : 'bg-[#0B0F17] hover:bg-[#161F2E] text-white shadow-md';

  return (
    <motion.button
      type={type}
      disabled={loading || disabled}
      className={`w-full flex justify-center items-center px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${
        loading ? 'cursor-wait' : ''
      } ${className}`}
      whileHover={!loading && !disabled ? { scale: 1.01 } : {}}
      whileTap={!loading && !disabled ? { scale: 0.99 } : {}}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}