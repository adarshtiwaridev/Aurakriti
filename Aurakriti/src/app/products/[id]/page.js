import ProductClient from './ProductClient';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BadgeCheck, MessageSquare, Pencil, ShoppingBag, Star, Trash2, Truck } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { getProduct, getProducts } from '@/services/productService';
import { addToCart as addToCartRequest } from '@/services/cartService';
import { createReview, deleteReview, getProduct, updateReview } from '@/services/productService';

const EMPTY_REVIEW = { rating: 5, title: '', comment: '' };

function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function RatingStars({ rating, editable = false, onChange = null }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type={editable ? 'button' : undefined}
          onClick={editable && onChange ? () => onChange(value) : undefined}
          className={editable ? 'transition hover:scale-110' : 'cursor-default'}
        >
          <Star
            className={`h-4 w-4 ${value <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="skeleton h-[28rem] rounded-[2rem]" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-10 w-3/4" />
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-14 w-full rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-[2rem]" />
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user, initialized } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const productId = params?.id;

  useEffect(() => {
    if (!productId) {
      setPageError('No product selected.');
      setLoading(false);
      return;
    }

    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError('');

        const data = await getProduct(productId);

        if (!active) return;

        setProduct(data);
        setActiveImage(0);

        const related = await getProducts();

        const productsArray = Array.isArray(related)
          ? related
          : related.products || [];

        const currentCategory = data.category || data.categories?.[0] ||  '';

        const filteredProducts = productsArray.filter(
          (item) => (item.id || item._id) !== (data.id || data._id));

        const sameCategoryProducts = filteredProducts.filter((item) => {
          const itemCategory = item.category || item.categories?.[0] || '';

          return (
            itemCategory.trim().toLowerCase() === currentCategory.trim().toLowerCase());
        });
        const finalProducts = sameCategoryProducts.length > 0 ? sameCategoryProducts : filteredProducts;

        setRelatedProducts(finalProducts.slice(0, 4));

      } catch (err) {
        console.error('[ProductDetails] Fetch error:', err.message);

        if (active) {
          setError(err.message || 'Failed to load product');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => () => window.clearTimeout(bannerTimerRef.current), []);

  const images = useMemo(() => {
    if (product?.images?.length) {
      return product.images;
    }
    return product?.image ? [product.image] : [];
  }, [product]);

  const myReview = useMemo(
    () => (product?.reviews || []).find((review) => review.isOwner),
    [product?.reviews]
  );

  const showBanner = (message) => {
    setActionMessage(message);
    window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setActionMessage(''), 2500);
  };

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    if (!initialized) {
      setPageError('Please wait while we verify your account.');
      return;
    }

    if (isAuthenticated && user?.role !== 'user') {
      setPageError('Seller and admin accounts cannot place buyer orders.');
      return;
    }

    try {
      setAdding(true);
      setPageError('');

      if (!isAuthenticated || product.isDemo) {
        dispatch(
          addToCart({
            id: product.id,
            productId: product.id,
            title: product.title,
            price: Number(product.price || 0),
            image: product.images?.[0] || product.image || '',
            category: product.category || '',
            quantity: 1,
          })
        );
      } else {
        const cart = await addToCartRequest(product.id, 1);
        dispatch(setCart(cart.items ?? []));
      }

      showBanner('Product added to cart.');
    } catch (error) {
      setPageError(error.message || 'Failed to add product to cart.');
    } finally {
      setAdding(false);
    }
  };

  const startEditing = (review) => {
    setEditingReviewId(review.id);
    setReviewForm({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment || '',
    });
  };

  const resetReviewForm = () => {
    setEditingReviewId('');
    setReviewForm(EMPTY_REVIEW);
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/products/${productId}`);
      return;
    }

    try {
      setReviewLoading(true);
      setPageError('');

      const response = editingReviewId
        ? await updateReview(productId, editingReviewId, reviewForm)
        : await createReview(productId, reviewForm);

      setProduct(response.product);
      resetReviewForm();
      showBanner(editingReviewId ? 'Review updated.' : 'Review added.');
    } catch (error) {
      setPageError(error.message || 'Unable to save review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      setReviewLoading(true);
      setPageError('');
      const response = await deleteReview(productId, reviewId);
      setProduct(response.product);
      resetReviewForm();
      showBanner('Review deleted.');
    } catch (error) {
      setPageError(error.message || 'Unable to delete review.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f6f8fb_100%)]">
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <ProductDetailSkeleton />
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f6f8fb_100%)]">
        <main className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-rose-100 bg-white p-10 shadow-sm">
            <h1 className="text-3xl font-semibold text-stone-900">Product not found</h1>
            <p className="mt-3 text-sm text-stone-500">{pageError || 'This item is unavailable right now.'}</p>
            <Link href="/shop" className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white">
              Back to shop
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayImage = images[activeImage] || 'https://placehold.co/900x900?text=Product';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f6f8fb_100%)] text-stone-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/shop" className="text-sm font-semibold text-stone-500 transition hover:text-stone-900">
            Back to shop
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            <BadgeCheck className="h-4 w-4" />
            Trusted product listing
          </div>
        </div>

        {actionMessage ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {actionMessage}
          </div>
        ) : null}

        {pageError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {pageError}
          </div>
        ) : null}

        <section className="grid gap-8 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_24px_70px_-48px_rgba(24,24,27,0.32)] lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-4">
            <div className="relative h-[24rem] overflow-hidden rounded-[1.8rem] bg-stone-100 sm:h-[30rem]">
              <Image src={displayImage} alt={product.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {(images.length ? images : [displayImage]).slice(0, 4).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative h-24 overflow-hidden rounded-2xl border transition ${activeImage === index ? 'border-stone-900 shadow-sm' : 'border-stone-200 hover:border-stone-400'}`}
                >
                  <Image src={image} alt={`${product.title} ${index + 1}`} fill className="object-cover" sizes="160px" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">{product.category}</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl">{product.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="text-3xl font-semibold text-stone-950">{formatPrice(product.price)}</span>
                <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm text-stone-700">
                  <RatingStars rating={product.rating} />
                  <span className="font-semibold">{product.rating?.toFixed?.(1) ?? Number(product.rating || 0).toFixed(1)}</span>
                  <span className="text-stone-400">({product.reviewCount || 0})</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Stock</p>
                <p className={`mt-2 text-sm font-semibold ${product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Delivery</p>
                <p className="mt-2 text-sm font-semibold text-stone-800">Fast dispatch</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Seller</p>
                <p className="mt-2 text-sm font-semibold text-stone-800">{product.seller?.name || 'Aurakriti'}</p>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-stone-200 bg-[linear-gradient(135deg,#fff8eb_0%,#ffffff_100%)] p-5">
              <h2 className="text-lg font-semibold text-stone-900">About this item</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{product.description}</p>
              {product.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stock <= 0}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                <ShoppingBag className="h-4 w-4" />
                {adding ? 'Adding...' : 'Add to cart'}
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('eco:open-chatbot', { detail: { query: product.title } }))}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                <MessageSquare className="h-4 w-4" />
                Ask AI about this product
              </button>
            </div>

            <div className="rounded-[1.6rem] border border-stone-200 bg-stone-50 p-5">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="font-semibold text-stone-900">Checkout confidence</h3>
                  <p className="text-sm text-stone-500">Supports COD and Razorpay checkout with full order tracking.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Ratings</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-950">Customer reviews</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold text-stone-950">{Number(product.rating || 0).toFixed(1)}</p>
                <p className="text-sm text-stone-500">{product.reviewCount || 0} review(s)</p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4 rounded-[1.6rem] border border-stone-200 bg-stone-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-stone-900">{editingReviewId ? 'Edit your review' : 'Write a review'}</h3>
                  <p className="text-sm text-stone-500">Share quality, fit, finish, and delivery experience.</p>
                </div>
                <RatingStars editable rating={reviewForm.rating} onChange={(rating) => setReviewForm((prev) => ({ ...prev, rating }))} />
              </div>

              <input
                value={reviewForm.title}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Review title"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-400"
              />
              <textarea
                value={reviewForm.comment}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                placeholder={isAuthenticated ? 'Tell future buyers what stood out.' : 'Log in to leave a review.'}
                rows={5}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-400"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={reviewLoading || (!editingReviewId && Boolean(myReview))}
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:bg-stone-300"
                >
                  {reviewLoading ? 'Saving...' : editingReviewId ? 'Update review' : myReview ? 'Add another review not allowed' : 'Submit review'}
                </button>
                {editingReviewId ? (
                  <button
                    type="button"
                    onClick={resetReviewForm}
                    className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              {myReview && !editingReviewId ? (
                <p className="text-xs text-stone-500">You already reviewed this product. Edit your existing review below.</p>
              ) : null}
            </form>
          </article>

          <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">All reviews</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-950">What buyers are saying</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {(product.reviews || []).length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                  <p className="font-semibold text-stone-900">No reviews yet</p>
                  <p className="mt-2 text-sm text-stone-500">Be the first buyer to share feedback on this product.</p>
                </div>
              ) : (
                product.reviews.map((review) => (
                  <div key={review.id} className="rounded-[1.6rem] border border-stone-200 bg-stone-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-900">{review.name}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <RatingStars rating={review.rating} />
                          <span className="text-xs text-stone-500">
                            {new Date(review.updatedAt || review.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                      {review.isOwner ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(review)}
                            className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewDelete(review.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {review.title ? <p className="mt-3 text-sm font-semibold text-stone-900">{review.title}</p> : null}
                    <p className="mt-2 text-sm leading-7 text-stone-600">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {!loading && relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-600">
                  Styling Picks
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  ✨ Complete the Look
                </h2>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => {
                const image =
                  item.images?.[0] ||
                  item.image ||
                  'https://placehold.co/600x600?text=Jewellery';

                return (
                  <Link
                    key={item.id || item._id}
                    href={`/products/${item.id || item._id}`}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image
                        src={image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                        {item.category || item.categories?.[0]}
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-900">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-base font-black text-emerald-700">
                        ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      </p>

                      <button className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                        View Details
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
export async function generateMetadata({ params }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aurakriti.vercel.app';
    const response = await fetch(`${baseUrl}/api/products/${params.id}`, {
      cache: 'no-store',
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error('Product not found');
    }

    const product = await response.json();
    const description = product.description
      ? product.description.substring(0, 160)
      : 'Premium jewellery product';

    return {
      title: `${product.title} | Aurakriti`,
      description: description,
      keywords: [product.category, 'jewellery', product.title],
      openGraph: {
        title: `${product.title} | Aurakriti`,
        description: description,
        images: product.images && product.images.length > 0 
          ? [{ url: product.images[0] }]
          : [{ url: `${baseUrl}/og-image.png` }],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Product | Aurakriti',
      description: 'Premium jewellery product on Aurakriti',
      keywords: ['jewellery', 'product'],
    };
  }
}

export default function ProductDetailsPage() {
  return <ProductClient />;
}
