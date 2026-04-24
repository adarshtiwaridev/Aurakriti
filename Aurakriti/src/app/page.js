import HeroSection from "@/components/HeroSection";
import { CategoryGrid, PromoBanner } from "@/components/CategorySection";
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
 