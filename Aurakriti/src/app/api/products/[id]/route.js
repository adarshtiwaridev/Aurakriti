import { NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { mapDemoProduct, mapProductDocument } from '@/lib/product-utils';
import Product from '@/models/Product';

const productUpdateSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().min(10).optional(),
  price: z.coerce.number().min(0).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  images: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

function readDemoProduct(id) {
  const filePath = path.join(process.cwd(), 'src/app/data/products.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);
  const products = Array.isArray(jsonData.products) ? jsonData.products : [];
  const product = products.find((entry) => entry.id === id);
  return product ? mapDemoProduct(product) : null;
}

export async function GET(request, context) {
  const { id } = await context.params;
  let currentUser = null;

  try {
    const auth = await requireAuth(request);
    if (!auth.error) {
      currentUser = auth.user;
    }
  } catch {
    currentUser = null;
  }

  try {
    await connectDB();

    if (mongoose.Types.ObjectId.isValid(id)) {
      const query = { _id: id };
      if (!(currentUser && ['seller', 'admin'].includes(currentUser.role))) {
        query.isActive = true;
      }

      const dbProduct = await Product.findOne(query).populate('seller', 'name email').populate('reviews.user', 'name').lean();
      if (dbProduct) {
        return NextResponse.json({
          success: true,
          data: mapProductDocument(dbProduct, currentUser),
        });
      }
    }
  } catch {
    // Continue to static fallback
  }

  const product = readDemoProduct(id);
  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: product,
  });
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  const auth = await requireRole(request, ['seller', 'admin']);
  if (auth.error) {
    return auth.error;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product id.' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Invalid product data.' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    if (auth.user.role === 'seller' && product.seller.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, message: 'You can edit only your own products.' }, { status: 403 });
    }

    const updateData = {
      ...parsed.data,
      ...(parsed.data.tags ? { tags: parsed.data.tags.map((tag) => tag.trim()).filter(Boolean) } : {}),
      ...(parsed.data.images ? { images: parsed.data.images.filter(Boolean) } : {}),
    };

    if (auth.user.role === 'seller') {
      delete updateData.isActive;
    }

    Object.assign(product, updateData);

    await product.save();
    const populated = await Product.findById(product._id).populate('seller', 'name email').populate('reviews.user', 'name');

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully.',
      data: mapProductDocument(populated, auth.user),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to update product.' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  const auth = await requireRole(request, ['seller', 'admin']);
  if (auth.error) {
    return auth.error;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product id.' }, { status: 400 });
  }

  try {
    await connectDB();
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    if (auth.user.role === 'seller' && product.seller.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, message: 'You can delete only your own products.' }, { status: 403 });
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully.',
      data: { id },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to delete product.' }, { status: 500 });
  }
}
