'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AuthCard({ title, subtitle, linkText, linkHref, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 md:p-10"
    >
      <div className="text-center mb-8">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3"
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-lg"
          >
            {subtitle}{' '}
            {linkText && linkHref && (
              <Link
                href={linkHref}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
              >
                {linkText}
              </Link>
            )}
          </motion.p>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}