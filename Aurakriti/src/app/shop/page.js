'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import LoadingSkeleton from '@/components/ecommerce/LoadingSkeleton';
import { addToCart, setCart } from '@/redux/slices/cartSlice';
import { addToCart as addToCartRequest } from '@/services/cartService';
import { useAuth } from '@/hooks/useAuth';
import { Search, Filter, X } from 'lucide-react';

export default function ShopPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user, initialized } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
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
    // Reset to page 1 if filtering
    if (name !== 'page') params.delete('page'); 
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (searchParams.get('search') || '')) {
        updateFilters('search', searchTerm);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, updateFilters, searchParams]);

  // Fetch products when URL params change
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?${searchParams.toString()}`, {
          credentials: 'include'
        });
        const payload = await response.json();

        if (isMounted) {
          if (payload.success) {
            setProducts(payload.data.products || []);
            // Update categories if the backend provides them, otherwise keep default
            if (payload.data.categories) setCategories(['All', ...payload.data.categories]);
          } else {
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [searchParams]);

  // Memoized calculations
  const categoryCounts = useMemo(() => {
    const counts = { All: products.length };
    products.forEach(p => {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const handleAddToCart = useCallback(async (product) => {
    if (!initialized) return;

    if (isAuthenticated && user?.role !== 'user') {
      setToastMessage('Seller accounts cannot buy products.');
      setTimeout(() => setToastMessage(''), 2200);
      return;
    }

    try {
      if (!isAuthenticated || product.isDemo) {
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
      setToastMessage(`${product.title || product.name} added to cart`);
    } catch (error) {
      setToastMessage(error.message || 'Failed to add to cart');
    }
    setTimeout(() => setToastMessage(''), 2200);
  }, [dispatch, initialized, isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-[#f8fafb] text-slate-900">
      <main className="pb-20">
        <div className="border-b border-slate-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-4xl font-black text-slate-900">Shop</h1>
            <p className="mt-2 text-slate-600">Explore our handcrafted collection of premium jewellery</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6 lg:gap-8">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 top-0 z-50 w-64 border-r border-slate-200 bg-white overflow-y-auto p-6 transition-transform duration-300 lg:relative lg:translate-x-0 ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setShowSidebar(false)}><X size={20} /></button>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Categories</h3>
                <div className="space-y-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        updateFilters('category', cat);
                        setShowSidebar(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg font-semibold transition ${
                        activeCategory === cat ? 'bg-green-600 text-white' : 'hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-xs opacity-70">{categoryCounts[cat] || 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    updateFilters('sortBy', e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rating</option>
                </select>
              </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <button 
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-lg font-semibold"
                >
                  <Filter size={20} />
                </button>
              </div>

              <div className="mb-6 text-sm text-slate-600">
                Showing {products.length} product{products.length !== 1 ? 's' : ''} 
                {activeCategory !== 'All' && ` in ${activeCategory}`}
              </div>

              {loading ? (
                <LoadingSkeleton />
              ) : products.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                  <p className="text-lg font-bold">No products found</p>
                  <button 
                    onClick={() => {setSearchTerm(''); updateFilters('search', '');}} 
                    className="mt-4 text-green-600 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard 
                      key={product._id || product.id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl font-semibold animate-in fade-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}
    </div>
  );
}