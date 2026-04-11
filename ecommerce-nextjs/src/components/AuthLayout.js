'use client';

import { motion } from 'framer-motion';
import AuthCard from './AuthCard';

export default function AuthLayout({ children, title, subtitle, linkText, linkHref }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 xl:px-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto h-20 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
            >
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-5xl font-bold text-gray-900 mb-6"
            >
              Welcome to <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">EcoShop</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed"
            >
              Your sustainable shopping destination. Discover eco-friendly products from trusted sellers.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="grid grid-cols-2 gap-6 text-sm text-gray-500"
            >
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                Carbon Neutral
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-blue-500 rounded-full mr-3"></div>
                Eco-Friendly
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-purple-500 rounded-full mr-3"></div>
                Sustainable
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-indigo-500 rounded-full mr-3"></div>
                Trusted Sellers
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 xl:px-12">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-md"
        >
          <AuthCard title={title} subtitle={subtitle} linkText={linkText} linkHref={linkHref}>
            {children}
          </AuthCard>
        </motion.div>
      </div>
    </div>
  );
}