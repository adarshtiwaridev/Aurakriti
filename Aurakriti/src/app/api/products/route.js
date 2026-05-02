import { NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import connectDB from '@/lib/db';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { mapDemoProduct, mapProductDocument } from '@/lib/product-utils';
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

function readDemoProducts() {
  const filePath = path.join(process.cwd(), 'src/app/data/products.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);
  return Array.isArray(jsonData.products) ? jsonData.products : [];
}

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
      query.$or = [{ title: regex }, { description: regex }, { category: regex }, { tags: regex }];
    }

    const total = await Product.countDocuments(query);
    const skip = Math.max(0, (page - 1) * limit);
    const sort = featured ? { rating: -1, createdAt: -1 } : { createdAt: -1 };

    const dbProducts = await Product.find(query)
      .populate('seller', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const categoriesFromDb = await Product.distinct(
      'category',
      mine && query.seller ? { seller: query.seller } : includeInactive ? {} : { isActive: true }
    );

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
  } catch {
    const allProducts = readDemoProducts();
    let products = allProducts.map(mapDemoProduct);

    if (featured) {
      products = products.filter((product) => product.isFeatured);
    }
    if (category && category !== 'All') {
      products = products.filter((product) => product.category === category);
    }
    if (search?.trim()) {
      const query = search.trim().toLowerCase();
      products = products.filter((product) =>
        [product.name, product.description, product.category].some((value) => String(value || '').toLowerCase().includes(query))
      );
    }
    if (mine) {
      products = [];
    }

    const total = products.length;
    const skip = Math.max(0, (page - 1) * limit);
    const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();

    return NextResponse.json({
      success: true,
      data: {
        products: products.slice(skip, skip + limit),
        categories: categories.length ? categories : PRODUCT_CATEGORIES,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        scope: mine ? 'seller' : 'public',
      },
    });
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
