import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Carousel from '@/models/Carousel';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';

export const runtime = 'nodejs';

// GET all carousel items (admin sees all, including inactive)
export async function GET(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();
  const items = await Carousel.find().sort({ order: 1, createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: { items } });
}

// POST create new carousel item (supports multipart/form-data for image upload)
export async function POST(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const contentType = request.headers.get('content-type') ?? '';
  let fields = {};
  let imageUrl = '';
  let imagePublicId = '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    fields = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => !(v instanceof File))
    );

    const file = formData.get('image');
    if (file instanceof File) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, message: 'Only image files are allowed.' }, { status: 400 });
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: 'Image must be under 5MB.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadBufferToCloudinary(buffer, {
        folder: 'eco-commerce/carousel',
        public_id: `carousel-${Date.now()}`,
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    } else if (fields.image) {
      imageUrl = fields.image;
    }
  } else {
    fields = await request.json();
    imageUrl = fields.image ?? '';
  }

  if (!fields.title?.trim()) {
    return NextResponse.json({ success: false, message: 'Title is required.' }, { status: 400 });
  }
  if (!imageUrl) {
    return NextResponse.json({ success: false, message: 'Image is required.' }, { status: 400 });
  }

  const item = await Carousel.create({
    title: fields.title.trim(),
    subtitle: fields.subtitle?.trim() ?? '',
    image: imageUrl,
    imagePublicId,
    offerLabel: fields.offerLabel?.trim() ?? '',
    offerPrice: fields.offerPrice ? Number(fields.offerPrice) : null,
    originalPrice: fields.originalPrice ? Number(fields.originalPrice) : null,
    productLink: fields.productLink?.trim() ?? '',
    ctaText: fields.ctaText?.trim() || 'Shop Now',
    isActive: fields.isActive !== 'false' && fields.isActive !== false,
    order: fields.order ? Number(fields.order) : 0,
  });

  return NextResponse.json({ success: true, data: { item } }, { status: 201 });
}

// PATCH update carousel item
export async function PATCH(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const contentType = request.headers.get('content-type') ?? '';
  let fields = {};
  let newImageUrl = null;
  let newImagePublicId = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    fields = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => !(v instanceof File))
    );

    const file = formData.get('image');
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, message: 'Only image files are allowed.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadBufferToCloudinary(buffer, {
        folder: 'eco-commerce/carousel',
        public_id: `carousel-${Date.now()}`,
      });
      newImageUrl = result.secure_url;
      newImagePublicId = result.public_id;
    }
  } else {
    fields = await request.json();
  }

  const { id, ...rest } = fields;
  if (!id) {
    return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });
  }

  const update = {};
  if (rest.title !== undefined) update.title = rest.title.trim();
  if (rest.subtitle !== undefined) update.subtitle = rest.subtitle.trim();
  if (rest.offerLabel !== undefined) update.offerLabel = rest.offerLabel.trim();
  if (rest.offerPrice !== undefined) update.offerPrice = rest.offerPrice ? Number(rest.offerPrice) : null;
  if (rest.originalPrice !== undefined) update.originalPrice = rest.originalPrice ? Number(rest.originalPrice) : null;
  if (rest.productLink !== undefined) update.productLink = rest.productLink.trim();
  if (rest.ctaText !== undefined) update.ctaText = rest.ctaText.trim() || 'Shop Now';
  if (rest.isActive !== undefined) update.isActive = rest.isActive === 'true' || rest.isActive === true;
  if (rest.order !== undefined) update.order = Number(rest.order);
  if (newImageUrl) { update.image = newImageUrl; update.imagePublicId = newImagePublicId; }
  else if (rest.image) update.image = rest.image;

  const item = await Carousel.findByIdAndUpdate(id, update, { new: true });
  if (!item) {
    return NextResponse.json({ success: false, message: 'Carousel item not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { item } });
}

// DELETE carousel item
export async function DELETE(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });
  }

  const item = await Carousel.findByIdAndDelete(id);
  if (!item) {
    return NextResponse.json({ success: false, message: 'Carousel item not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Carousel item deleted.' });
}
