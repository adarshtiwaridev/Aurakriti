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
import connectDB from '../src/lib/db.js';
import Product from '../src/models/Product.js';
import { JEWELLERY_CATEGORIES } from '../src/constants/categories.js';

/**
 * Migration script to update existing products with invalid categories
 * Maps old/invalid categories to valid jewellery categories
 */
const categoryMapping = {
  // Map common misspellings or similar categories
  'neckless': 'necklace',
  'necklaces': 'necklace',
  'chokers': 'choker',
  'mangalsutras': 'mangalsutra',
  'watches': 'watch',
  // Add any other mappings as needed
};

async function migrateCategories() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);

    let updatedCount = 0;
    let invalidCount = 0;

    for (const product of products) {
      const currentCategory = product.category?.toLowerCase()?.trim();
      let newCategory = null;

      // Check if category is already valid
      if (JEWELLERY_CATEGORIES.includes(product.category)) {
        continue; // Skip valid categories
      }

      // Check mapping for common misspellings
      if (categoryMapping[currentCategory]) {
        newCategory = categoryMapping[currentCategory];
      } else {
        // If no mapping found, assign default category (necklace as it's most common)
        newCategory = 'necklace';
        invalidCount++;
      }

      // Update the product
      await Product.findByIdAndUpdate(product._id, { category: newCategory });
      updatedCount++;
      console.log(`Updated product "${product.title}" from "${product.category}" to "${newCategory}"`);
    }

    console.log(`Migration completed:`);
    console.log(`- Updated ${updatedCount} products`);
    console.log(`- Found ${invalidCount} products with unmapped categories (assigned to 'necklace')`);

    // Verify all products now have valid categories
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

// Run the migration
migrateCategories();