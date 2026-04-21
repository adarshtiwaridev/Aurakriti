import mongoose from 'mongoose';

const carouselSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    offerLabel: {
      type: String,
      trim: true,
      default: '',
    },
    offerPrice: {
      type: Number,
      default: null,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    productLink: {
      type: String,
      trim: true,
      default: '',
    },
    ctaText: {
      type: String,
      trim: true,
      default: 'Shop Now',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

carouselSchema.index({ isActive: 1, order: 1 });

const Carousel = mongoose.models.Carousel || mongoose.model('Carousel', carouselSchema);
export default Carousel;
