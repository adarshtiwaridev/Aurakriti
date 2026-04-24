'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCompare, removeFromCompare } from '@/redux/slices/compareSlice';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Heart } from 'lucide-react';


export default function ProductCard({ product, onAddToCart }) {
  const dispatch = useDispatch();
  const [showQuickView, setShowQuickView] = useState(false);
  const [isWishlisted, setWishlisted] = useState(false);
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
  const safeImage = product.image || product.images?.[0] || 'https://via.placeholder.com/800x800?text=Jewellery';
  const secondImage = product.images?.[1] || null;
  const rating = Number(product.rating || 4.5).toFixed(1);

  return (
    <>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-4xl border border-[#eadfce] bg-white shadow-[0_24px_70px_-44px_rgba(147,112,43,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_-42px_rgba(147,112,43,0.35)]">
        <div className="relative overflow-hidden border-b border-[#f1e5d4] bg-[#fff8ef]">
          <Link href={`/products/${productId}`} onClick={handleProductClick}>
            <div className="relative h-72 w-full overflow-hidden">
              <Image
                src={safeImage}
                alt={safeName}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover transition duration-700 group-hover:scale-110"
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

          <button
            type="button"
            onClick={toggleCompare}
            title={isInCompare ? 'Remove from compare' : compareFull ? 'Max 4 products' : 'Add to compare'}
            className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#e7dbc8] bg-white text-[11px] font-black shadow-sm transition-all ${isInCompare
              ? 'border-transparent bg-[#c9a14a] text-white'
              : compareFull
                ? 'cursor-not-allowed bg-[#f5efe5] text-[#b8a78b]'
                : 'text-[#6f5c4a] hover:bg-[#fff4e6] hover:text-[#c9a14a]'
              }`}
          >
            {isInCompare ? 'OK' : 'CP'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault(); 
              setWishlisted(!isWishlisted);
            }}
            className="absolute right-4 bottom-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 active:scale-90"
          >
            <Heart
              size={20}
              className={`transition-colors duration-300 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-[#6f5c4a]'
                }`}
            />
          </button>


        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Link href={`/products/${productId}`} onClick={handleProductClick} className="text-lg font-semibold text-[#3c2f25] transition hover:text-[#c9a14a]">
              {safeName}
            </Link>
            <p className="text-lg font-black text-[#c9a14a]">Rs {Number(product.price || 0).toLocaleString('en-IN')}</p>
          </div>

          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#967449]">Rating {rating}/5</p>
          <p className="line-clamp-2 text-sm leading-6 text-[#6b5546]">{product.description}</p>

          <div className="mt-auto space-y-3 pt-5">
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={product.isDemo}
              className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition ${product.isDemo
                ? 'cursor-not-allowed bg-[#d9cab7] text-white'
                : 'bg-[#c9a14a] text-white hover:bg-[#b88f37]'
                }`}
            >
              {product.isDemo ? 'Demo Product' : 'Add to Cart'}
            </button>

            <Link
              href={`/products/${productId}`}
              onClick={handleProductClick}
              className="inline-flex w-full items-center justify-center rounded-full border border-[#c9a14a] bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#6b5134] transition hover:bg-[#fff5e4]"
            >
              View Details
            </Link>

            <button
              type="button"
              onClick={() => setShowQuickView(true)}
              className="inline-flex w-full items-center justify-center rounded-full border border-[#efe3d2] bg-[#fffaf2] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b6142] transition hover:border-[#c9a14a]"
            >
              Quick View
            </button>
          </div>
        </div>
      </article>

      {showQuickView ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#2c241d]/35 p-4" onClick={() => setShowQuickView(false)}>
          <div className="grid w-full max-w-3xl gap-5 rounded-3xl bg-white p-5 shadow-2xl md:grid-cols-[0.95fr_1.05fr]" onClick={(event) => event.stopPropagation()}>
            <div className="relative h-64 w-full overflow-hidden rounded-2xl md:h-full">
              <Image
                src={safeImage}
                alt={safeName}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7a45]">{product.category}</p>
              <h3 className="mt-2 text-2xl font-black text-[#3a2f24]">{safeName}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6b5546]">{product.description}</p>
              <p className="mt-3 text-2xl font-black text-[#c9a14a]">Rs {Number(product.price || 0).toLocaleString('en-IN')}</p>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product);
                    setShowQuickView(false);
                  }}
                  className="rounded-xl bg-[#c9a14a] px-4 py-2 text-sm font-semibold text-white"
                >
                  Add to Cart
                </button>
                <Link href={`/products/${productId}`} className="rounded-xl border border-[#e8dccb] px-4 py-2 text-sm font-semibold text-[#5f4b38]">
                  View Product
                </Link>
                <button type="button" onClick={() => setShowQuickView(false)} className="rounded-xl border border-[#e8dccb] px-4 py-2 text-sm font-semibold text-[#5f4b38]">
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
