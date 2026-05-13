"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { addToCart, setCart } from "@/redux/slices/cartSlice";
import { addToCart as addToCartRequest } from "@/services/cartService";

const heroSlides = [
  {
    id: 1,
    eyebrow: "New Season Collection",
    title: "Crafted pieces for everyday luxury",
    description:
      "Explore elevated essentials, artisan jewelry, and modern accessories designed to feel special from day to night.",
    image:
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1600&q=80",
    primaryCta: { label: "Shop Collection", href: "/shop" },
    secondaryCta: { label: "View Featured", href: "#featured-products" },
    stat: "Up to 40% off curated arrivals",
  },
  {
    id: 2,
    eyebrow: "Wedding Edit",
    title: "Statement designs for every celebration",
    description:
      "Discover heirloom-inspired styles, rich textures, and standout gifting picks for festive moments and special occasions.",
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1600&q=80",
    primaryCta: { label: "Explore Occasion Wear", href: "/shop" },
    secondaryCta: { label: "Browse Categories", href: "#categories" },
    stat: "Free gift wrap on premium orders",
  },
  {
    id: 3,
    eyebrow: "Best Sellers",
    title: "Top-rated favorites our customers keep reordering",
    description:
      "Find trending picks with polished finishes, versatile styling, and pricing that makes premium details easy to own.",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80",
    primaryCta: { label: "Shop Best Sellers", href: "/shop" },
    secondaryCta: { label: "See Deals", href: "#promotions" },
    stat: "4.8 average rating across featured picks",
  },
];

const categoryItems = [
  {
    id: 1,
    name: "Necklaces",
    description: "Layered chains, pendants, and timeless statement pieces.",
    href: "/shop?category=necklaces",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Earrings",
    description: "Studs, hoops, and occasion-ready sparkle for every mood.",
    href: "/shop?category=earrings",
    image:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Bracelets",
    description: "Minimal cuffs and stackable designs with refined detail.",
    href: "/shop?category=bracelets",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Rings",
    description: "Delicate bands and bold silhouettes made to stand out.",
    href: "/shop?category=rings",
    image:
      "https://images.unsplash.com/photo-1601821765780-754fa98637c1?auto=format&fit=crop&w=900&q=80",
  },
];

const promoBanners = [
  {
    id: 1,
    title: "Weekend Sale",
    subtitle: "Save up to 60% on select handcrafted favorites.",
    href: "/shop?sale=weekend",
    tone: "from-amber-200 via-orange-100 to-white",
  },
  {
    id: 2,
    title: "New Customer Perk",
    subtitle: "Get an extra 10% off your first order with instant checkout.",
    href: "/signup",
    tone: "from-emerald-200 via-teal-100 to-white",
  },
];

const uspItems = [
  {
    id: 1,
    icon: Truck,
    title: "Fast delivery",
    text: "Quick dispatch on ready-to-ship products.",
  },
  {
    id: 2,
    icon: ShieldCheck,
    title: "Secure checkout",
    text: "Protected payments and trusted order support.",
  },
  {
    id: 3,
    icon: Sparkles,
    title: "Curated quality",
    text: "Handpicked styles with premium finishing.",
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
    }, 5000);

    return () => window.clearInterval(rotation);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoadError("");

      try {
        const response = await fetch("/api/products?featured=true", {
          cache: "no-store",
        });

        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Unable to fetch featured products");
        }

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.data?.products)
            ? data.data.products
            : Array.isArray(data?.products)
              ? data.products
              : [];

        if (isMounted) {
          setProducts(items.length > 0 ? normalizeProducts(items) : []);
        }
      } catch (error) {
        console.error("Failed to load featured products:", error);
        if (isMounted) {
          setProducts([]);
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

    if (!query) {
      return true;
    }

    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  const currentSlide = heroSlides[activeSlide];

  const handleAddToCart = async (product) => {
    if (!initialized) {
      toast.info("We are still checking your session. Please try again.");
      return;
    }

    if (isAuthenticated && user?.role !== "user") {
      toast.error("Only customer accounts can add products for purchase.");
      return;
    }

    try {
      if (!isAuthenticated) {
        dispatch(addToCart({
          id: product.id,
          productId: product.id,
          title: product.name,
          price: Number(product.price || 0),
          image: product.image || "",
          category: product.category || "",
          quantity: 1,
        }));
      } else {
        const cart = await addToCartRequest(product.id, 1);
        dispatch(setCart(cart.items ?? []));
      }

      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(error.message || "Unable to add product to cart");
    }
  };

  return (
    <div className="bg-stone-50 text-stone-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.20),_transparent_28%),linear-gradient(135deg,_#1c1917_0%,_#292524_40%,_#44403c_100%)] text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ${
                index === activeSlide
                  ? "scale-100 opacity-100"
                  : "scale-105 opacity-0"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${slide.image}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
            </div>
          ))}
        </div>

        <div className="section-container relative z-10 grid min-h-[calc(100vh-4rem)] items-center gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
              {currentSlide.eyebrow}
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {currentSlide.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base text-stone-200 sm:text-lg">
              {currentSlide.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={currentSlide.primaryCta.href}
                className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300"
              >
                {currentSlide.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href={currentSlide.secondaryCta.href}
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {currentSlide.secondaryCta.label}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-stone-200">
              <span className="rounded-full bg-white/10 px-4 py-2 backdrop-blur">
                {currentSlide.stat}
              </span>
              <span>Premium packaging</span>
              <span>COD available</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur md:p-6">
            <div className="rounded-[1.5rem] bg-white p-5 text-stone-900 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-stone-500">
                    Find your next favorite
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    Shop the home edit
                  </h2>
                </div>
                <div className="rounded-full bg-stone-100 p-3">
                  <ShoppingBag className="h-5 w-5 text-stone-700" />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <label
                  htmlFor="product-search"
                  className="mb-2 block text-sm font-medium text-stone-600"
                >
                  Search featured products
                </label>
                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200">
                  <Search className="h-4 w-4 text-stone-400" />
                  <input
                    id="product-search"
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search necklaces, rings, earrings..."
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {uspItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-stone-200 bg-white p-4"
                    >
                      <div className="inline-flex rounded-full bg-amber-100 p-2 text-amber-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-stone-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-stone-500">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="section-container relative z-10 pb-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeSlide
                      ? "w-10 bg-amber-400"
                      : "w-2.5 bg-white/45 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <CarouselButton
                label="Previous slide"
                onClick={() =>
                  setActiveSlide(
                    (current) =>
                      (current - 1 + heroSlides.length) % heroSlides.length,
                  )
                }
              >
                <ChevronLeft className="h-5 w-5" />
              </CarouselButton>
              <CarouselButton
                label="Next slide"
                onClick={() =>
                  setActiveSlide((current) => (current + 1) % heroSlides.length)
                }
              >
                <ChevronRight className="h-5 w-5" />
              </CarouselButton>
            </div>
          </div>
        </div>
      </section>

  

      <main className="pb-20">
        <section id="categories" className="section-container py-16 sm:py-20">
          <SectionHeader
            eyebrow="Shop By Category"
            title="Designed to match every mood and moment"
            description="Browse polished essentials, gifting favorites, and new arrivals curated for a modern storefront experience."
            actionHref="/shop"
            actionLabel="View all categories"
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categoryItems.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="group overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className="h-72 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url("${category.image}")` }}
                />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text-stone-900">
                      {category.name}
                    </h3>
                    <ArrowRight className="h-5 w-5 text-stone-400 transition group-hover:translate-x-1 group-hover:text-stone-900" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-500">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

  

        <section
          id="featured-products"
          className="section-container pt-16 sm:pt-20"
        >
          <SectionHeader
            eyebrow="Featured Products"
            title="Best-selling styles customers love right now"
            description="A responsive, production-safe product grid with loading states, clean interactions, and fallback data when APIs are unavailable."
            actionHref="/shop"
            actionLabel="Browse all products"
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-stone-500">
              Showing{" "}
              <span className="font-semibold text-stone-900">
                {isLoading ? 8 : filteredProducts.length}
              </span>{" "}
              featured items
            </p>
            {deferredSearchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Clear search
              </button>
            ) : null}
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))
              : filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
          </div>

          {!isLoading && loadError ? (
            <div className="mt-8 rounded-[1.75rem] border border-red-200 bg-red-50 p-6 text-center shadow-sm">
              <p className="text-lg font-semibold text-red-700">Could not load featured products</p>
              <p className="mt-2 text-sm text-red-600">{loadError}</p>
            </div>
          ) : null}

          {!isLoading && !loadError && filteredProducts.length === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-stone-900">
                No products matched your search
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Try a different keyword or clear the search to see all featured
                items.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-7 text-stone-600">{description}</p>
      </div>

      <Link
        href={actionHref}
        className="inline-flex items-center text-sm font-semibold text-stone-900 transition hover:text-amber-700"
      >
        {actionLabel}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}

function CarouselButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
    >
      {children}
    </button>
  );
}

function ProductCard({ product, onAddToCart }) {
  const discount = Math.max(
    0,
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100),
  );

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden">
        <div
          className="h-72 bg-stone-100 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url("${product.image}")` }}
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 shadow-sm">
            {product.badge}
          </span>
          <button
            type="button"
            aria-label={`Save ${product.name}`}
            className="rounded-full bg-white/90 p-2 text-stone-700 shadow-sm transition hover:bg-white"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {product.category}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-stone-900">
          {product.name}
        </h3>

        <div className="mt-3 flex items-center gap-2 text-sm text-stone-500">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold text-stone-800">{product.rating}</span>
          </div>
          <span>({product.reviews} reviews)</span>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <span className="text-2xl font-semibold text-stone-900">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-stone-400 line-through">
            {formatPrice(product.originalPrice)}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {discount}% off
          </span>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="flex-1 rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Add to cart
          </button>
          <Link
            href={`/products/${product.id}`}
            className="inline-flex items-center justify-center rounded-full border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="skeleton h-72 w-full rounded-[1.25rem]" />
      <div className="mt-5 space-y-3">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-8 w-2/3" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="skeleton h-11 w-full rounded-full" />
          <div className="skeleton h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

function normalizeProducts(items) {
  return items.map((item, index) => ({
    id: String(item._id || item.id || `product-${index + 1}`),
    name: item.name || item.title || "Untitled Product",
    category: item.category?.name || item.category || "Featured",
    price: Number(item.offerPrice || item.price || 0),
    originalPrice: Number(
      item.originalPrice || item.price || item.offerPrice || 0,
    ),
    rating: Number(item.rating || 4.7),
    reviews: Number(item.reviews?.length || item.reviews || item.reviewCount || 24),
    badge: item.badge || (item.isFeatured ? "Featured" : "Popular"),
    isDemo: Boolean(item.isDemo),
    image:
      item.images?.[0]?.url ||
      item.image ||
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
  }));
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
