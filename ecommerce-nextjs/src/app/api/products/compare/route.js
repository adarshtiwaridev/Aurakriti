import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';

void User;

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
    ? { id: String(product.seller._id), name: product.seller.name }
    : null,
});

// GET /api/products/compare?ids=id1,id2,id3
export async function GET(request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids') ?? '';
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (ids.length < 1 || ids.length > 4) {
    return NextResponse.json(
      { success: false, message: 'Provide 1–4 product IDs as ?ids=id1,id2' },
      { status: 400 }
    );
  }

  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length !== ids.length) {
    return NextResponse.json(
      { success: false, message: 'One or more IDs are invalid.' },
      { status: 400 }
    );
  }

  const products = await Product.find({
    _id: { $in: validIds },
    isActive: true,
  })
    .populate('seller', 'name email role')
    .lean();

  return NextResponse.json({
    success: true,
    data: {
      products: products.map(mapProduct),
    },
  });
}
