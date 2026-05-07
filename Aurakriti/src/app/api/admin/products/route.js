import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Product from '@/models/Product';

export async function GET(request) {
  const auth = await requireRole(request, ['admin']);

  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== null && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    if (search && search.trim()) {
      const regex = {
        $regex: search.trim(),
        $options: 'i',
      };
      query.$or = [{ title: regex }, { description: regex }];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  const auth = await requireRole(request, ['seller', 'admin']);

  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  try {
    const body = await request.json();
    const { title, description, price, category, images, isActive = true } = body;

    if (!title || !price || !category) {
      return NextResponse.json(
        { success: false, message: 'Title, price, and category are required.' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      title,
      description,
      price,
      category,
      images,
      isActive,
      seller: auth.user._id,
    });

    return NextResponse.json(
      { success: true, data: { product } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const auth = await requireRole(request, ['admin']);

  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  try {
    const body = await request.json();
    const { productId, isActive, title, description, price, category } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'productId is required.' },
        { status: 400 }
      );
    }

    const update = {};
    if (typeof isActive === 'boolean') update.isActive = isActive;
    if (title) update.title = title;
    if (description) update.description = description;
    if (price) update.price = price;
    if (category) update.category = category;

    if (!Object.keys(update).length) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update.' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndUpdate(productId, update, {
      new: true,
    }).populate('seller', 'name email');

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { product } });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const auth = await requireRole(request, ['admin']);

  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'productId is required.' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}