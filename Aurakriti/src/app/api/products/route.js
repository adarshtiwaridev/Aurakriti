import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { mapProductDocument } from '@/lib/product-utils';
import Product from '@/models/Product';

const productSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().min(10),
  price: z.coerce.number().min(0),
  category: z.enum(PRODUCT_CATEGORIES),
  stock: z.coerce.number().int().min(0),
  images: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 12), 1), 50);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const seller = searchParams.get('seller');
  const mine = searchParams.get('mine') === 'true';
  const featured = searchParams.get('featured') === 'true';
  const includeInactive = searchParams.get('includeInactive') === 'true';

  let currentUser = null;
  if (mine || includeInactive) {
    const auth = await requireAuth(request);
    if (auth.error) {
      return auth.error;
    }
    currentUser = auth.user;
  }

  try {
    await connectDB();

    const query = {};
    if (includeInactive) {
      if (!['seller', 'admin'].includes(currentUser.role)) {
        return NextResponse.json({ success: false, message: 'Only sellers can view private inventory.' }, { status: 403 });
      }

      if (currentUser.role === 'seller') {
        query.seller = currentUser._id;
      } else if (seller) {
        query.seller = seller;
      }
    }

    if (mine) {
      if (!['seller', 'admin'].includes(currentUser.role)) {
        return NextResponse.json({ success: false, message: 'Only sellers can view private inventory.' }, { status: 403 });
      }
      if (currentUser.role === 'seller') {
        query.seller = currentUser._id;
      } else if (seller) {
        query.seller = seller;
      }
    } else if (!includeInactive) {
      query.isActive = true;
    }

    if (seller && !mine) {
      query.seller = seller;
    }

    if (featured) {
      query.isFeatured = true;
    }

    if (category && category !== 'All') {
      query.category = String(category).trim();
    }

    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ title: regex }, { description: regex }, { category: regex }];
    }

    // New filters
    const priceMinParam = searchParams.get('priceMin');
    const priceMaxParam = searchParams.get('priceMax');
    const priceQuery = {};

    if (priceMinParam !== null) {
      const priceMin = Number(priceMinParam);
      if (!Number.isNaN(priceMin)) {
        priceQuery.$gte = priceMin;
      }
    }

    if (priceMaxParam !== null) {
      const priceMax = Number(priceMaxParam);
      if (!Number.isNaN(priceMax)) {
        priceQuery.$lte = priceMax;
      }
    }

    if (Object.keys(priceQuery).length > 0) {
      query.price = priceQuery;
    }

    const ratingGte = Number(searchParams.get('ratingGte') ?? 0);
    if (ratingGte > 0) query.rating = { $gte: ratingGte };

    if (searchParams.get('inStock') === 'true') query.stock = { $gt: 0 };

    // Dynamic sort
    const sortBy = searchParams.get('sortBy') ?? 'newest';
    let dbSort = { createdAt: -1 };
    switch (sortBy) {
      case 'price-low': dbSort = { price: 1 }; break;
      case 'price-high': dbSort = { price: -1 }; break;
      case 'rating': dbSort = { rating: -1 }; break;
      case 'popular': dbSort = { rating: -1, createdAt: -1 }; break;
    }

    const total = await Product.countDocuments(query);
    const skip = Math.max(0, (page - 1) * limit);

    const dbProducts = await Product.find(query)
      .sort(dbSort)
      .skip(skip)
      .limit(limit)
      .lean();

    const categoriesQuery = mine && query.seller
      ? { seller: query.seller }
      : includeInactive
        ? query.seller
          ? { seller: query.seller }
          : {}
        : { isActive: true };

    const categoriesFromDb = await Product.distinct('category', categoriesQuery);

    return NextResponse.json({
      success: true,
      data: {
        products: dbProducts.map((product) => mapProductDocument(product, currentUser)),
        categories: categoriesFromDb.length ? categoriesFromDb.sort() : PRODUCT_CATEGORIES,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        scope: mine ? 'seller' : 'public',
      },
    });
  } catch (error) {
    console.error('GET /api/products failed:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to fetch products right now.' },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  const auth = await requireRole(request, ['seller', 'admin']);
  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Invalid product data.' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      ...parsed.data,
      tags: parsed.data.tags.map((tag) => tag.trim()).filter(Boolean),
      images: parsed.data.images.filter(Boolean),
      seller: auth.user._id,
      isActive: auth.user.role === 'admin' ? parsed.data.isActive ?? true : true,
    });

    const populated = await Product.findById(product._id).populate('seller', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Product created successfully.',
      data: mapProductDocument(populated, auth.user),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to create product.' }, { status: 500 });
  }
}
