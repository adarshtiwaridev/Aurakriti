import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireRole } from '@/lib/api-auth';
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
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Math.min(Number(searchParams.get('limit') ?? 12), 50);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const seller = searchParams.get('seller');
  const mine = searchParams.get('mine') === 'true';

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

  // For mine, since no auth in JSON, return empty if requested
  if (mine) {
    products = [];
  }

  // Sort by createdAt desc
  products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
