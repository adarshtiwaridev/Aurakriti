import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local FIRST
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

import mongoose from 'mongoose';

const categoryMapping = {
  'neckless': 'necklace',
  'necklaces': 'necklace',
  'chokers': 'choker',
  'mangalsutras': 'mangalsutra',
  'watches': 'watch',
};

const JEWELLERY_CATEGORIES = ['choker', 'necklace', 'mangalsutra', 'watch'];

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function migrateCategories() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment');

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);

    let updatedCount = 0;
    let invalidCount = 0;

    for (const product of products) {
      const currentCategory = product.category?.toLowerCase()?.trim();
      let newCategory = null;

      if (JEWELLERY_CATEGORIES.includes(product.category)) {
        continue;
      }

      if (categoryMapping[currentCategory]) {
        newCategory = categoryMapping[currentCategory];
      } else {
        newCategory = 'necklace';
        invalidCount++;
      }

      await Product.findByIdAndUpdate(product._id, { category: newCategory });
      updatedCount++;
      console.log(`Updated product "${product.title}" from "${product.category}" to "${newCategory}"`);
    }

    console.log(`Migration completed:`);
    console.log(`- Updated ${updatedCount} products`);
    console.log(`- Found ${invalidCount} products with unmapped categories (assigned to 'necklace')`);

    const invalidProducts = await Product.find({
      category: { $nin: JEWELLERY_CATEGORIES }
    });

    if (invalidProducts.length > 0) {
      console.error(`Warning: ${invalidProducts.length} products still have invalid categories:`);
      invalidProducts.forEach(p => console.error(`- ${p.title}: ${p.category}`));
    } else {
      console.log('✅ All products now have valid categories');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

migrateCategories();