import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join("=").trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment');

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  let seller = await User.findOne({ email: 'seller@aurakriti.com' });
  if (!seller) {
    seller = await User.create({
      name: 'Aurakriti Seller',
      email: 'seller@aurakriti.com',
      password: 'Seller@123',
      role: 'seller',
      isVerified: true,
    });
  } else {
    seller.role = 'seller';
    seller.isVerified = true;
    await seller.save();
  }

  const productsFilePath = path.resolve(process.cwd(), 'src/app/data/products.json');
  const rawProducts = fs.readFileSync(productsFilePath, 'utf8');
  const jsonData = JSON.parse(rawProducts);
  const sampleProducts = Array.isArray(jsonData.products) ? jsonData.products : [];

  if (!sampleProducts.length) {
    throw new Error('No products found in src/app/data/products.json');
  }

  let upsertedCount = 0;
  for (const product of sampleProducts) {
    const payload = {
      title: product.name,
      description: product.description,
      price: Number(product.price || 0),
      category: String(product.category || '').trim().toLowerCase(),
      images: Array.isArray(product.images) ? product.images : [],
      seller: seller._id,
      stock: Number(product.stock ?? 0),
      isActive: true,
      isFeatured: Boolean(product.isFeatured),
      rating: Number(product.rating || 0),
      tags: Array.isArray(product.tags) ? product.tags : [],
    };

    await Product.updateOne(
      { title: payload.title, seller: seller._id },
      { $set: payload },
      { upsert: true }
    );
    upsertedCount += 1;
  }

  const count = await Product.countDocuments({ seller: seller._id });
  console.log(`Seed complete. Seller: ${seller.email}, Upserted: ${upsertedCount}, Total seller products: ${count}`);
  console.log('Seller credentials: seller@aurakriti.com / Seller@123');
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Seed failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
