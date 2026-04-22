'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/ecommerce/Navbar';
import CategoryBar from '@/components/ecommerce/CategoryBar';
import ProductCard from '@/components/ProductCard';
import LoadingSkeleton from '@/components/ecommerce/LoadingSkeleton';
import Footer from '@/app/main/footer';
import { useCart } from '@/hooks/useCart';
import { setCart } from '@/redux/slices/cartSlice';
import { getProducts } from '@/services/productService';
import { addToCart as addToCartRequest } from '@/services/cartService';
import { useAuth } from '@/hooks/useAuth';

// HD luxury jewellery fallback images shown when no carousel items exist in DB
const HD_HERO_FALLBACK = [
  {
    id: 'hd-1',
    image: 'https://images.unsplash.com/photo-1601121141461-9d6647bef0a0?w=1920&q=85&auto=format&fit=crop',
    title: 'Timeless Elegance',
    sub: 'Bridal jewellery crafted for your most cherished moments',
    offerLabel: '',
    offerPrice: null,
    originalPrice: null,
    productLink: '',
    ctaText: 'Shop Now',
  },
  {
    id: 'hd-2',
    image: 'https://images.unsplash.com/photo-1573408301185-9519f94fdb85?w=1920&q=85&auto=format&fit=crop',
    title: 'Radiant by Design',
    sub: 'Discover our exclusive choker and necklace collections',
    offerLabel: '',
    offerPrice: null,
    originalPrice: null,
    productLink: '',
    ctaText: 'Shop Now',
  },
  {
    id: 'hd-3',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1920&q=85&auto=format&fit=crop',
    title: 'Crafted with Passion',
    sub: 'Handmade pieces that celebrate modern grace',
    offerLabel: '',
    offerPrice: null,
    originalPrice: null,
    productLink: '',
    ctaText: 'Shop Now',
  },
];

const JEWELLERY_CATEGORIES = ['Choker', 'Necklace', 'Mangalsutra', 'Watch'];

function normalizeCategory(category = '') {
  const value = String(category).trim().toLowerCase();
  if (value.includes('choker')) return 'Choker';
  if (value.includes('necklace')) return 'Necklace';
  if (value.includes('mangalsutra')) return 'Mangalsutra';
  if (value.includes('watch')) return 'Watch';
  return null;
}

function normalizeProduct(product = {}) {
  const normalizedCategory = normalizeCategory(product.category);
  if (!normalizedCategory) return null;

  const id = String(product.id ?? product._id ?? '');
  if (!id) return null;

  return {
    ...product,
    id,
    title: product.title || product.name || 'Jewellery Piece',
    image: product.image || product.images?.[0] || '',
    category: normalizedCategory,
    rating: Number(product.rating || 4.5),
    isFeatured: Boolean(product.isFeatured),
  };
}

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items: cartItems } = useCart();
  const { isAuthenticated, user, initialized } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Choker');
  const [toastMessage, setToastMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [carouselItems, setCarouselItems] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const data = await getProducts();
        if (!active) return;
        const normalized = (data.products ?? []).map(normalizeProduct).filter(Boolean);
        setProducts(normalized);
        // Use top-rated as trending
        const sorted = [...normalized].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setTrendingProducts(sorted.slice(0, 4));
      } catch (error) {
        try {
          const data = await import('@/app/data/products.json');
          const normalized = (data.products ?? [])
            .map((item) => normalizeProduct({ ...item, isDemo: true }))
            .filter(Boolean);
          setProducts(normalized);
          const sorted = [...normalized].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setTrendingProducts(sorted.slice(0, 4));
        } catch {
          console.error('Failed to load jewellery products:', error);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();
    return () => { active = false; };
  }, []);

  // Fetch dynamic carousel from backend
  useEffect(() => {
    fetch('/api/carousel')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.items.length > 0) {
          setCarouselItems(data.data.items);
        }
      })
      .catch(() => {});
  }, []);

  // Hero slides: DB carousel > product images > static fallback
  const heroSlides = useMemo(() => {
    if (carouselItems.length > 0) {
      return carouselItems.map((item) => ({
        id: item._id,
        image: item.image,
        title: item.title,
        sub: item.subtitle || '',
        offerLabel: item.offerLabel || '',
        offerPrice: item.offerPrice,
        originalPrice: item.originalPrice,
        productLink: item.productLink || '',
        ctaText: item.ctaText || 'Shop Now',
      }));
    }
    if (products.length > 0) {
      const featured = products.filter((p) => p.isFeatured);
      const source = featured.length ? featured : products;
      return source.slice(0, 4).map((p) => ({
        id: p.id,
        image: p.image,
        title: p.title,
        sub: p.description || 'Handcrafted jewellery for your special day',
        offerLabel: '',
        offerPrice: null,
        originalPrice: null,
        productLink: '',
        ctaText: 'Shop Now',
      }));
    }
    return HD_HERO_FALLBACK;
  }, [carouselItems, products]);

  // Auto-advance carousel
  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const goToPrev = () => setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const goToNext = () => setHeroIndex((prev) => (prev + 1) % heroSlides.length);

  const visibleProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const categoryFiltered = products.filter((p) => p.category === activeCategory);
    const searchFiltered = categoryFiltered.filter((p) => {
      if (!query) return true;
      return (
        String(p.title).toLowerCase().includes(query) ||
        String(p.description || '').toLowerCase().includes(query)
      );
    });
    const featured = searchFiltered.filter((p) => p.isFeatured);
    const remaining = searchFiltered.filter((p) => !p.isFeatured);
    return [...featured, ...remaining];
  }, [activeCategory, products, searchTerm]);

  const aboutImage = 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=85&auto=format&fit=crop';

  const handleAddToCart = async (product) => {
    if (product.isDemo) {
      setToastMessage('Demo mode: connect database to place live orders.');
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }
    if (!initialized) {
      setToastMessage('Verifying account, please wait...');
      setTimeout(() => setToastMessage(''), 1800);
      return;
    }
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.role !== 'user') {
      setToastMessage('Only customer accounts can place jewellery orders.');
      setTimeout(() => setToastMessage(''), 2200);
      return;
    }
    try {
      setIsAdding(true);
      const cart = await addToCartRequest(product.id, 1);
      dispatch(setCart(cart.items ?? []));
      setToastMessage(`${product.title} added to cart ✓`);
    } catch (error) {
      setToastMessage(error.message || 'Unable to add product to cart');
    } finally {
      setIsAdding(false);
      setTimeout(() => setToastMessage(''), 2200);
    }
  };

  const handleContactSubmit = (event) => {
    event.preventDefault();
    setToastMessage('Thank you! Our jewellery consultant will contact you shortly.');
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setToastMessage(''), 2600);
  };

  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#fffcf8] text-[#3d2f24]">
      <Navbar cartCount={cartQuantity} searchTerm={searchTerm} onSearch={setSearchTerm} />

      {/* ── Hero Carousel ── */}
      <section className="relative h-screen overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === heroIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0e07]/55 via-[#2c1a0a]/25 to-[#fffcf8]" />
          </div>
        ))}

        {/* Overlay card */}
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 pt-24 sm:px-10">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl rounded-[2.6rem] border border-white/30 bg-white/75 p-8 backdrop-blur-sm sm:p-12 shadow-xl"
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
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#3d2f24] shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#3d2f24] shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110"
        >
          <ChevronRight size={22} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setHeroIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${heroIndex === index ? 'w-9 bg-[#c9a14a]' : 'w-2.5 bg-white/60'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* ── Categories ── */}
        <section className="mb-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9f7a40]">Jewellery Categories</p>
              <h2 className="luxury-serif mt-3 text-3xl text-[#2f241b] sm:text-4xl">Crafted for every moment</h2>
            </div>
            <p className="text-sm text-[#7b6652]">{visibleProducts.length} designs</p>
          </div>
          <CategoryBar categories={JEWELLERY_CATEGORIES} activeCategory={activeCategory} onChange={setActiveCategory} />
        </section>

        {/* ── Products Grid ── */}
        <section id="products" className="mb-16">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9f7a40]">Featured Products</p>
            <h3 className="luxury-serif mt-3 text-3xl text-[#2f241b] sm:text-4xl">{activeCategory} Highlights</h3>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#e4d7c2] bg-white p-10 text-center text-[#7e6956]">
              No jewellery found for this category.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </section>

        {/* ── Trending / Recommendations ── */}
        {trendingProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9f7a40]">Trending Now</p>
                <h3 className="luxury-serif mt-3 text-3xl text-[#2f241b] sm:text-4xl">You May Also Love</h3>
              </div>
              <a href="/shop" className="text-sm font-semibold text-[#c9a14a] hover:text-[#b88f37] transition">
                View All →
              </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </motion.section>
        )}

        {/* ── About Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-16 grid gap-8 overflow-hidden rounded-[2.5rem] bg-[#f9f0e3] lg:grid-cols-2"
        >
          <div className="relative overflow-hidden min-h-80">
            <img
              src={aboutImage}
              alt="Aurakriti jewellery craftsmanship"
              className="h-full w-full object-cover object-center min-h-80"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9f7a40]">About Aurakriti</p>
            <h3 className="luxury-serif mt-4 text-3xl text-[#2f241b] sm:text-4xl">Timeless artistry, modern grace</h3>
            <p className="mt-6 text-base leading-8 text-[#6b5645]">
              Aurakriti brings timeless jewellery crafted with passion and precision. Each piece reflects elegance,
              tradition, and modern beauty — designed for life&apos;s most special moments.
            </p>
            <a
              href="/about"
              className="mt-8 inline-flex self-start rounded-full border-2 border-[#c9a14a] px-7 py-3 text-sm font-semibold text-[#c9a14a] transition hover:bg-[#c9a14a] hover:text-white"
            >
              Our Story
            </a>
          </div>
        </motion.section>

        {/* ── Contact Section ── */}
        <motion.section
          id="contact"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="rounded-[2.5rem] border border-[#eadfce] bg-white p-6 shadow-[0_20px_70px_-45px_rgba(147,112,43,0.3)] sm:p-10"
        >
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9f7a40]">Contact Us</p>
              <h3 className="luxury-serif mt-3 text-3xl text-[#2f241b] sm:text-4xl">Book a jewellery consultation</h3>
            </div>
            <div className="text-sm text-[#7b6652]">
              <p>hello@aurakriti.com</p>
              <p>+91 98765 43210</p>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Your Name"
              value={contactForm.name}
              onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
              className="h-12 rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 text-sm text-[#4b3a2e] outline-none transition focus:border-[#c9a14a] focus:ring-4 focus:ring-[#c9a14a1f]"
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              value={contactForm.email}
              onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
              className="h-12 rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 text-sm text-[#4b3a2e] outline-none transition focus:border-[#c9a14a] focus:ring-4 focus:ring-[#c9a14a1f]"
              required
            />
            <textarea
              rows={4}
              placeholder="Your Message"
              value={contactForm.message}
              onChange={(event) => setContactForm((prev) => ({ ...prev, message: event.target.value }))}
              className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4b3a2e] outline-none transition focus:border-[#c9a14a] focus:ring-4 focus:ring-[#c9a14a1f] resize-none md:col-span-2"
              required
            />
            <button
              type="submit"
              className="md:col-span-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#c9a14a] text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#b88f37] shadow-md hover:shadow-lg"
            >
              Send Message
            </button>
          </form>
        </motion.section>
      </main>

      <Footer />

      {toastMessage ? (
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-3xl bg-[#3d3024] px-6 py-4 text-center text-sm font-semibold text-white shadow-2xl">
          {isAdding ? 'Adding to cart...' : toastMessage}
        </div>
      ) : null}
    </div>
  );
}
