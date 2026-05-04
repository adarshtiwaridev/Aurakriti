import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireRole } from '@/lib/api-auth';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import fs from 'fs';
import path from 'path';

const productSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().min(10),
  price: z.coerce.number().min(0),
  category: z.enum(PRODUCT_CATEGORIES),
  stock: z.coerce.number().int().min(0),
  images: z.array(z.string().min(1)).default([]),
});

const mapProduct = (product) => ({
  id: product.id,
  title: product.name,
  name: product.name,
  description: product.description,
  price: product.price,
  category: product.category,
  images: product.images ?? [],
  image: product.images?.[0] ?? '',
  stock: product.stock,
  rating: product.rating ?? 0,
  tags: [],
  sellerId: null,
  seller: null,
  createdAt: product.createdAt,
  updatedAt: product.createdAt,
  isFeatured: product.isFeatured,
  isDemo: true,
});

const mapDbProduct = (product) => ({
  id: String(product._id),
  title: product.title,
  name: product.title,
  description: product.description,
  price: product.price,
  category: product.category,
  images: product.images ?? [],
  image: product.images?.[0] ?? '',
  stock: product.stock,
  rating: product.rating ?? 0,
  tags: product.tags ?? [],
  sellerId: product.seller ? String(product.seller) : null,
  seller: null,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  isFeatured: Boolean(product.isFeatured),
  isDemo: false,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Math.min(Number(searchParams.get('limit') ?? 12), 50);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const seller = searchParams.get('seller');
  const mine = searchParams.get('mine') === 'true';

  // DB-first products so cart receives valid Mongo product ids.
  try {
    await connectDB();

    const query = {};
    if (mine) {
      const auth = await requireRole(request, ['seller', 'admin']);
      if (auth.error) {
        return auth.error;
      }
      if (auth.user.role === 'seller') {
        query.seller = auth.user._id;
      }
    } else {
      query.isActive = true;
    }

    if (seller) {
      query.seller = seller;
    }

    if (category && category !== 'All') {
      query.category = String(category).toLowerCase();
    }

    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ title: regex }, { description: regex }, { category: regex }];
    }

    // New filters
    const priceMin = Number(searchParams.get('priceMin') ?? 0);
    const priceMax = Number(searchParams.get('priceMax') ?? 999999);
    query.price = { $gte: priceMin, $lte: priceMax };

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


    const categoriesFromDb = await Product.distinct('category', mine && query.seller ? { seller: query.seller } : { isActive: true });

    return NextResponse.json({
      success: true,
      data: {
        products: dbProducts.map(mapDbProduct),
        categories: categoriesFromDb.length ? categoriesFromDb : PRODUCT_CATEGORIES,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        scope: mine ? 'seller' : 'public',
      },
    });
  } catch {
    // Fallback to static JSON data when DB is unavailable.
  }

  // Read products from JSON file
  const filePath = path.join(process.cwd(), 'src/app/data/products.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);
  let products = jsonData.products || [];

  // Apply filters
  if (category && category !== 'All') {
    products = products.filter(p => p.category === category);
  }

  if (search?.trim()) {
    const searchLower = search.trim().toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower)
    );
  }

  // New filters for fallback
  const priceMin = Number(searchParams.get('priceMin') ?? 0);
  const priceMax = Number(searchParams.get('priceMax') ?? 999999);
  products = products.filter(p => p.price >= priceMin && p.price <= priceMax);

  const ratingGte = Number(searchParams.get('ratingGte') ?? 0);
  if (ratingGte > 0) products = products.filter(p => (p.rating || 0) >= ratingGte);

  if (searchParams.get('inStock') === 'true') products = products.filter(p => (p.stock || 0) > 0);

  // For mine, since no auth in JSON, return empty if requested
  if (mine) {
    products = [];
  }

  // Dynamic sort for fallback
  const sortBy = searchParams.get('sortBy') ?? 'newest';
  switch (sortBy) {
    case 'price-low': products.sort((a, b) => a.price - b.price); break;
    case 'price-high': products.sort((a, b) => b.price - a.price); break;
    case 'rating': products.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'popular': products.sort((a, b) => ((b.rating || 0) - (a.rating || 0)) || new Date(b.createdAt) - new Date(a.createdAt)); break;
    default: products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }


  const total = products.length;
  const skip = Math.max(0, (page - 1) * limit);
  const paginatedProducts = products.slice(skip, skip + limit);

  // Get categories from products
  const categoriesFromData = [...new Set(products.map(p => p.category))].sort();

  return NextResponse.json({
    success: true,
    data: {
      products: paginatedProducts.map(mapProduct),
      categories: categoriesFromData.length ? categoriesFromData : PRODUCT_CATEGORIES,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      scope: mine ? 'seller' : 'public',
    },
  });
}

export async function POST(request) {
  return NextResponse.json(
    { success: false, message: 'Products are read-only from JSON file.' },
    { status: 403 }
  );
}
