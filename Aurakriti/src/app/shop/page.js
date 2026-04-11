'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/ecommerce/Navbar';
import ProductCard from '@/components/ProductCard';
import LoadingSkeleton from '@/components/ecommerce/LoadingSkeleton';
import { useCart } from '@/hooks/useCart';
import { setCart } from '@/redux/slices/cartSlice';
import { addToCart as addToCartRequest } from '@/services/cartService';
import { useAuth } from '@/hooks/useAuth';
import Footer from '@/app/main/footer';
import { Search, Filter, X } from 'lucide-react';

// Cache for products to avoid refetching
let productCache = null;
let categoryCache = null;

export default function ShopPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items: cartItems } = useCart();
  const { isAuthenticated, user, initialized } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSidebar, setShowSidebar] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 5000]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load products on mount
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        // Check if we already have cached products
        if (productCache && categoryCache) {
          setProducts(productCache);
          setCategories(categoryCache);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/products', { 
          credentials: 'include'
        });
        const payload = await response.json();
        
        if (!active) return;
        
        if (payload.success && payload.data?.products) {
          productCache = payload.data.products;
          const uniqueCategories = ['All', ...[...new Set(payload.data.products.map(p => p.category).filter(Boolean))]];
          categoryCache = uniqueCategories;
          setProducts(productCache);
          setCategories(categoryCache);
        } else throw new Error('API failed');
      } catch (error) {
        try {
          const data = await import('@/app/data/products.json');
          productCache = data.products.map(p => ({ ...p, isDemo: true })); // Mark as demo products
          const uniqueCategories = ['All', ...[...new Set(data.products.map(p => p.category))]];
          categoryCache = uniqueCategories;
          setProducts(productCache);
          setCategories(categoryCache);
        } catch {
          console.error('Failed to load products:', error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  // Memoize category counts
  const categoryCounts = useMemo(() => {
    const counts = { All: products.length };
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Search filter (using debounced term)
    const query = debouncedSearchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter(p => 
        (p.name || p.title || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query)
      );
    }

    // Price range filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sorting
    const sorted = [...result];
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    return sorted;
  }, [products, activeCategory, debouncedSearchTerm, sortBy, priceRange]);

  const handleAddToCart = useCallback(async (product) => {
    // Check if this is a demo product
    if (product.isDemo) {
      setToastMessage('Demo products cannot be added to cart. Please connect to database for full functionality.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    // Wait for auth initialization
    if (!initialized) {
      setToastMessage('Please wait while we verify your account...');
      setTimeout(() => setToastMessage(''), 2000);
      return;
    }

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'user') {
      setToastMessage('Seller accounts cannot buy products.');
      setTimeout(() => setToastMessage(''), 2200);
      return;
    }

    try {
      const cart = await addToCartRequest(product.id, 1);
      dispatch(setCart(cart.items ?? []));
      setToastMessage(`${product.name || product.title} added to cart`);
    } catch (error) {
      setToastMessage(error.message || 'Failed to add product to cart');
    }
    setTimeout(() => setToastMessage(''), 2200);
  }, [isAuthenticated, user, router, dispatch, initialized]);

  const cartQuantity = useMemo(() => 
    cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  return (
    <div className="min-h-screen bg-[#f8fafb] text-slate-900">
      <Navbar cartCount={cartQuantity} searchTerm={searchTerm} onSearch={setSearchTerm} />
      
      <main className="pt-24 pb-20">
        {/* Page Header */}
        <div className="border-b border-slate-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-4xl font-black text-slate-900">Shop</h1>
            <p className="mt-2 text-slate-600">Explore our handcrafted collection of premium jewellery</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-6 lg:gap-8">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 top-24 z-40 w-64 border-r border-slate-200 bg-white overflow-y-auto p-6 transition-transform duration-300 lg:relative lg:top-0 lg:z-0 lg:translate-x-0 ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Categories Section */}
              <div className="mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-700 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        setShowSidebar(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                        activeCategory === category
                          ? 'bg-green-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        {category}
                        <span className="text-xs font-semibold">
                          {categoryCounts[category] || 0}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-700 mb-4">Price Range</h3>
                <div>
                  <label className="text-xs text-slate-600">Max: ₹{priceRange[1]}</label>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-green-600"
                  />
                </div>
              </div>

              {/* Sorting Options */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-700 mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rating</option>
                </select>
              </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {showSidebar && (
              <div 
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}

            {/* Product Grid */}
            <div className="flex-1">
              {/* Top Bar */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Filter size={20} />
                  Filters
                </button>
              </div>

              {/* Results Count */}
              <div className="mb-6 text-sm text-slate-600">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} 
                {activeCategory !== 'All' && ` in ${activeCategory}`}
              </div>

              {/* Products Grid */}
              {loading ? (
                <LoadingSkeleton />
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-4xl border border-dashed border-slate-200 bg-white p-16 text-center">
                  <p className="text-lg font-bold text-slate-900">No products found</p>
                  <p className="mt-3 text-sm text-slate-500">Try adjusting your filters or search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold animate-pulse">
          {toastMessage}
        </div>
      )}

      <Footer />
    </div>
  );
}
