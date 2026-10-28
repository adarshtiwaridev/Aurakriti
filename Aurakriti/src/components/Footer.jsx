"use client";

import Link from "next/link";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  CreditCard,
  Lock,
  Sparkles
} from "lucide-react";
import { FaInstagram, FaXTwitter, FaFacebookF } from "react-icons/fa6";

const FOOTER_LINKS = {
  Collections: [
    { label: "All Creations", href: "/shop" },
    { label: "Necklaces & Collarettes", href: "/shop?category=necklaces" },
    { label: "Statement Earrings", href: "/shop?category=earrings" },
    { label: "Artisanal Bracelets", href: "/shop?category=bracelets" },
    { label: "Bespoke Rings", href: "/shop?category=rings" },
  ],
  ClientCare: [
    { label: "My Orders & Tracking", href: "/user/orders" },
    { label: "Personal Wishlist", href: "/wishlist" },
    { label: "Virtual AR Try-On Guide", href: "/about" },
    { label: "Concierge & Appointments", href: "/contact" },
  ],
  MaisonServices: [
    { label: "Seller Dashboard", href: "/seller/dashboard" },
    { label: "Admin Console", href: "/admin/dashboard" },
    { label: "Bespoke Atelier Commissions", href: "/contact" },
    { label: "Fairmined Ethical Sourcing", href: "/about" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Certificate of Authenticity", href: "#" },
    { label: "Complimentary Insured Courier", href: "#" },
  ],
};

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: "Complimentary Insured Courier",
    sub: "White-glove armored delivery across India",
  },
  {
    icon: RotateCcw,
    title: "Atelier Guarantee & Exchange",
    sub: "15-day complimentary exchange & resize",
  },
  {
    icon: ShieldCheck,
    title: "100% Certified Hallmarked",
    sub: "BIS Hallmarked gold & IGI certified gems",
  },
  {
    icon: Headphones,
    title: "Private Salon Concierge",
    sub: "Direct consultation with master gemologists",
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0B0F17] text-[#EDE8DD] border-t border-[#1F2937]">

      {/* ── TRUST & ATELIER PERKS BAR ────────────────────────── */}
      <div className="border-b border-stone-800/80 py-8">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-[#131A26]/50 border border-stone-800/60"
              >
                <div className="p-2.5 rounded-lg bg-[#C5A059]/15 text-[#C5A059] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-wide">{title}</h4>
                  <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN MAISON FOOTER ───────────────────────────────── */}
      <div className="section-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand & Editorial Narrative */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block group">
              <span className="text-2xl font-extrabold tracking-tight text-white font-serif">
                AURA<span className="text-[#C5A059] italic font-normal ml-0.5">KRITI</span>
              </span>
              <p className="text-[9px] uppercase tracking-[0.32em] text-[#C5A059] font-medium mt-1">
                Haute Joaillerie & Artisanal Maison
              </p>
            </Link>

            <p className="text-xs text-stone-400 leading-relaxed mt-4 max-w-sm">
              Dedicated to the sovereign craft of heritage Indian and contemporary luxury jewelry. Handcrafted with ethically sourced precious metals and certified gemstones.
            </p>

            {/* Newsletter Subscription */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-[#EDE8DD] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Join the Private Salon</span>
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full bg-[#131A26] border border-stone-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#C5A059]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A059] hover:bg-[#B38E46] text-[#0B0F17] rounded-lg text-xs font-bold uppercase tracking-wider transition shrink-0"
                >
                  Join
                </button>
              </form>
            </div>

            {/* Social Channels */}
            <div className="flex gap-2.5 mt-6">
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-[#131A26] border border-stone-800 text-stone-400 hover:text-white hover:border-[#C5A059] flex items-center justify-center transition"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-8 h-8 rounded-lg bg-[#131A26] border border-stone-800 text-stone-400 hover:text-white hover:border-[#C5A059] flex items-center justify-center transition"
              >
                <FaXTwitter className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="w-8 h-8 rounded-lg bg-[#131A26] border border-stone-800 text-stone-400 hover:text-white hover:border-[#C5A059] flex items-center justify-center transition"
              >
                <FaFacebookF className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Nav Categories */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="lg:col-span-1">
              <h4 className="text-white text-xs font-bold uppercase tracking-[0.16em] mb-4 text-[#C5A059]">
                {group.replace(/([A-Z])/g, ' $1').trim()}
              </h4>

              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-xs text-stone-400 hover:text-[#EDE8DD] hover:translate-x-0.5 inline-block transition-transform duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* ── BOTTOM COPYRIGHT & SECURITY BAR ───────────────────── */}
      <div className="border-t border-stone-800/80 py-5 bg-[#070A0F]">
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-xs">
          <p>© {year} Aurakriti Haute Joaillerie. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-stone-400 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>256-Bit SSL Encrypted Checkout</span>
            </span>
            <span className="text-stone-700">|</span>
            <span className="flex items-center gap-1 text-stone-400 text-[11px]">
              <CreditCard className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Razorpay / UPI / Cards / COD</span>
            </span>
          </div>
        </div>
      </div>

    </footer>
  );
}