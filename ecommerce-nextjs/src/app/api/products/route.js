import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireRole } from '@/lib/api-auth';
import Product from '@/models/Product';
import User from '@/models/User';
import { sendNewProductLaunchEmail } from '@/lib/email';
import { notifyUsersForNewProduct } from '@/lib/notifications';

const productSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().min(10),
  price: z.coerce.number().min(0),
  category: z.enum(PRODUCT_CATEGORIES),
  stock: z.coerce.number().int().min(0),
  images: z.array(z.string().min(1)).default([]),
});

const mapProduct = (product) => ({
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
  sellerId: String(product.seller?._id ?? product.seller),
  seller: product.seller?._id
    ? {
        id: String(product.seller._id),
        name: product.seller.name,
        email: product.seller.email,
      }
    : null,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export async function GET(request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Math.min(Number(searchParams.get('limit') ?? 12), 50);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const seller = searchParams.get('seller');
  const mine = searchParams.get('mine') === 'true';

  let query = { isActive: true };
  let authenticatedUser = null;

  if (mine) {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.error) {
      return auth.error;
    }

    authenticatedUser = auth.user;
    query = authenticatedUser.role === 'admin' ? query : { ...query, seller: authenticatedUser._id };
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (seller) {
    query.seller = seller;
  }

  if (search?.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { category: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const skip = Math.max(0, (page - 1) * limit);

  const [products, total, categoriesFromDb] = await Promise.all([
    Product.find(query)
      .populate('seller', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
    Product.distinct('category', { isActive: true }),
  ]);

  const dynamicCategories = (categoriesFromDb || [])
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    success: true,
    data: {
      products: products.map(mapProduct),
      categories: dynamicCategories.length ? dynamicCategories : PRODUCT_CATEGORIES,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      scope: mine ? (authenticatedUser?.role === 'admin' ? 'admin' : 'seller') : 'public',
    },
  });
}

export async function POST(request) {
  const auth = await requireRole(request, ['seller', 'admin']);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Invalid product data.', errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const product = await Product.create({
    ...parsed.data,
    seller: auth.user._id,
  });

  const populatedProduct = await Product.findById(product._id).populate('seller', 'name email role');

  // Fire-and-forget: send launch notification to all active users
  (async () => {
    try {
      const users = await User.find({ isVerified: true, role: 'user' })
        .select('_id email name')
        .limit(2000)
        .lean();
      if (users.length) {
        await Promise.all([
          sendNewProductLaunchEmail(populatedProduct, users),
          notifyUsersForNewProduct(populatedProduct, users),
        ]);
      }
    } catch (error) {
      console.error('[Products] Product launch email dispatch failed:', error.message);
    }
  })();

  return NextResponse.json(
    {
      success: true,
      message: 'Product created successfully.',
      data: mapProduct(populatedProduct),
    },
    { status: 201 }
  );
}
