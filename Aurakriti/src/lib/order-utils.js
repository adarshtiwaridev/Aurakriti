import Cart from '@/models/Cart';
import Order from '@/models/Order';
import Product from '@/models/Product';

export const SHIPPING_THRESHOLD = 1000;
export const STANDARD_SHIPPING = 50;

export const mapOrder = (order, currentUser) => {
  const items = (order.items ?? [])
    .filter((item) => {
      if (currentUser?.role !== 'seller') {
        return true;
      }
      return item.seller.toString() === currentUser._id.toString();
    })
    .map((item) => ({
      id: String(item._id),
      productId: String(item.product),
      sellerId: String(item.seller),
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      category: item.category,
      status: item.status,
    }));

  return {
    id: String(order._id),
    orderId: String(order._id),
    userId: String(order.user?._id ?? order.user),
    user: order.user?._id
      ? {
          id: String(order.user._id),
          name: order.user.name,
          email: order.user.email,
        }
      : null,
    items,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    trackingDetails: order.trackingDetails ?? {},
    statusTimeline: order.statusTimeline ?? {},
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paymentDetails: order.paymentDetails,
    invoiceUrl: order.invoice?.url || '',
    invoice: order.invoice || null,
  };
};

export async function loadCartForOrder(userId) {
  return Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    populate: { path: 'seller', select: 'name email role' },
  });
}

export async function buildOrderDataFromCart({ userId, shippingAddress = {} }) {
  const cart = await loadCartForOrder(userId);

  if (!cart || cart.items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      throw new Error('One of the products is no longer available.');
    }

    if (item.quantity > product.stock) {
      throw new Error(`${product.title} has only ${product.stock} item(s) left in stock.`);
    }

    subtotal += product.price * item.quantity;
    orderItems.push({
      product: product._id,
      seller: product.seller._id ?? product.seller,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.images?.[0] ?? '',
      category: product.category,
      status: 'pending',
    });
  }

  const shippingFee = subtotal > SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const totalAmount = subtotal + shippingFee;

  return {
    items: orderItems,
    shippingAddress,
    amounts: {
      subtotal,
      shippingFee,
      totalAmount,
    },
  };
}

export async function createOrderFromData({ userId, items, shippingAddress = {}, amounts, method = 'online', paymentDetails = {} }) {
  const isCOD = method === 'cod';

  const order = await Order.create({
    user: userId,
    items,
    shippingAddress,
    subtotal: amounts.subtotal,
    shippingFee: amounts.shippingFee,
    totalAmount: amounts.totalAmount,
    paymentStatus: 'created',
    paymentProvider: isCOD ? 'cod' : 'razorpay',
    paymentDetails: {
      mode: isCOD ? 'cod' : 'test',
      ...paymentDetails,
    },
  });

  return { order, amounts };
}

export async function createOrderFromCart({ userId, shippingAddress = {}, method = 'online' }) {
  const cartOrderData = await buildOrderDataFromCart({ userId, shippingAddress });
  const isCOD = method === 'cod';

  return createOrderFromData({
    userId,
    items: cartOrderData.items,
    shippingAddress: cartOrderData.shippingAddress,
    amounts: cartOrderData.amounts,
    method,
    paymentDetails: {
      mode: isCOD ? 'cod' : 'test',
    },
  });
}

export async function finalizeOrderPayment({ order, payment = {}, verificationMode = 'test', isCOD = false }) {
  if (order.paymentStatus === 'paid') {
    return Order.findById(order._id).populate('user', 'name email role');
  }

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      throw new Error(`Product ${item.title} is no longer available.`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`${item.title} has insufficient stock for this order.`);
    }

    product.stock -= item.quantity;
    await product.save();
  }

  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.items.forEach((item) => {
    item.status = 'confirmed';
  });
  order.statusTimeline = {
    ...(order.statusTimeline || {}),
    confirmedAt: order.statusTimeline?.confirmedAt || new Date(),
  };
  order.paymentDetails = {
    ...order.paymentDetails,
    ...(isCOD
      ? { mode: 'cod' }
      : {
          razorpayOrderId: payment.razorpay_order_id ?? order.paymentDetails?.razorpayOrderId,
          razorpayPaymentId: payment.razorpay_payment_id ?? order.paymentDetails?.razorpayPaymentId ?? '',
          razorpaySignature: payment.razorpay_signature ?? order.paymentDetails?.razorpaySignature ?? '',
          mode: verificationMode,
        }),
  };

  await order.save();
  await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } });

  return Order.findById(order._id).populate('user', 'name email role');
}
