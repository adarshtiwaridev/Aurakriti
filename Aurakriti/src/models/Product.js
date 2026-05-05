import mongoose from 'mongoose';
import { JEWELLERY_CATEGORIES } from '../constants/categories.js';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Review must be at least 3 characters'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
    },

    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },

    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },

    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      enum: {
        values: JEWELLERY_CATEGORIES,
        message: 'Category must be one of: ' + JEWELLERY_CATEGORIES.join(', ')
      }
    },

    images: {
      type: [String],
      default: [],
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative'],
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// ✅ FIXED: SAFE PRE HOOK (no crash now)
productSchema.pre('validate', function () {
  if (!this.title && this.name) {
    this.title = this.name;
  }

  const reviews = Array.isArray(this.reviews) ? this.reviews : [];
  this.reviewCount = reviews.length;
  this.rating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1))
    : 0;
});


// ✅ Virtual name (clean)
productSchema.virtual('name')
  .get(function () {
    return this.title;
  })
  .set(function (value) {
    this.title = value;
  });


// ✅ Virtual sellerId
productSchema.virtual('sellerId').get(function () {
  return this.seller?.toString();
});


// ✅ TEXT INDEX (for search)
productSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

// ✅ Filter/Sort indexes
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ stock: 1 });
productSchema.index({ category: 1 });



// ✅ Prevent model overwrite in Next.js
const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
