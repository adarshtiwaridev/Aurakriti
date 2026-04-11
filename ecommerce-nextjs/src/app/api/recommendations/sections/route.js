import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import User from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

function mapProduct(product) {
  return {
    id: String(product._id),
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    rating: product.rating ?? 0,
    image: product.images?.[0] ?? '',
    stock: product.stock,
  };
}

async function getOptionalUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  return User.findById(payload.userId).select('_id role').lean();
}

async function buildPersonalizedRecommendations(userId) {
  const [orders, cart] = await Promise.all([
    Order.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean(),
    Cart.findOne({ user: userId }).populate('items.product').lean(),
  ]);

  const preferredCategories = new Set();
  const recentProductIds = [];

  for (const order of orders) {
    for (const item of order.items || []) {
      if (item.category) {
        preferredCategories.add(item.category);
      }
      if (item.product) {
        recentProductIds.push(String(item.product));
      }
    }
  }

  for (const item of cart?.items || []) {
    if (item.product?.category) {
      preferredCategories.add(item.product.category);
    }
    if (item.product?._id) {
      recentProductIds.push(String(item.product._id));
    }
  }

  const categories = Array.from(preferredCategories).slice(0, 4);
  const excludeIds = [...new Set(recentProductIds)].slice(0, 60);

  if (!categories.length) {
    return [];
  }

  const recommendations = await Product.find({
    isActive: true,
    stock: { $gt: 0 },
    category: { $in: categories },
    ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
  })
    .sort({ rating: -1, createdAt: -1 })
    .limit(12)
    .lean();

  return recommendations.map(mapProduct);
}

async function buildTrendingRecommendations() {
  const latestOrders = await Order.find({ status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const productFrequency = new Map();

  for (const order of latestOrders) {
    for (const item of order.items || []) {
      const key = String(item.product);
      productFrequency.set(key, (productFrequency.get(key) || 0) + Number(item.quantity || 1));
    }
  }

  const sortedProductIds = Array.from(productFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, 24);

  let products = [];
  if (sortedProductIds.length) {
    products = await Product.find({ _id: { $in: sortedProductIds }, isActive: true, stock: { $gt: 0 } }).lean();
    const orderMap = new Map(sortedProductIds.map((id, index) => [id, index]));
    products.sort((a, b) => (orderMap.get(String(a._id)) ?? 999) - (orderMap.get(String(b._id)) ?? 999));
  }

  if (!products.length) {
    products = await Product.find({ isActive: true, stock: { $gt: 0 } })
      .sort({ rating: -1, createdAt: -1 })
      .limit(8)
      .lean();
  }

  return products.slice(0, 8).map(mapProduct);
}

async function buildSimilarProducts({ personalized = [], trending = [], userId = null, viewedCategories = [] } = {}) {
  const excludeIds = new Set([
    ...personalized.map((p) => String(p.id)),
    ...trending.map((p) => String(p.id)),
  ]);

  let targetCategories = [];

  if (userId) {
    const recentOrders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(8).lean();
    const categoryCounts = new Map();

    for (const order of recentOrders) {
      for (const item of order.items || []) {
        if (!item.category) continue;
        categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + Number(item.quantity || 1));
      }
    }

    targetCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category)
      .slice(0, 3);
  }

  if (!targetCategories.length && trending.length) {
    targetCategories = [...new Set(trending.map((p) => p.category).filter(Boolean))].slice(0, 3);
  }

  if (viewedCategories.length) {
    targetCategories = [...new Set([...viewedCategories, ...targetCategories])].slice(0, 4);
  }

  if (!targetCategories.length) {
    return [];
  }

  const similar = await Product.find({
    isActive: true,
    stock: { $gt: 0 },
    category: { $in: targetCategories },
    ...(excludeIds.size ? { _id: { $nin: Array.from(excludeIds) } } : {}),
  })
    .sort({ rating: -1, createdAt: -1 })
    .limit(8)
    .lean();

  return similar.map(mapProduct);
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const viewedCategories = (searchParams.get('viewedCategories') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 4);

    const user = await getOptionalUser(request);
    const personalized = user?.role === 'user' ? await buildPersonalizedRecommendations(user._id) : [];
    const trending = await buildTrendingRecommendations();
    const similar = await buildSimilarProducts({
      personalized,
      trending,
      userId: user?.role === 'user' ? user._id : null,
      viewedCategories,
    });

    return NextResponse.json({
      success: true,
      data: {
        youMayLike: personalized.slice(0, 8),
        trendingNow: trending,
        similarProducts: similar,
      },
    });
  } catch (error) {
    console.error('GET /api/recommendations/sections failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to load recommendation sections.' }, { status: 500 });
  }
}
