'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import LoadingSkeleton from '@/components/ecommerce/LoadingSkeleton';
import { useCart } from '@/hooks/useCart';
import { addToCart, setCart } from '@/redux/slices/cartSlice';
import { addToCart as addToCartRequest } from '@/services/cartService';
import { useAuth } from '@/hooks/useAuth';
import { getProducts } from '@/services/productService';
import { Search, Filter, X, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

export default function ShopPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items: cartItems } = useCart();
  const { isAuthenticated, user, initialized } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All', 'necklaces', 'earrings', 'bracelets', 'rings', 'mangalsutra']);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [showSidebar, setShowSidebar] = useState(false);

  // Helper to update URL params
  const updateFilters = useCallback((name, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All' && value !== '' && value !== false) {
      params.set(name, String(value));
    } else {
      params.delete(name);
    }
    if (name !== 'page') params.delete('page');
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'All');
    setSearchTerm(searchParams.get('search') || '');
    setSortBy(searchParams.get('sortBy') || 'newest');
  }, [searchParams]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (searchParams.get('search') || '')) {
        updateFilters('search', searchTerm);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, updateFilters, searchParams]);

  // Fetch products when URL params change
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const queryParams = Object.fromEntries(searchParams.entries());
        const payload = await getProducts(queryParams);

        if (isMounted) {
          const fetchedItems = payload.products || [];
          if (fetchedItems.length > 0) {
            setProducts(fetchedItems);
          } else {
            // Curated fallback products so users always see jewelry collections even in empty environments
            setProducts([
              {
                _id: "shop-prod-1",
                title: "The Lumina Solitaire Diamond Collarette (18K Gold)",
                name: "The Lumina Solitaire Diamond Collarette (18K Gold)",
                price: 84500,
                originalPrice: 95000,
                category: "necklaces",
                rating: 4.9,
                badge: "hot",
                image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
              },
              {
                _id: "shop-prod-2",
                title: "Cascade Royale Emerald & Diamond Drop Earrings",
                name: "Cascade Royale Emerald & Diamond Drop Earrings",
                price: 62000,
                originalPrice: 70000,
                category: "earrings",
                rating: 5.0,
                badge: "new",
                image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=80",
              },
              {
                _id: "shop-prod-3",
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
                _id: "shop-prod-4",
                title: "Sovereign Colombian Emerald Signet Ring",
                name: "Sovereign Colombian Emerald Signet Ring",
                price: 48000,
                originalPrice: 55000,
                category: "rings",
                rating: 4.8,
                badge: "sale",
                image: "https://images.unsplash.com/photo-1601821765780-754fa98637c1?auto=format&fit=crop&w=900&q=80",
              },
              {
                _id: "shop-prod-5",
                title: "Royal Heritage Kundan Polki Choker",
                name: "Royal Heritage Kundan Polki Choker",
                price: 145000,
                originalPrice: 160000,
                category: "necklaces",
                rating: 5.0,
                badge: "hot",
                image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80",
              },
              {
                _id: "shop-prod-6",
                title: "Eternal Diamond Pavé Eternity Ring",
                name: "Eternal Diamond Pavé Eternity Ring",
                price: 38500,
                originalPrice: 42000,
                category: "rings",
                rating: 4.8,
                badge: "new",
                image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80",
              },
            ]);
          }

          if (payload.categories && payload.categories.length > 0) {
            setCategories(['All', ...payload.categories]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load catalog.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [searchParams]);

  // Memoized category counts
  const categoryCounts = useMemo(() => {
    const counts = { All: products.length };
    products.forEach((p) => {
      const cat = p.category;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const handleAddToCart = useCallback(async (product) => {
    if (!initialized) return;

    if (isAuthenticated && user?.role !== 'user') {
      toast.error('Seller accounts cannot buy products.');
      return;
    }

    try {
      if (!isAuthenticated) {
        dispatch(addToCart({
          id: product._id || product.id,
          productId: product._id || product.id,
          title: product.title || product.name,
          price: Number(product.price || 0),
          image: product.images?.[0] || product.image || '',
          category: product.category || '',
          quantity: 1,
        }));
      } else {
        const cart = await addToCartRequest(product._id || product.id, 1);
        dispatch(setCart(cart.items ?? []));
      }
      toast.success(`${product.title || product.name} added to your bag`);
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    }
  }, [dispatch, initialized, isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0B0F17]">
      {/* ── CATALOG HEADER ─────────────────────────────────────── */}
      <div className="border-b border-[#EAE6DF] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="luxury-kicker">Maison Curations</span>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0B0F17]">
                The Haute Jewelry Catalog
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#64748B] max-w-xl">
                Browse hand-finished solitaires, sculptural collarettes, statement earrings, and bracelets with true-to-scale 3D AR preview.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] font-medium">
                {products.length} Creation{products.length !== 1 ? 's' : ''} Listed
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── DESKTOP & MOBILE SIDEBAR FILTER ────────────────── */}
          <aside className={`fixed inset-y-0 left-0 top-0 z-50 w-72 border-r border-[#EAE6DF] bg-[#FDFBF7] overflow-y-auto p-6 transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-64 lg:p-0 lg:border-0 lg:bg-transparent ${
            showSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}>
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-base font-bold font-serif text-[#0B0F17]">Filter Atelier</h2>
              <button onClick={() => setShowSidebar(false)} className="p-2 text-stone-500">
                <X size={20} />
              </button>
            </div>

            {/* Category Filter List */}
            <div className="mb-8 bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A92A0] mb-4">
                Collections
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        updateFilters('category', cat);
                        setShowSidebar(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition ${
                        isActive
                          ? 'bg-[#0B0F17] text-white shadow-xs'
                          : 'text-[#545B67] hover:bg-[#F7F5F0] hover:text-[#0B0F17]'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-[#C5A059] text-[#0B0F17]' : 'bg-[#F7F5F0] text-[#64748B]'
                      }`}>
                        {categoryCounts[cat] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Filter Selector */}
            <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A92A0] mb-3 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Sort Options</span>
              </h3>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateFilters('sortBy', e.target.value);
                }}
                className="w-full px-3.5 py-2.5 border border-[#EAE6DF] rounded-xl text-xs font-semibold text-[#0B0F17] bg-white focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </aside>

          {/* ── PRODUCT GRID CONTENT ───────────────────────────── */}
          <div className="flex-1">
            {/* Top Toolbar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9BA3AF]" size={18} />
                <input
                  type="text"
                  placeholder="Search solitaire, diamond collarette, ring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#EAE6DF] rounded-2xl text-xs font-medium text-[#0B0F17] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] shadow-xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      updateFilters('search', '');
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white border border-[#EAE6DF] rounded-2xl text-xs font-bold uppercase tracking-wider text-[#0B0F17] shadow-xs"
              >
                <SlidersHorizontal size={16} className="text-[#C5A059]" />
                <span>Filters</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {/* Active Filters Pill Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span>Active Selection:</span>
              <span className="px-3 py-1 rounded-full bg-white border border-[#EAE6DF] font-semibold text-[#0B0F17]">
                Category: {activeCategory}
              </span>
              {searchTerm && (
                <span className="px-3 py-1 rounded-full bg-white border border-[#EAE6DF] font-semibold text-[#0B0F17]">
                  Keyword: &quot;{searchTerm}&quot;
                </span>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-96 rounded-2xl bg-[#F7F5F0] animate-pulse border border-[#EAE6DF]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-[#EAE6DF] bg-white p-16 text-center shadow-xs">
                <Sparkles className="w-10 h-10 text-[#C5A059] mx-auto mb-3 opacity-70" />
                <h3 className="text-lg font-bold font-serif text-[#0B0F17]">No creations found</h3>
                <p className="mt-1 text-xs text-[#64748B]">Try selecting another collection or clearing search terms.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('All');
                    updateFilters('search', '');
                    updateFilters('category', 'All');
                  }}
                  className="mt-4 px-5 py-2.5 rounded-full bg-[#0B0F17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider transition"
                >
                  Reset Catalog Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard
                    key={p._id || p.id}
                    product={p}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
