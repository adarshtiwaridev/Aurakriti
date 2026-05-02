export function mapReview(review, currentUser = null) {
  if (!review) {
    return null;
  }

  const reviewerId = String(review.user?._id ?? review.user ?? '');

  return {
    id: String(review._id),
    userId: reviewerId,
    name: review.name || 'Anonymous',
    rating: Number(review.rating || 0),
    title: review.title || '',
    comment: review.comment || '',
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    isOwner: currentUser ? reviewerId === String(currentUser._id) : false,
  };
}

export function mapProductDocument(product, currentUser = null) {
  if (!product) {
    return null;
  }

  const reviews = Array.isArray(product.reviews)
    ? product.reviews
        .slice()
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        .map((review) => mapReview(review, currentUser))
    : [];

  return {
    id: String(product._id ?? product.id),
    title: product.title || product.name || 'Untitled Product',
    name: product.title || product.name || 'Untitled Product',
    description: product.description || '',
    price: Number(product.price || 0),
    category: product.category || '',
    images: Array.isArray(product.images) ? product.images : [],
    image: product.images?.[0] ?? product.image ?? '',
    stock: Number(product.stock || 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviewCount ?? reviews.length ?? 0),
    reviews,
    tags: Array.isArray(product.tags) ? product.tags : [],
    sellerId: product.seller?._id ? String(product.seller._id) : product.seller ? String(product.seller) : null,
    seller: product.seller?._id
      ? {
          id: String(product.seller._id),
          name: product.seller.name,
          email: product.seller.email,
        }
      : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    isFeatured: Boolean(product.isFeatured),
    isActive: product.isActive !== false,
    isDemo: Boolean(product.isDemo),
  };
}

export function mapDemoProduct(product) {
  return {
    id: String(product.id),
    title: product.name,
    name: product.name,
    description: product.description,
    price: Number(product.price || 0),
    category: product.category,
    images: Array.isArray(product.images) ? product.images : [],
    image: product.images?.[0] ?? '',
    stock: Number(product.stock || 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviewCount || product.reviews || 0),
    reviews: [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    sellerId: null,
    seller: null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt || product.createdAt,
    isFeatured: Boolean(product.isFeatured),
    isActive: true,
    isDemo: true,
  };
}
