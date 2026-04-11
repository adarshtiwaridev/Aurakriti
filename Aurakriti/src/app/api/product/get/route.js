import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';

// Ensure User model is registered for Product.seller populate().
void User;

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const seller = searchParams.get('seller');

    let query = { isActive: true };

    // Add filters
    if (category && category !== 'all' && category !== 'undefined') {
      query.category = category;
    }

    if (seller) {
      query.seller = seller;
    }

    // Handle search query
    if (search && search.trim() !== '' && search !== 'undefined') {
      try {
        query.$text = { $search: search };
      } catch (searchErr) {
        console.warn('Text search failed, falling back to regex:', searchErr.message);
        // Fallback to regex search if text search fails
        query.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      }
    }

    const skip = (page - 1) * limit;

    let products = [];
    let total = 0;

    try {
      products = await Product.find(query)
        .populate('seller', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      total = await Product.countDocuments(query);
    } catch (QueryErr) {
      console.error('Product query error:', QueryErr.message);
      // Fallback: try without text search to at least get products
      const fallbackQuery = { isActive: true };
      if (category && category !== 'all' && category !== 'undefined') {
        fallbackQuery.category = category;
      }
      if (seller) {
        fallbackQuery.seller = seller;
      }
      
      try {
        products = await Product.find(fallbackQuery)
          .populate('seller', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        total = await Product.countDocuments(fallbackQuery);
      } catch (fallbackErr) {
        console.error('Fallback product query failed:', fallbackErr.message);
        // Return empty results instead of crashing
        products = [];
        total = 0;
      }
    }

    return NextResponse.json({
      products: products || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', products: [], pagination: { page: 1, limit: 12, total: 0, pages: 1 } },
      { status: 500 }
    );
  }
}