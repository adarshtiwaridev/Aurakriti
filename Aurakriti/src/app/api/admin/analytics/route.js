import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';

export async function GET(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalSellers,
    totalProducts,
    activeProducts,
    totalOrders,
    paidOrders,
    revenueAgg,
    recentOrders,
    topProductsAgg,
    topSellersAgg,
    dailyRevenueAgg,
    userGrowthAgg,
    orderStatusAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'seller' }),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: 'paid' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    // Top products by revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          title: { $first: '$items.title' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          unitsSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    // Top sellers by revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.seller',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo',
        },
      },
      {
        $project: {
          revenue: 1,
          orderCount: 1,
          name: { $arrayElemAt: ['$sellerInfo.name', 0] },
          email: { $arrayElemAt: ['$sellerInfo.email', 0] },
        },
      },
    ]),
    // Daily revenue last 30 days
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // User growth last 30 days
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Order status breakdown
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalUsers,
        totalSellers,
        totalProducts,
        activeProducts,
        totalOrders,
        paidOrders,
        totalRevenue,
        recentOrders,
      },
      topProducts: topProductsAgg,
      topSellers: topSellersAgg,
      dailyRevenue: dailyRevenueAgg,
      userGrowth: userGrowthAgg,
      orderStatusBreakdown: orderStatusAgg,
    },
  });
}
