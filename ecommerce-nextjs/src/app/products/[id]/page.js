'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/ecommerce/Navbar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { getProduct } from '@/services/productService';
import { addToCart as addToCartRequest } from '@/services/cartService';
import { useDispatch } from 'react-redux';
import { setCart } from '@/redux/slices/cartSlice';

function ProductDetailSkeleton() {
  return (
    <section className="mt-6 grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_1fr]">
      <div className="animate-pulse">
        <div className="h-[28rem] w-full rounded-3xl bg-slate-200" />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded-full bg-slate-200" />
        <div className="h-10 w-3/4 rounded-xl bg-slate-200" />
        <div className="h-6 w-32 rounded-xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-200" />
        </div>
        <div className="flex gap-3 pt-4">
          <div className="h-12 w-32 rounded-xl bg-slate-200" />
          <div className="h-12 w-44 rounded-xl bg-slate-200" />
        </div>
      </div>
    </section>
  );
}

function ErrorCard({ message, productId }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-3xl border border-red-100 bg-red-50 px-6 py-14 text-center">
      <svg className="h-14 w-14 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h2 className="mt-4 text-xl font-black text-slate-800">Product not found</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{message}</p>
      {productId && (
        <p className="mt-1 font-mono text-xs text-slate-400">ID: {productId}</p>
      )}
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
      >
        ← Back to shopping
      </Link>
    </div>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { cartCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const productId = params?.id;

  useEffect(() => {
    if (!productId) {
      console.warn('[ProductDetails] No product ID in params — check the URL and Link href.');
      setError('No product ID provided.');
      setLoading(false);
      return;
    }

    let active = true;
    console.log('[ProductDetails] Loading product id:', productId);

    async function loadProduct() {
      try {
        setLoading(true);
        setError('');
        const data = await getProduct(productId);
        console.log('[ProductDetails] Received product:', data?.id, data?.title);
        if (!active) return;
        setProduct(data);
        setActiveImage(0);
      } catch (err) {
        console.error('[ProductDetails] Fetch error:', err.message);
        if (active) setError(err.message || 'Failed to load product');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'user') {
      setError('Seller accounts cannot buy products.');
      return;
    }

    try {
      setAdding(true);
      setError('');
      const cart = await addToCartRequest(product.id, 1);
      dispatch(setCart(cart.items ?? []));
    } catch (err) {
      setError(err.message || 'Failed to add product to cart');
    } finally {
      setAdding(false);
    }
  };

  const images = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const displayImage = images[activeImage] || 'https://placehold.co/900x900?text=Product';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar cartCount={cartCount} searchTerm="" onSearch={() => {}} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Back to shopping</Link>

        {loading && <ProductDetailSkeleton />}

        {!loading && error && !product && (
          <ErrorCard message={error} productId={productId} />
        )}

        {!loading && product && (
          <section className="mt-6 grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_1fr]">
            {/* Images */}
            <div>
              <img
                src={displayImage}
                alt={product.title}
                className="w-full rounded-3xl object-cover"
                style={{ height: '28rem' }}
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/900x900?text=Product'; }}
              />
              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {images.slice(0, 4).map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setActiveImage(idx)}
                      className={`overflow-hidden rounded-xl border-2 transition ${activeImage === idx ? 'border-emerald-500' : 'border-transparent'}`}
                    >
                      <img src={img} alt={`${product.title} ${idx + 1}`} className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600">{product.category}</p>
              <h1 className="mt-3 text-4xl font-black text-slate-900">{product.title}</h1>
              <p className="mt-4 text-lg font-black text-emerald-700">₹{Number(product.price || 0).toLocaleString('en-IN')}</p>

              {/* Stock badge */}
              <p className="mt-2 text-sm font-semibold">
                {product.stock > 0
                  ? <span className="text-emerald-600">In Stock ({product.stock} left)</span>
                  : <span className="text-red-500">Out of Stock</span>}
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-600">{product.description}</p>

              {product.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={adding || product.stock === 0}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('eco:open-chatbot', { detail: { query: product.title } }))}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Ask AI About This Product
                </button>
              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
