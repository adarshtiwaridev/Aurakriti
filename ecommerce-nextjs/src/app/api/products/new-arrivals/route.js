import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

/**
 * GET /api/products/new-arrivals
 * Returns products added in the last 24 hours (max 10).
 * Public endpoint – no auth required so the Navbar can call it unconditionally.
 */
export async function GET() {
  try {
    await dbConnect();

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 h ago

    const products = await Product.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id title price category images createdAt')
      .lean();

    const mapped = products.map((p) => ({
      id: String(p._id),
      title: p.title,
      price: p.price,
      category: p.category,
      image: p.images?.[0] ?? null,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    console.error('[new-arrivals] error:', error.message);
    return NextResponse.json({ success: false, count: 0, data: [] });
  }
}
