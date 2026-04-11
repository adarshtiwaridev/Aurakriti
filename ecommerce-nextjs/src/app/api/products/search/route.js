import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

function extractBudget(query) {
  const match = query.match(/(?:under|below|less\s+than|upto|max(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || 8), 12);

    if (!q) {
      return NextResponse.json({ success: true, data: { products: [] } });
    }

    const budget = extractBudget(q);
    const regex = { $regex: q, $options: 'i' };
    const tokens = q.split(/\s+/).filter(Boolean);

    const tokenConditions = tokens.flatMap((token) => {
      const tokenRegex = { $regex: token, $options: 'i' };
      return [{ title: tokenRegex }, { category: tokenRegex }, { description: tokenRegex }, { tags: tokenRegex }];
    });

    const query = {
      isActive: true,
      ...(budget !== null ? { price: { $lte: budget } } : {}),
      $or: [{ title: regex }, { category: regex }, { description: regex }, { tags: regex }, ...tokenConditions],
    };

    const products = await Product.find(query)
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        products: products.map((product) => ({
          id: String(product._id),
          title: product.title,
          category: product.category,
          price: product.price,
          rating: product.rating ?? 0,
          image: product.images?.[0] ?? '',
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/products/search failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to search products.' }, { status: 500 });
  }
}
