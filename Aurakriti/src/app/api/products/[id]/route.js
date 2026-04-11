import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireRole } from '@/lib/api-auth';
import fs from 'fs';
import path from 'path';

const productUpdateSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().min(10).optional(),
  price: z.coerce.number().min(0).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  images: z.array(z.string().url()).optional(),
  isActive: z.boolean().optional(),
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
  isActive: true,
});

export async function GET(request, context) {
  const { id } = await context.params;

  // Read products from JSON file
  const filePath = path.join(process.cwd(), 'src/app/data/products.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);
  const products = jsonData.products || [];

  const product = products.find(p => p.id === id);

  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: mapProduct(product),
  });
}

export async function PATCH(request, context) {
  return NextResponse.json(
    { success: false, message: 'Products are read-only from JSON file.' },
    { status: 403 }
  );
}

export async function DELETE(request, context) {
  return NextResponse.json(
    { success: false, message: 'Products are read-only from JSON file.' },
    { status: 403 }
  );
}
