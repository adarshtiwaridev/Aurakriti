'use client';

import { motion } from 'framer-motion';
import AuthCard from './AuthCard';
import { Sparkles, ShieldCheck, Camera, Award } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children, title, subtitle, linkText, linkHref }) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Left Side - Luxury Maison Showcase */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 xl:px-16 bg-[#0B0F17] text-white relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#C5A059]/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-[#E5C378]/10 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-lg relative z-10"
        >
          <div>
            <Link href="/" className="inline-block group mb-8">
              <span className="text-3xl font-extrabold tracking-tight text-white font-serif">
                AURA<span className="text-[#C5A059] italic font-normal ml-0.5">KRITI</span>
              </span>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#C5A059] font-semibold mt-1">
                Haute Joaillerie & Maison
              </p>
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl xl:text-5xl font-serif font-bold text-white leading-[1.2] mb-6"
            >
              Masterpieces in Gold, <br />
              <span className="text-[#C5A059] font-normal italic">Sculpted for Eternity</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-sm xl:text-base text-stone-300 leading-relaxed mb-10 max-w-md"
            >
              Sign in to access your personal jewelry vaults, view order status, or explore our 3D AR virtual try-on mirror.
            </motion.p>

            {/* Trust Badges Grid */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="grid grid-cols-2 gap-4 text-xs text-stone-300"
            >
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                <span>BIS Hallmarked</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                <Camera className="w-4 h-4 text-[#C5A059]" />
                <span>1:1 AR Try-On</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                <Award className="w-4 h-4 text-[#C5A059]" />
                <span>Certified Solitaires</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Atelier Resizing</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form Card Container */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
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