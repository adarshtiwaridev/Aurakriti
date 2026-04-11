'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCompare, removeFromCompare } from '@/redux/slices/compareSlice';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

export default function ProductCard({ product, onAddToCart }) {
  const dispatch = useDispatch();
  const [showQuickView, setShowQuickView] = useState(false);
  const compareItems = useSelector((state) => state.compare.items);
  const { addToViewed } = useRecentlyViewed();
  const productId = useMemo(() => String(product.id ?? product._id ?? ''), [product.id, product._id]);
  const isInCompare = compareItems.some((p) => String(p.id ?? p._id) === productId);
  const compareFull = compareItems.length >= 4 && !isInCompare;

  const handleProductClick = () => {
    addToViewed({ ...product, id: productId });
  };

  const toggleCompare = () => {
    if (isInCompare) {
      dispatch(removeFromCompare(productId));
    } else if (!compareFull) {
      dispatch(addToCompare({ ...product, id: productId }));
    }
  };

  const safeName = product.name || product.title;
  const safeImage = product.image || product.images?.[0] || 'https://via.placeholder.com/800x800?text=Product';

  return (
    <>
      <article className="group relative flex flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-50">
      <div className="relative overflow-hidden border-b border-slate-200">
        <Link href={`/products/${productId}`} onClick={handleProductClick}>
          <img src={safeImage} alt={safeName} className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-700 shadow-sm">
          {product.category}
        </span>
        {/* Compare toggle badge */}
        <button
          onClick={toggleCompare}
          title={isInCompare ? 'Remove from compare' : compareFull ? 'Max 4 products' : 'Add to compare'}
          className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-md transition-all ${
            isInCompare
              ? 'bg-green-600 text-white'
              : compareFull
              ? 'cursor-not-allowed bg-slate-200 text-slate-400'
              : 'bg-white text-slate-600 hover:bg-green-50 hover:text-green-600'
          }`}
        >
          {isInCompare ? '✓' : '⇄'}
        </button>

        <button
          type="button"
          onClick={() => setShowQuickView(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white opacity-0 transition duration-300 group-hover:opacity-100"
        >
          Quick View
        </button>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href={`/products/${productId}`} onClick={handleProductClick} className="text-xl font-bold text-slate-900 hover:text-green-700">
            {safeName}
          </Link>
          <p className="text-lg font-black text-green-600">₹{product.price}</p>
        </div>
        <p className="text-sm leading-6 text-slate-600 line-clamp-2">{product.description}</p>

        <div className="mt-auto">
          {/* Compare label */}
          {isInCompare && (
            <p className="mb-2 text-center text-xs font-semibold text-green-600">Added to compare</p>
          )}

          <button
            onClick={() => onAddToCart(product)}
            className="w-full inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-green-100 transition hover:bg-green-700"
          >
            Add to Cart
          </button>
          <Link
            href={`/products/${productId}`}
            onClick={handleProductClick}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
          >
            View Details
          </Link>
        </div>
      </div>
      </article>

      {showQuickView ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowQuickView(false)}>
          <div className="grid w-full max-w-3xl gap-5 rounded-3xl bg-white p-5 shadow-2xl md:grid-cols-[0.95fr_1.05fr]" onClick={(event) => event.stopPropagation()}>
            <img src={safeImage} alt={safeName} className="h-64 w-full rounded-2xl object-cover md:h-full" />
            <div className="flex flex-col">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">{product.category}</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{safeName}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>
              <p className="mt-3 text-2xl font-black text-emerald-700">₹{Number(product.price || 0).toLocaleString('en-IN')}</p>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <button
                  onClick={() => {
                    onAddToCart(product);
                    setShowQuickView(false);
                  }}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Add to Cart
                </button>
                <Link href={`/products/${productId}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  View Product
                </Link>
                <button onClick={() => setShowQuickView(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
