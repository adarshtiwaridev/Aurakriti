import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { mapProductDocument } from '@/lib/product-utils';
import Product from '@/models/Product';

export const runtime = 'nodejs';

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

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return undefined;
}

function parseStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => typeof entry === 'string')
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      return trimmed
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [];
}

async function uploadProductFiles(formData) {
  const incomingFiles = formData.getAll('images').filter((entry) => entry instanceof File && entry.size > 0);
  const uploadedImages = [];

  for (const file of incomingFiles) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBufferToCloudinary(buffer, {
      folder: 'eco-commerce/products',
      public_id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });

    uploadedImages.push(result.secure_url);
  }

  return uploadedImages;
}

async function parseProductUpdatePayload(request) {
  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    return request.json();
  }

  const formData = await request.formData();
  const payload = {
    title: formData.get('title') ?? undefined,
    description: formData.get('description') ?? undefined,
    price: formData.get('price') ?? undefined,
    category: formData.get('category') ?? undefined,
    stock: formData.get('stock') ?? undefined,
  };

  if (formData.has('tags')) {
    payload.tags = parseStringArray(formData.getAll('tags'));
  }

  if (formData.has('images') || formData.has('existingImages')) {
    payload.images = [
      ...parseStringArray(formData.getAll('existingImages')),
      ...parseStringArray(formData.getAll('images')),
      ...(await uploadProductFiles(formData)),
    ];
  }

  const isActive = parseBoolean(formData.get('isActive'));
  const isFeatured = parseBoolean(formData.get('isFeatured'));

  if (typeof isActive === 'boolean') {
    payload.isActive = isActive;
  }

  if (typeof isFeatured === 'boolean') {
    payload.isFeatured = isFeatured;
  }

  return payload;
}

export async function GET(request, context) {
  const { id } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
  }

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

    const query = { _id: id };
    if (!(currentUser && ['seller', 'admin'].includes(currentUser.role))) {
      query.isActive = true;
    }

    const dbProduct = await Product.findOne(query)
      .populate('seller', 'name email')
      .populate('reviews.user', 'name')
      .lean();

    if (!dbProduct) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: mapProductDocument(dbProduct, currentUser),
    });
  } catch (error) {
    console.error('GET /api/products/[id] failed:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to fetch product right now.' },
      { status: 500 }
    );
  }
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
    const body = await parseProductUpdatePayload(request);
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
