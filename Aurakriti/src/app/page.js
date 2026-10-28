"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch } from "react-redux";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Camera,
  Award,
  Truck,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { addToCart, setCart } from "@/redux/slices/cartSlice";
import { addToCart as addToCartRequest } from "@/services/cartService";
import { getProducts } from "@/services/productService";
import ProductCard from "@/components/ProductCard";

const heroSlides = [
  {
    id: 1,
    eyebrow: "Haute Joaillerie 2026 Collection",
    title: "Sculpted in Light, Forged in Eternity",
    description:
      "Handcrafted 18k Fairmined gold and certified solitaire diamonds shaped by master lapidaries. Experience true-to-scale Virtual AR Try-On from your browser.",
    image:
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1800&q=85",
    primaryCta: { label: "Explore High Jewelry", href: "/shop" },
    secondaryCta: { label: "Virtual AR Salon", href: "/shop" },
    stat: "100% Certified Kimberley Process & BIS Hallmarked",
  },
  {
    id: 2,
    eyebrow: "Bespoke Bridal Edit",
    title: "Heirloom Masterpieces for Sacred Moments",
    description:
      "From royal uncut polki chokers to cascading diamond drop earrings, each creation carries centuries of royal Indian goldsmithing with modern grace.",
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1800&q=85",
    primaryCta: { label: "View Bridal Creations", href: "/shop?category=necklaces" },
    secondaryCta: { label: "Atelier Commissions", href: "/contact" },
    stat: "Complimentary Tailored Sizing & Insured Armored Courier",
  },
  {
    id: 3,
    eyebrow: "Contemporary Everyday Solitaires",
    title: "Elevated Luxury for the Discerning Individual",
    description:
      "Minimalist cuffs, eternal bands, and radiant pendants engineered for seamless daily wear with whisper-quiet mechanical precision.",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&q=85",
    primaryCta: { label: "Shop Solitaires", href: "/shop?category=rings" },
    secondaryCta: { label: "Our Story", href: "/about" },
    stat: "Private Salon Concierge & Lifetime Guarantee",
  },
];

const categoryItems = [
  {
    id: 1,
    name: "Necklaces & Pendants",
    count: "38 Creations",
    description: "Sculptural collarettes, diamond cascades, and heritage chokers.",
    href: "/shop?category=necklaces",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Statement Earrings",
    count: "46 Creations",
    description: "Chandelier pavé, emerald drops, and sculptural gold cuffs.",
    href: "/shop?category=earrings",
    image:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Artisanal Bracelets",
    count: "29 Creations",
    description: "Hinged bangles, tennis bracelets, and flexible gold meshes.",
    href: "/shop?category=bracelets",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Bespoke Rings",
    count: "52 Creations",
    description: "Solitaire bands, eternal pavé, and Colombian emerald cocktail rings.",
    href: "/shop?category=rings",
    image:
      "https://images.unsplash.com/photo-1601821765780-754fa98637c1?auto=format&fit=crop&w=900&q=80",
  },
];

const uspItems = [
  {
    id: 1,
    icon: Truck,
    title: "Insured Armored Courier",
    text: "Complimentary signature-required delivery across all regions.",
  },
  {
    id: 2,
    icon: Camera,
    title: "1:1 Virtual AR Try-On",
    text: "Millimeter-accurate facial & jewelry visualization in real time.",
  },
  {
    id: 3,
    icon: ShieldCheck,
    title: "Certified Authenticity",
    text: "100% BIS Hallmarked gold with conflict-free certified stones.",
  },
  {
    id: 4,
    icon: Award,
    title: "Lifetime Atelier Care",
    text: "Complimentary ultrasonic polishing, prong inspection, and resizing.",
  },
];

export default function HomePage() {
  const dispatch = useDispatch();
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [products, setProducts] = useState([]);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const { initialized, isAuthenticated, user } = useAuth();

  useEffect(() => {
    const rotation = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(rotation);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoadError("");

      try {
        const data = await getProducts({ featured: true });
        const items = Array.isArray(data?.products) ? data.products : [];

        if (isMounted) {
          if (items.length > 0) {
            setProducts(items);
          } else {
            // Curated fallback showcase products
            setProducts([
              {
                _id: "showcase-1",
                title: "The Étoile Solitaire Diamond Collarette",
                name: "The Étoile Solitaire Diamond Collarette",
                price: 84500,
                originalPrice: 95000,
                category: "necklaces",
                rating: 4.9,
                badge: "hot",
                image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
              },
              {
                _id: "showcase-2",
                title: "Cascade Royale Emerald Drop Earrings",
                name: "Cascade Royale Emerald Drop Earrings",
                price: 62000,
                originalPrice: 70000,
                category: "earrings",
                rating: 5.0,
                badge: "new",
                image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80",
              },
              {
                _id: "showcase-3",
                title: "Constellation 18K Pavé Diamond Tennis Bracelet",
                name: "Constellation 18K Pavé Diamond Tennis Bracelet",
                price: 112000,
                originalPrice: 125000,
                category: "bracelets",
                rating: 4.9,
                badge: "hot",
                image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80",
              },
              {
                _id: "showcase-4",
                title: "Sovereign Hexagonal Tourmaline Cocktail Ring",
                name: "Sovereign Hexagonal Tourmaline Cocktail Ring",
                price: 48000,
                originalPrice: 55000,
                category: "rings",
                rating: 4.8,
                badge: "sale",
                image: "https://images.unsplash.com/photo-1601821765780-754fa98637c1?auto=format&fit=crop&w=900&q=80",
              },
            ]);
          }
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error?.message || "Unable to load featured products.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) return true;
    const title = (product.title || product.name || "").toLowerCase();
    const category = (product.category || "").toLowerCase();
    return title.includes(query) || category.includes(query);
  });

  const currentSlide = heroSlides[activeSlide];

  const handleAddToCart = async (product) => {
    if (!initialized) {
      toast.info("Checking session. Please try again.");
      return;
    }

    if (isAuthenticated && user?.role !== "user") {
      toast.error("Seller accounts cannot purchase products.");
      return;
    }

    try {
      if (!isAuthenticated) {
        dispatch(
          addToCart({
            id: product._id || product.id,
            productId: product._id || product.id,
            title: product.title || product.name,
            price: Number(product.price || 0),
            image: product.image || product.images?.[0] || "",
            category: product.category || "",
            quantity: 1,
          })
        );
      } else {
        const cart = await addToCartRequest(product._id || product.id, 1);
        dispatch(setCart(cart.items ?? []));
      }

      toast.success(`${product.title || product.name} added to your shopping bag`);
    } catch (error) {
      toast.error(error.message || "Unable to add product to cart");
    }
  };

  return (
    <div className="bg-[#FDFBF7] text-[#0B0F17]">

      {/* ── HERO EDITORIAL SLIDER ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B0F17] text-white min-h-[640px] lg:min-h-[720px] flex items-center">
        {/* Background Image Carousel with Atmospheric Gradient */}
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === activeSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out"
                style={{ backgroundImage: `url("${slide.image}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17]/90 via-[#0B0F17]/65 to-black/30" />
            </div>
          ))}
        </div>

        {/* Content Box */}
        <div className="section-container relative z-10 py-20 lg:py-24 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 bg-[#0B0F17]/70 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#E5C378]" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.24em] text-[#EDE8DD]">
                {currentSlide.eyebrow}
              </span>
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-sm">
              {currentSlide.title}
            </h1>

            <p className="mt-5 text-sm sm:text-base lg:text-lg text-stone-300 leading-relaxed max-w-xl">
              {currentSlide.description}
            </p>

            {/* Call To Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={currentSlide.primaryCta.href}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#B38E46] text-[#0B0F17] text-xs font-bold uppercase tracking-wider transition shadow-lg hover:shadow-xl"
              >
                <span>{currentSlide.primaryCta.label}</span>
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>

              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md transition gap-2"
              >
                <Camera className="w-4 h-4 text-[#E5C378]" />
                <span>{currentSlide.secondaryCta.label}</span>
              </Link>
            </div>

            {/* Certifications Pill */}
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-stone-300">
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
                ✦ {currentSlide.stat}
              </span>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Dots & Controls */}
        <div className="section-container absolute bottom-6 inset-x-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeSlide
                    ? "w-8 bg-[#C5A059]"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSlide((c) => (c - 1 + heroSlides.length) % heroSlides.length)}
              className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlide((c) => (c + 1) % heroSlides.length)}
              className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-xs transition"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS & ATELIER PERKS BAR ───────────────────── */}
      <section className="border-b border-[#EAE6DF] bg-white py-10">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {uspItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3.5 p-4 rounded-xl bg-[#FDFBF7] border border-[#EAE6DF]"
                >
                  <div className="p-2.5 rounded-lg bg-[#C5A059]/15 text-[#8A6827] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B0F17] tracking-wide font-sans">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CURATED CATEGORIES ARCHITECTURE ───────────────────── */}
      <section id="categories" className="section-container py-16 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="luxury-kicker">Curated High Jewelry</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-[#0B0F17]">
              Explore by Atelier Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#0B0F17] hover:text-[#C5A059] transition"
          >
            <span>View All Collections</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categoryItems.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group relative block overflow-hidden rounded-2xl border border-[#EAE6DF] bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative h-72 w-full overflow-hidden bg-[#F7F5F0]">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-[#0B0F17] uppercase tracking-wider">
                  {cat.count}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-serif font-bold group-hover:text-[#E5C378] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-stone-200 mt-1 line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── VIRTUAL AR TRY-ON SUITE SPOTLIGHT ─────────────────── */}
      <section className="bg-[#0B0F17] text-white py-20 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-[#E5C378]/10 blur-3xl pointer-events-none" />

        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#E5C378] text-[10px] font-bold uppercase tracking-widest">
                <Camera className="w-3.5 h-3.5" />
                <span>True-to-Scale 3D Visualization</span>
              </div>

              <h2 className="mt-4 text-3xl sm:text-5xl font-serif font-bold text-white leading-tight">
                Experience True Scale Before It Reaches Your Door
              </h2>

              <p className="mt-5 text-sm sm:text-base text-stone-300 leading-relaxed">
                Step into the future of luxury shopping. Our browser-based virtual salon tracks real-time facial landmarks and ear placement with millimeter precision, allowing you to preview how solitaires and necklaces drape against your neckline.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  "No app installation required — runs directly in your mobile & desktop browser",
                  "Accurate 1:1 millimeter proportion scaling for necklaces, earrings & rings",
                  "Dynamic lighting simulator: sunlight, candlelight, and ballroom studio",
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-stone-200">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/shop"
                  className="px-7 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#B38E46] text-[#0B0F17] text-xs font-bold uppercase tracking-wider transition shadow-lg"
                >
                  Browse AR Enabled Pieces
                </Link>
                <Link
                  href="/about"
                  className="px-6 py-3.5 rounded-full border border-stone-700 bg-[#131A26] hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider transition"
                >
                  How AR Works
                </Link>
              </div>
            </div>

            {/* AR Visual Mock */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative rounded-3xl border border-[#C5A059]/30 bg-[#131A26] p-6 shadow-2xl overflow-hidden">
                <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-stone-900 flex items-center justify-center">
                  <Image
                    src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"
                    alt="AR Virtual Try-on preview"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* AR HUD overlay */}
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#C5A059] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                      Tracking Active // 60 FPS
                    </span>
                  </div>

                  <div className="absolute bottom-4 inset-x-4 p-4 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white">
                    <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">1:1 Precision Fit</p>
                    <p className="text-sm font-serif font-bold">The Étoile Solitaire Collarette</p>
                    <p className="text-xs text-stone-400 mt-0.5">Scale: 100% • Fairmined 18K Yellow Gold</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED CREATIONS / PRODUCT SHOWCASE ─────────────── */}
      <section id="featured-products" className="section-container py-16 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="luxury-kicker">Signature Releases</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-[#0B0F17]">
              Trending Atelier Curations
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B] max-w-xl">
              Impeccably finished with certified conflict-free stones and hand-set pavé. Every piece includes AR preview and complimentary resizing.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by keyword..."
              className="w-full bg-white border border-[#EAE6DF] rounded-full py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-[#C5A059]"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9BA3AF]" />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-[#F7F5F0] animate-pulse border border-[#EAE6DF]" />
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-[#EAE6DF] rounded-2xl bg-white">
              <p className="text-sm font-semibold text-[#64748B]">No items match your filter.</p>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-3 text-xs font-bold text-[#C5A059] uppercase tracking-wider underline"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <ProductCard
                key={p._id || p.id}
                product={p}
                onAddToCart={handleAddToCart}
              />
            ))
          )}
        </div>
      </section>

      {/* ── ATELIER CRAFTSMANSHIP NARRATIVE ───────────────────── */}
      <section className="bg-[#F7F5F0] py-16 sm:py-20 border-y border-[#EAE6DF]">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 lg:h-[480px] rounded-3xl overflow-hidden shadow-lg border border-[#EAE6DF]">
              <Image
                src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1200&q=85"
                alt="Master lapidary setting gemstones"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-[#EAE6DF]">
                <p className="text-[10px] uppercase tracking-widest text-[#8A6827] font-bold">Panipat & Jaipur Atelier</p>
                <p className="text-sm font-serif font-bold text-[#0B0F17]">140 Hours of Hand Finishing per Creation</p>
              </div>
            </div>

            <div>
              <span className="luxury-kicker">Maison Heritage</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-serif font-bold text-[#0B0F17]">
                The Aurakriti Standard of Precision
              </h2>
              <p className="mt-5 text-sm sm:text-base text-[#545B67] leading-relaxed">
                Founded with a reverence for timeless Indian metalwork and refined through modern CAD micro-precision, our studio ensures each prong, pavé setting, and bezel clasp is individually audited under 10x magnification.
              </p>
              <p className="mt-4 text-sm sm:text-base text-[#545B67] leading-relaxed">
                We exclusively employ 100% Fairmined gold and conflict-free gemstones audited according to the Kimberley Process.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#EAE6DF] pt-6">
                <div>
                  <p className="text-2xl font-serif font-bold text-[#C5A059]">100%</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Ethically Sourced</p>
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-[#C5A059]">18K & 22K</p>
                  <p className="text-xs text-[#64748B] mt-0.5">BIS Hallmarked</p>
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold text-[#C5A059]">Lifetime</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Atelier Care</p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#0B0F17] hover:bg-[#161F2E] text-white text-xs font-bold uppercase tracking-wider transition"
                >
                  <span>Discover Our Atelier</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
