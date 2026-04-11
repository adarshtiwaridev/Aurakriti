import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';

const CATEGORY_ICONS = {
  choker: 'gem',
  necklace: 'sparkles',
  mangalsutra: 'heart',
  watch: 'clock',
};

export async function GET() {
  try {
    await connectDB();

    const dbCategories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
      { $sort: { count: -1, name: 1 } },
    ]);

    const present = new Set(dbCategories.map((c) => c.name));
    const fallback = PRODUCT_CATEGORIES.filter((name) => !present.has(name)).map((name) => ({ name, count: 0 }));

    const categories = [...dbCategories, ...fallback].map((c) => ({
      name: c.name,
      count: c.count,
      icon: CATEGORY_ICONS[c.name] || 'tag',
      slug: encodeURIComponent(c.name.toLowerCase().replace(/\s+/g, '-')),
    }));

    return NextResponse.json({ success: true, data: { categories } });
  } catch (error) {
    console.error('GET /api/category failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch categories.' }, { status: 500 });
  }
}
