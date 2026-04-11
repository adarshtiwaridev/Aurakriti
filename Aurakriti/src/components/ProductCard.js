'use client';

import Image from 'next/image';
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
  const secondImage = product.images?.[1] || null;

  return (
    <>
      <article className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-[#ebdfd0] bg-white shadow-[0_26px_70px_-44px_rgba(147,112,43,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_-44px_rgba(147,112,43,0.28)]">
        <div className="relative overflow-hidden border-b border-[#f1e5d4] bg-[#fff7ed]">
          <Link href={`/products/${productId}`} onClick={handleProductClick}>
            <div className="relative h-72 w-full overflow-hidden transition duration-700 group-hover:scale-[1.02]">
              <Image
                src={safeImage}
                alt={safeName}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover transition duration-700"
              />
              {secondImage ? (
                <Image
                  src={secondImage}
                  alt={`${safeName} alternate`}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="absolute inset-0 object-cover opacity-0 transition duration-700 group-hover:opacity-100"
                />
              ) : null}
            </div>
          </Link>
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.23em] text-[#6e5642] shadow-sm">
            {product.category}
          </span>
        {/* Compare toggle badge */}
        <button
          onClick={toggleCompare}
          title={isInCompare ? 'Remove from compare' : compareFull ? 'Max 4 products' : 'Add to compare'}
          className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#e7dbc8] bg-white text-[11px] font-black shadow-sm transition-all ${
            isInCompare
              ? 'bg-[#c9a14a] text-white border-transparent'
              : compareFull
              ? 'cursor-not-allowed bg-[#f5efe5] text-[#b8a78b]'
              : 'text-[#6f5c4a] hover:bg-[#fff4e6] hover:text-[#c9a14a]'
          }`}
        >
          {isInCompare ? '✓' : '⇄'}
        </button>

        <button
          type="button"
          onClick={() => setShowQuickView(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#3d3024]/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white opacity-0 transition duration-300 group-hover:opacity-100"
        >
          Quick View
        </button>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href={`/products/${productId}`} onClick={handleProductClick} className="text-xl font-semibold text-[#3c2f25] transition hover:text-[#c9a14a]">
            {safeName}
          </Link>
          <p className="text-lg font-black text-[#c9a14a]">₹{product.price}</p>
        </div>
        <p className="text-sm leading-6 text-[#6b5546] line-clamp-2">{product.description}</p>

        <div className="mt-auto space-y-3">
          {/* Compare label */}
          {isInCompare && (
            <p className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-[#8f765d]">Added to compare</p>
          )}

          <button
            onClick={() => onAddToCart(product)}
            disabled={product.isDemo}
            className={`w-full inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_20px_45px_-25px_rgba(201,161,74,0.45)] transition ${
              product.isDemo
                ? 'bg-[#d9cab7] cursor-not-allowed shadow-none'
                : 'bg-[#c9a14a] hover:bg-[#d4af37]'
            }`}
          >
            {product.isDemo ? 'Demo Product' : 'Add to Cart'}
          </button>
          <Link
            href={`/products/${productId}`}
            onClick={handleProductClick}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[#f0e4d4] bg-[#fff8ee] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#5c4736] transition hover:border-[#c9a14a] hover:bg-[#fff4e2]"
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
