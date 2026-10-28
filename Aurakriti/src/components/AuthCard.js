'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AuthCard({ title, subtitle, linkText, linkHref, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl shadow-lg border border-[#EAE6DF] p-8 sm:p-10"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B0F17] mb-2 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#64748B]">
            {subtitle}{' '}
            {linkText && linkHref && (
              <Link
                href={linkHref}
                className="font-bold text-[#C5A059] hover:underline transition-colors ml-1"
              >
                {linkText}
              </Link>
            )}
          </p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}