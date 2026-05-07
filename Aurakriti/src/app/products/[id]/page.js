'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getProduct, getProducts } from '@/services/productService';
import { addToCart as addToCartRequest } from '@/services/cartService';
import { useDispatch } from 'react-redux';
import { addToCart, setCart } from '@/redux/slices/cartSlice';
import { Camera, Star, BadgeCheck, MessageSquare, Pencil, ShoppingBag, Truck, Trash2 } from 'lucide-react';
import { createReview, deleteReview, updateReview } from '@/services/productService';

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
      <Link href="/products" className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
        Browse Products
      </Link>
    </div>
  );
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const productId = params?.id;
  const [myReview, setMyReview] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW);

  useEffect(() => {
    const loadProduct = async () => {
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
        const data = await getProduct(productId);
        setProduct(data);
        setReviews(data.reviews || []);
        setMyReview(data.reviews?.find(r => r.userId === user?.id));
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, user]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCartRequest(productId, quantity);
      // Update Redux state
      dispatch(addToCart({
        productId,
        quantity,
        price: product.price,
        title: product.title,
        image: product.images?.[0] || product.image
      }));
    } catch (err) {
      console.error('Add to cart error:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);

    try {
      if (editingReviewId) {
        const updated = await updateReview(editingReviewId, reviewForm);
        setReviews(reviews.map(r => r.id === editingReviewId ? updated : r));
        setEditingReviewId(null);
      } else {
        const newReview = await createReview(productId, reviewForm);
        setReviews([...reviews, newReview]);
        setMyReview(newReview);
      }
      setReviewForm(EMPTY_REVIEW);
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
      if (reviewId === myReview?.id) {
        setMyReview(null);
      }
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (error) return <ErrorCard message={error} productId={productId} />;
  if (!product) return null;

  const images = product.images || [product.image];
  const inStock = product.stock > 0;
  const discount = product.discountPrice && product.price > product.discountPrice;

  return (
    <section className="mt-6 grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_1fr]">
      {/* Images */}
      <div>
        <div className="relative h-[28rem] w-full overflow-hidden rounded-3xl bg-slate-100">
          <Image
            src={images[selectedImage]}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Out of Stock</span>
            </div>
          )}
          {discount && (
            <div className="absolute left-4 top-4 rounded-xl bg-red-600 px-3 py-1 text-sm font-semibold text-white">
              {Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`relative h-20 overflow-hidden rounded-xl border-2 transition ${
                selectedImage === idx ? 'border-slate-900' : 'border-transparent'
              }`}
            >
              <Image src={img} alt={`${product.title} ${idx + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{product.title}</h1>
              <p className="mt-1 text-sm text-slate-600">{product.description}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <RatingStars rating={product.rating} />
              <span className="ml-1 text-sm text-slate-600">({product.reviews?.length || 0})</span>
            </div>
            {product.verified && (
              <div className="flex items-center gap-1 text-emerald-600">
                <BadgeCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {formatPrice(discount ? product.discountPrice : product.price)}
              </span>
              {discount && (
                <span className="text-lg text-slate-500 line-through">{formatPrice(product.price)}</span>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Quantity</label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {addingToCart ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </span>
                )}
              </button>
              
              <button
                onClick={() => window.location.href = `/try-on/${productId}`}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Virtual Try-On
              </button>
            </div>
          </div>

          <div className="mt-8 space-y-4 border-t border-slate-200 pt-8">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Truck className="h-4 w-4" />
              <span>Free delivery on orders above ₹999</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <MessageSquare className="h-4 w-4" />
              <span>24/7 customer support</span>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 border-t border-slate-200 pt-8">
          <h3 className="text-lg font-semibold text-slate-900">Customer Reviews</h3>
          
          {/* Review Form */}
          {user && (
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Rating</label>
                <RatingStars
                  rating={reviewForm.rating}
                  editable
                  onChange={(rating) => setReviewForm({ ...reviewForm, rating })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  placeholder="Brief summary of your review"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  rows={3}
                  placeholder="Share your experience with this product"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reviewLoading || (!editingReviewId && Boolean(myReview))}
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:bg-stone-300"
                >
                  {reviewLoading ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                </button>
                {editingReviewId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReviewId(null);
                      setReviewForm(EMPTY_REVIEW);
                    }}
                    className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Reviews List */}
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{review.userName}</span>
                      <RatingStars rating={review.rating} />
                    </div>
                    <h4 className="mt-1 font-medium text-slate-900">{review.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{review.comment}</p>
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
                  {user && review.userId === user.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingReviewId(review.id);
                          setReviewForm({
                            rating: review.rating,
                            title: review.title,
                            comment: review.comment
                          });
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReviewDelete(review.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
