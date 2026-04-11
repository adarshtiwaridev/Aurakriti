import mongoose from 'mongoose';
import { JEWELLERY_CATEGORIES } from '../constants/categories.js';

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


// ✅ Prevent model overwrite in Next.js
const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;