import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import connectDB from '@/lib/db';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireRole } from '@/lib/api-auth';
import Product from '@/models/Product';
import User from '@/models/User';

void User;

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
});

async function findOwnedProduct(id, user) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const product = await Product.findById(id).populate('seller', 'name email role');
  if (!product) {
    return null;
  }

  if (user.role !== 'admin' && product.seller._id.toString() !== user._id.toString()) {
    return 'forbidden';
  }

  return product;
}

export async function GET(request, context) {
  const { id } = await context.params;
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product id.' }, { status: 400 });
  }

  const product = await Product.findById(id).populate('seller', 'name email role');

  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...mapProduct(product),
      isActive: product.isActive,
    },
  });
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  const auth = await requireRole(request, ['seller', 'admin']);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const product = await findOwnedProduct(id, auth.user);
  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }
  if (product === 'forbidden') {
    return NextResponse.json({ success: false, message: 'You cannot edit this product.' }, { status: 403 });
  }

  const parsed = productUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Invalid product data.', errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  Object.assign(product, parsed.data);
  await product.save();

  return NextResponse.json({
    success: true,
    message: 'Product updated successfully.',
    data: mapProduct(product),
  });
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  const auth = await requireRole(request, ['seller', 'admin']);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const product = await findOwnedProduct(id, auth.user);
  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }
  if (product === 'forbidden') {
    return NextResponse.json({ success: false, message: 'You cannot delete this product.' }, { status: 403 });
  }

  product.isActive = false;
  await product.save();

  return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
}
