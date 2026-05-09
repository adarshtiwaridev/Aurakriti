import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

import connectDB from '../src/lib/db.js';
import Carousel from '../src/models/Carousel.js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// Minimal deterministic sample data.
// Repo owner asked to "insert some data for it"—carousel is one common empty-state area.
const seedItems = [
  {
    title: 'Weekend Sale',
    subtitle: 'Save up to 60% on select handcrafted favorites.',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1600&q=80',
    offerLabel: 'UP TO 60% OFF',
    offerPrice: 60,
    originalPrice: null,
    productLink: '/shop?sale=weekend',
    ctaText: 'Shop Now',
    isActive: true,
    order: 1,
  },
  {
    title: 'New Customer Perk',
    subtitle: 'Get an extra 10% off your first order with instant checkout.',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1600&q=80',
    offerLabel: 'FIRST ORDER 10% OFF',
    offerPrice: 10,
    originalPrice: null,
    productLink: '/signup',
    ctaText: 'Claim Offer',
    isActive: true,
    order: 2,
  },
  {
    title: 'Best Sellers',
    subtitle: 'Top-rated favorites our customers keep reordering.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80',
    offerLabel: 'TOP RATED',
    offerPrice: 0,
    originalPrice: null,
    productLink: '/shop?featured=true',
    ctaText: 'Browse',
    isActive: true,
    order: 3,
  },
];

async function run() {
  await connectDB();

  // Upsert by unique signature: title + order
  // (we avoid depending on Mongo _id to keep deterministic behavior across reruns)
  let upserted = 0;
  for (const item of seedItems) {
    const existing = await Carousel.findOne({ title: item.title, order: item.order });
    if (existing) {
      await Carousel.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...item,
          },
        }
      );
    } else {
      await Carousel.create({
        ...item,
        imagePublicId: '',
      });
      upserted++;
    }
  }

  const count = await Carousel.countDocuments({});
  const activeCount = await Carousel.countDocuments({ isActive: true });

  console.log(`Carousel seed complete. Total: ${count}, Active: ${activeCount}, Newly inserted: ${upserted}`);

  // Close mongoose connection safely
  try {
    await mongoose.connection.close();
  } catch {}
}

run().catch(async (err) => {
  console.error('Carousel seed failed:', err?.message || err);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});

