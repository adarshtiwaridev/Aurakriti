import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Carousel from '@/models/Carousel';

// Public: fetch active carousel items
export async function GET() {
  await connectDB();
  const items = await Carousel.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return NextResponse.json({ success: true, data: { items } });
}
