import mongoose from 'mongoose';

const paymentSessionItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const paymentSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shippingAddress: {
      name: String,
      email: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      contact: String,
    },
    items: {
      type: [paymentSessionItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    verificationMode: {
      type: String,
      enum: ['live', 'test', 'mock'],
      default: 'test',
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'expired'],
      default: 'created',
      index: true,
    },
    paymentAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentFailureReason: {
      type: String,
      default: '',
    },
    paymentId: {
      type: String,
      default: '',
    },
    signature: {
      type: String,
      default: '',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const PaymentSession = mongoose.models.PaymentSession || mongoose.model('PaymentSession', paymentSessionSchema);

export default PaymentSession;