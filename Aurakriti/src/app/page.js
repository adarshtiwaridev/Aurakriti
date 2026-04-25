"use client";

// import HeroSection from "@/components/HeroSection";
// import { CategoryGrid, PromoBanner } from "@/components/CategorySection";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
 
// Mock fetch — replace with your actual server-side data fetching
async function getFeaturedProducts() {
  // Replace this with your real DB/API call, e.g.:
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?featured=true&limit=8`);
  // return res.json();
  return [];
}
 
export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
 
  return (
 
    <div className="min-h-screen bg-[#fffcf8] text-[#3d2f24]">
      <Navbar cartCount={cartQuantity} searchTerm={searchTerm} onSearch={setSearchTerm} />

      {/* ── Hero Carousel ── */}
      <section className="relative h-screen overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className={`h-full w-full object-cover object-center transition-transform duration-[6000ms] ease-out ${index === heroIndex ? 'scale-105' : 'scale-100'}`}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0e07]/55 via-[#2c1a0a]/25 to-[#fffcf8]" />
          </div>
        ))}

        {/* Overlay card */}
        <div className="relative z-20 pointer-events-none mx-auto flex h-full max-w-7xl items-center px-6 pt-24 sm:px-10">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto max-w-2xl rounded-[2.6rem] border border-white/30 bg-white/75 p-8 backdrop-blur-sm sm:p-12 shadow-xl"
          >
            <p className="luxury-serif text-xs uppercase tracking-[0.45em] text-[#9b7a48]">Aurakriti Collection</p>

            {/* Offer badge */}
            {heroSlides[heroIndex]?.offerLabel && (
              <span className="mt-3 inline-block rounded-full bg-[#c9a14a] px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow">
                {heroSlides[heroIndex].offerLabel}
              </span>
            )}

            <h1 className="luxury-serif mt-5 text-4xl leading-tight text-[#2f241b] sm:text-6xl">
              {heroSlides[heroIndex]?.title || 'Timeless Elegance'}
            </h1>
            <p className="mt-5 text-base leading-8 text-[#6b5645] sm:text-lg">
              {heroSlides[heroIndex]?.sub || 'Discover handcrafted jewellery designed for modern grace'}
            </p>

            {/* Price display */}
            {heroSlides[heroIndex]?.offerPrice != null && (
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-[#c9a14a]">
                  ₹{Number(heroSlides[heroIndex].offerPrice).toLocaleString('en-IN')}
                </span>
                {heroSlides[heroIndex]?.originalPrice != null && (
                  <span className="text-base text-gray-400 line-through">
                    ₹{Number(heroSlides[heroIndex].originalPrice).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            )}

            <a
              href={heroSlides[heroIndex]?.productLink || '#products'}
              className="mt-8 inline-flex rounded-full bg-[#c9a14a] px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#b88f37] shadow-lg"
            >
              {heroSlides[heroIndex]?.ctaText || 'Shop Now'}
            </a>
          </motion.div>
        </div>

        {/* Arrow navigation */}
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-30 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#3d2f24] shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-30 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#3d2f24] shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110"
        >
          <ChevronRight size={22} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-10 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setHeroIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${heroIndex === index ? 'w-9 bg-[#c9a14a]' : 'w-2.5 bg-white/60'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
 
    <main>
      {/* ── Hero ───────────────────────────────────────────── */}
      <HeroSection />
 
      {/* ── Categories ─────────────────────────────────────── */}
      <section className="section-container py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-heading">Browse by category</h2>
          <Link href="/products" className="text-sm font-semibold text-indigo-500 hover:text-indigo-700">
            All categories →
          </Link>
 
        </div>
        <CategoryGrid />
      </section>
 
      {/* ── Promo banner ───────────────────────────────────── */}
      <div className="section-container pb-8">
        <PromoBanner
          title="Weekend Sale — Up to 60% Off"
          subtitle="Limited time offer on Electronics & Fashion. Ends Sunday midnight."
          ctaLabel="Shop the sale"
          ctaHref="/deals"
          color="green"
        />
      </div>
 
      {/* ── Featured products ──────────────────────────────── */}
      <section className="section-container pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-heading">Featured products</h2>
          <Link href="/products" className="text-sm font-semibold text-indigo-500 hover:text-indigo-700">
            View all →
          </Link>
        </div>
 
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          /* Skeleton placeholders while loading / no data */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}
      </section>
 
      {/* ── Secondary banner ───────────────────────────────── */}
      <div className="section-container pb-12">
        <PromoBanner
          title="Sell on Aurakriti"
          subtitle="Reach millions of customers. Open your shop today — it's free."
          ctaLabel="Start selling"
          ctaHref="/seller"
          color="indigo"
        />
      </div>
    </main>
  );
}
 
function ProductCardSkeleton() {
  return (
    <div
      className="card overflow-hidden"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="skeleton" style={{ aspectRatio: "1/1", width: "100%" }} />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="flex justify-between items-center mt-1">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
 