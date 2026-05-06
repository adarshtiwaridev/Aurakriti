import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { mapProductDocument, mapReview } from '@/lib/product-utils';
import Product from '@/models/Product';

const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  comment: z.string().trim().min(3).max(1000),
});

export async function POST(request, context) {
  const { id } = await context.params;
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product id.' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid review.' }, { status: 400 });
    }

    const product = await Product.findOne({ _id: id, isActive: true }).populate('reviews.user', 'name');
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    const existingReview = product.reviews.find((review) => String(review.user?._id ?? review.user) === String(auth.user._id));
    if (existingReview) {
      return NextResponse.json({ success: false, message: 'You have already reviewed this product.' }, { status: 409 });
    }

    product.reviews.push({
      user: auth.user._id,
      name: auth.user.name,
      rating: parsed.data.rating,
      title: parsed.data.title || '',
      comment: parsed.data.comment,
    });

    await product.save();
    await product.populate('reviews.user', 'name');

    const createdReview = product.reviews[product.reviews.length - 1];

    return NextResponse.json({
      success: true,
      message: 'Review added successfully.',
      data: {
        review: mapReview(createdReview, auth.user),
        product: mapProductDocument(product, auth.user),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to add review.' }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product id.' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const { reviewId, ...reviewBody } = body;
    const parsed = reviewSchema.safeParse(reviewBody);

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json({ success: false, message: 'Valid reviewId is required.' }, { status: 400 });
    }

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message || 'Invalid review.' }, { status: 400 });
    }

    const product = await Product.findById(id).populate('reviews.user', 'name');
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found.' }, { status: 404 });
    }

    if (String(review.user?._id ?? review.user) !== String(auth.user._id)) {
      return NextResponse.json({ success: false, message: 'You can edit only your own review.' }, { status: 403 });
    }

    review.rating = parsed.data.rating;
    review.title = parsed.data.title || '';
    review.comment = parsed.data.comment;
    review.name = auth.user.name;
    review.updatedAt = new Date();

    await product.save();
    await product.populate('reviews.user', 'name');

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully.',
      data: {
        review: mapReview(product.reviews.id(reviewId), auth.user),
        product: mapProductDocument(product, auth.user),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to update review.' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product id.' }, { status: 400 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json({ success: false, message: 'Valid reviewId is required.' }, { status: 400 });
    }

    const product = await Product.findById(id).populate('reviews.user', 'name');
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found.' }, { status: 404 });
    }

    if (String(review.user?._id ?? review.user) !== String(auth.user._id)) {
      return NextResponse.json({ success: false, message: 'You can delete only your own review.' }, { status: 403 });
    }

    review.deleteOne();
    await product.save();
    await product.populate('reviews.user', 'name');

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully.',
      data: {
        product: mapProductDocument(product, auth.user),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to delete review.' }, { status: 500 });
  }
}
