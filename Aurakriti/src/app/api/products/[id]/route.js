import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireRole } from '@/lib/api-auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
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
  isActive: Boolean(product.isActive),
  isDemo: false,
});

export async function GET(request, context) {
  const { id } = await context.params;

  try {
    await connectDB();

    if (mongoose.Types.ObjectId.isValid(id)) {
      const dbProduct = await Product.findById(id).lean();
      if (dbProduct && dbProduct.isActive) {
        return NextResponse.json({
          success: true,
          data: mapDbProduct(dbProduct),
        });
      }
    }
  } catch {
    // fall back to JSON below
  }

  // Read products from JSON file
  const filePath = path.join(process.cwd(), 'src/app/data/products.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);
  const products = jsonData.products || [];

  const product = products.find(p => p.id === id);

  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }

  // Legacy/demo id fallback: map JSON item to a real DB product when possible.
  try {
    await connectDB();
    const mapped = await Product.findOne({
      title: product.name,
      category: product.category,
      price: Number(product.price),
      isActive: true,
    }).lean();

    if (mapped) {
      return NextResponse.json({
        success: true,
        data: mapDbProduct(mapped),
      });
    }
  } catch {
    // continue with demo payload below
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
