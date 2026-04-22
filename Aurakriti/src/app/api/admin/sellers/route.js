import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';

export async function GET(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const search = searchParams.get('search');
  const verified = searchParams.get('verified');

  const query = { role: 'seller' };
  if (verified !== null && verified !== '') query.isVerified = verified === 'true';
  if (search?.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ name: regex }, { email: regex }];
  }

  const total = await User.countDocuments(query);
  const sellers = await User.find(query)
    .select('-password -resetPasswordToken -resetPasswordExpires')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Enrich with product/order counts
  const sellerIds = sellers.map((s) => s._id);
  const [productCounts, orderRevenue] = await Promise.all([
    Product.aggregate([
      { $match: { seller: { $in: sellerIds } } },
      { $group: { _id: '$seller', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': { $in: sellerIds } } },
      {
        $group: {
          _id: '$items.seller',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const productMap = Object.fromEntries(productCounts.map((p) => [String(p._id), p]));
  const revenueMap = Object.fromEntries(orderRevenue.map((r) => [String(r._id), r]));

  const enriched = sellers.map((s) => ({
    ...s,
    productCount: productMap[String(s._id)]?.count ?? 0,
    activeProductCount: productMap[String(s._id)]?.active ?? 0,
    totalRevenue: revenueMap[String(s._id)]?.revenue ?? 0,
    orderCount: revenueMap[String(s._id)]?.orderCount ?? 0,
  }));

  return NextResponse.json({
    success: true,
    data: {
      sellers: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}
