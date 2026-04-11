'use client';

import { useSelector, useDispatch } from 'react-redux';
import { removeFromCompare, clearCompare } from '@/redux/slices/compareSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ecommerce/Navbar';
import { useCart } from '@/hooks/useCart';

const ROWS = [
  { key: 'image',       label: 'Image' },
  { key: 'title',       label: 'Name' },
  { key: 'price',       label: 'Price (₹)' },
  { key: 'category',    label: 'Category' },
  { key: 'stock',       label: 'Stock' },
  { key: 'rating',      label: 'Rating' },
  { key: 'tags',        label: 'Specifications' },
  { key: 'description', label: 'Description' },
];

function getBest(products, key) {
  if (products.length < 2) return null;
  const values = products.map((p) => Number(p[key] ?? 0));
  if (values.every((v) => v === 0)) return null;

  if (key === 'price') return Math.min(...values);          // lower is better
  if (key === 'rating') return Math.max(...values);         // higher is better
  if (key === 'stock') return Math.max(...values);          // higher is better
  return null;
}

function CellValue({ product, rowKey, best }) {
  const val = product[rowKey];

  if (rowKey === 'image') {
    return (
      <img
        src={val || 'https://via.placeholder.com/200x200.png?text=No+Image'}
        alt={product.title}
        className="mx-auto h-40 w-40 rounded-2xl object-cover shadow-sm"
      />
    );
  }

  if (rowKey === 'description') {
    return <p className="text-sm leading-6 text-slate-600">{val}</p>;
  }

  if (rowKey === 'tags') {
    const tags = Array.isArray(val) ? val : [];
    if (!tags.length) {
      return <span className="text-slate-400">No specifications</span>;
    }

    return (
      <div className="flex flex-wrap justify-center gap-1.5">
        {tags.map((tag, index) => (
          <span key={`${tag}-${index}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
            {tag}
          </span>
        ))}
      </div>
    );
  }

  const numVal = Number(val ?? 0);
  const isBest = best !== null && numVal === best;

  let highlight = '';
  if (isBest) {
    if (rowKey === 'price') highlight = 'text-green-600 font-black';
    else highlight = 'text-green-600 font-black';
  }

  if (rowKey === 'stock') {
    const inStock = numVal > 0;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
        {inStock ? `✓ ${numVal} in stock` : '✗ Out of stock'}
      </span>
    );
  }

  if (rowKey === 'rating') {
    return (
      <span className={`flex items-center justify-center gap-1 ${highlight}`}>
        {'★'.repeat(Math.round(numVal || 0))}{'☆'.repeat(5 - Math.round(numVal || 0))}
        {isBest && <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">BEST</span>}
      </span>
    );
  }

  if (rowKey === 'price') {
    return (
      <span className={`text-lg ${highlight}`}>
        ₹{numVal.toLocaleString('en-IN')}
        {isBest && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">LOWEST</span>}
      </span>
    );
  }

  return <span className={highlight || 'text-slate-800'}>{String(val ?? '—')}</span>;
}

export default function ComparePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const products = useSelector((state) => state.compare.items);
  const { cartCount } = useCart();

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar searchTerm="" onSearch={() => {}} cartCount={cartCount} />
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-center">
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 shadow-sm">
            <div className="mb-4 text-5xl">⇄</div>
            <h1 className="text-2xl font-black text-slate-900">No products selected</h1>
            <p className="mt-2 text-slate-500">Go back and tap the ⇄ button on any product card to add it here.</p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-full bg-green-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-green-100 hover:bg-green-700"
            >
              Browse Products
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar searchTerm="" onSearch={() => {}} cartCount={cartCount} />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Compare Products</h1>
            <p className="mt-1 text-sm text-slate-500">
              Comparing {products.length} product{products.length > 1 ? 's' : ''} — select up to 4
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => dispatch(clearCompare())}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear All
            </button>
            <Link
              href="/"
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              + Add More
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-150 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {/* Feature label column */}
                <th className="sticky left-0 z-10 w-36 bg-slate-50 px-5 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  Feature
                </th>
                {products.map((product) => (
                  <th key={product.id} className="px-5 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="line-clamp-1 max-w-40 text-sm font-black text-slate-900">
                        {product.title}
                      </span>
                      <button
                        onClick={() => dispatch(removeFromCompare(product.id))}
                        className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ROWS.map((row, rowIndex) => {
                const best = getBest(products, row.key);
                return (
                  <tr
                    key={row.key}
                    className={`border-b border-slate-100 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="sticky left-0 z-10 px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500"
                      style={{ backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : 'rgb(248 250 252 / 0.5)' }}>
                      {row.label}
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="px-5 py-4 text-center align-top">
                        <CellValue product={product} rowKey={row.key} best={best} />
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Add to Cart row */}
              <tr className="bg-green-50">
                <td className="sticky left-0 z-10 bg-green-50 px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500" />
                {products.map((product) => (
                  <td key={product.id} className="px-5 py-4 text-center">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-green-100 hover:bg-green-700"
                    >
                      View Product
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Back to shopping
          </button>
        </div>
      </main>
    </div>
  );
}
