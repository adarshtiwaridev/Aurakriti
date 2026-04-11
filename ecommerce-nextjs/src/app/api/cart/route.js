import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import User from '@/models/User';

void User;

const buildCartPayload = (cart) => {
  const items = (cart?.items ?? []).map((item) => {
    const product = item.product;

    return {
      id: String(item._id),
      productId: String(product?._id),
      title: product?.title ?? 'Product',
      price: product?.price ?? 0,
      image: product?.images?.[0] ?? '',
      category: product?.category ?? '',
      stock: product?.stock ?? 0,
      quantity: item.quantity,
      sellerId: product?.seller?._id ? String(product.seller._id) : String(product?.seller ?? ''),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal > 1000 ? 0 : subtotal > 0 ? 50 : 0;

  return {
    items,
    totals: {
      subtotal,
      shippingCost,
      total: subtotal + shippingCost,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    },
  };
};

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    populate: { path: 'seller', select: 'name email role' },
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      populate: { path: 'seller', select: 'name email role' },
    });
  }

  return cart;
}

export async function GET(request) {
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();
  const cart = await getOrCreateCart(auth.user._id);

  return NextResponse.json({
    success: true,
    data: buildCartPayload(cart),
  });
}

export async function POST(request) {
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const body = await request.json();
  const { productId, quantity = 1 } = body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return NextResponse.json({ success: false, message: 'Valid productId is required.' }, { status: 400 });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }

  if (product.seller.toString() === auth.user._id.toString()) {
    return NextResponse.json(
      { success: false, message: 'Sellers cannot buy their own products.' },
      { status: 400 }
    );
  }

  const normalizedQuantity = Math.max(1, Number(quantity) || 1);
  const cart = await getOrCreateCart(auth.user._id);
  const existingItem = cart.items.find((item) => item.product?._id?.toString() === productId);

  if (existingItem) {
    existingItem.quantity = Math.min(existingItem.quantity + normalizedQuantity, product.stock || normalizedQuantity);
  } else {
    cart.items.push({ product: product._id, quantity: Math.min(normalizedQuantity, product.stock || normalizedQuantity) });
  }

  await cart.save();

  const populatedCart = await getOrCreateCart(auth.user._id);
  return NextResponse.json({
    success: true,
    message: 'Product added to cart.',
    data: buildCartPayload(populatedCart),
  });
}

export async function PATCH(request) {
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const body = await request.json();
  const { id, quantity } = body;

  if (!id) {
    return NextResponse.json({ success: false, message: 'Cart item id is required.' }, { status: 400 });
  }

  const cart = await Cart.findOne({ user: auth.user._id });
  if (!cart) {
    return NextResponse.json({ success: false, message: 'Cart not found.' }, { status: 404 });
  }

  const item = cart.items.id(id);
  if (!item) {
    return NextResponse.json({ success: false, message: 'Cart item not found.' }, { status: 404 });
  }

  const normalizedQuantity = Math.max(1, Number(quantity) || 1);
  item.quantity = normalizedQuantity;
  await cart.save();

  const populatedCart = await getOrCreateCart(auth.user._id);
  return NextResponse.json({
    success: true,
    message: 'Cart updated.',
    data: buildCartPayload(populatedCart),
  });
}

export async function DELETE(request) {
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const body = await request.json();
  const { id, clearAll = false } = body;

  const cart = await Cart.findOne({ user: auth.user._id });
  if (!cart) {
    return NextResponse.json({ success: false, message: 'Cart not found.' }, { status: 404 });
  }

  if (clearAll) {
    cart.items = [];
  } else {
    cart.items = cart.items.filter((item) => item._id.toString() !== id);
  }

  await cart.save();

  const populatedCart = await getOrCreateCart(auth.user._id);
  return NextResponse.json({
    success: true,
    message: 'Cart updated.',
    data: buildCartPayload(populatedCart),
  });
}
