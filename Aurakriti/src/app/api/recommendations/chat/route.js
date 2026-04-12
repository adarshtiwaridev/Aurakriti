import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';

const JEWELLERY_CATEGORY_SET = new Set(PRODUCT_CATEGORIES.map((value) => String(value).toLowerCase()));

const STOP_WORDS = new Set([
  'best', 'product', 'products', 'for', 'with', 'and', 'under', 'below', 'near', 'good', 'buy', 'show',
  'me', 'the', 'a', 'an', 'to', 'in', 'on', 'of', 'need', 'want', 'looking', 'item', 'items', 'please',
]);

const NON_JEWELLERY_TERMS = new Set([
  'mobile', 'mobiles', 'phone', 'phones', 'laptop', 'tv', 'electronics', 'electronic', 'gadget', 'gadgets', 'other',
]);

function normalizeCategory(value = '') {
  const normalized = String(value).trim().toLowerCase();
  return JEWELLERY_CATEGORY_SET.has(normalized) ? normalized : null;
}

const mapProduct = (product) => ({
  id: String(product._id),
  title: product.title,
  description: product.description,
  price: product.price,
  category: product.category,
  rating: product.rating ?? 0,
  tags: product.tags ?? [],
  images: product.images ?? [],
  image: product.images?.[0] ?? '',
  stock: product.stock,
});

function parseBudget(query) {
  const match = query.match(/(?:under|below|less\s+than|max(?:imum)?|upto)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)/i);
  if (match) return Number(match[1]);

  const rupeeMatch = query.match(/(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?)/i);
  if (rupeeMatch) return Number(rupeeMatch[1]);

  return null;
}

function parseCategory(query) {
  const normalized = query.toLowerCase();

  const matched = PRODUCT_CATEGORIES.find((category) => normalized.includes(String(category).toLowerCase()));
  if (matched) return String(matched).toLowerCase();

  if (normalized.includes('choker') || normalized.includes('neck piece') || normalized.includes('collar')) return 'choker';
  if (normalized.includes('necklace') || normalized.includes('pendant') || normalized.includes('neck')) return 'necklace';
  if (normalized.includes('mangalsutra') || normalized.includes('mangal') || normalized.includes('bridal') || normalized.includes('wedding')) return 'mangalsutra';
  if (normalized.includes('watch') || normalized.includes('timepiece') || normalized.includes('wrist')) return 'watch';

  return null;
}

function parseKeywords(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && word.length > 1 && !STOP_WORDS.has(word) && !NON_JEWELLERY_TERMS.has(word));
}

function scoreProduct(product, context) {
  const title = String(product.title || '').toLowerCase();
  const description = String(product.description || '').toLowerCase();

  let score = 0;

  for (const keyword of context.keywords) {
    if (title.includes(keyword)) score += 8;
    if (description.includes(keyword)) score += 4;
  }

  if (context.category && normalizeCategory(product.category) === context.category) score += 12;

  if (context.budget !== null) {
    if (product.price <= context.budget) {
      score += 10;
      const closeness = 1 - Math.abs(context.budget - product.price) / Math.max(context.budget, 1);
      score += Math.max(0, closeness * 4);
    } else {
      score -= 12;
    }
  }

  score += Number(product.rating || 0) * 3;
  if (product.stock <= 0) score -= 20;

  return score;
}

function buildReason(product, context) {
  const reasons = [];
  if (context.category && normalizeCategory(product.category) === context.category) {
    reasons.push(`Matches your ${context.category} preference`);
  }
  if (context.budget !== null && product.price <= context.budget) {
    reasons.push(`Within your budget (<= Rs ${context.budget})`);
  }
  if ((product.rating || 0) >= 4) {
    reasons.push(`Highly rated (${Number(product.rating).toFixed(1)})`);
  }
  return reasons.slice(0, 3);
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['user']);
    if (auth.error) return auth.error;

    const body = await request.json();
    const query = String(body.query || '').trim();

    if (!query) {
      return NextResponse.json({ success: false, message: 'Query is required.' }, { status: 400 });
    }

    await connectDB();

    const budget = parseBudget(query);
    const category = parseCategory(query);
    const keywords = parseKeywords(query);

    const mongoQuery = {
      isActive: true,
      stock: { $gt: 0 },
      category: { $in: Array.from(JEWELLERY_CATEGORY_SET) },
    };

    if (category) {
      mongoQuery.category = category;
    }

    if (budget !== null) {
      mongoQuery.price = { $lte: budget };
    }

    if (keywords.length) {
      const tokenRegexes = keywords.map((keyword) => ({ $regex: keyword, $options: 'i' }));
      mongoQuery.$or = [
        { title: { $in: tokenRegexes } },
        { description: { $in: tokenRegexes } },
        { category: { $in: tokenRegexes } },
        { tags: { $in: tokenRegexes } },
      ];
    }

    let candidates = await Product.find(mongoQuery)
      .sort({ rating: -1, createdAt: -1 })
      .limit(60)
      .lean();

    if (!candidates.length) {
      candidates = await Product.find({
        isActive: true,
        stock: { $gt: 0 },
        category: { $in: Array.from(JEWELLERY_CATEGORY_SET) },
      })
        .sort({ rating: -1, createdAt: -1 })
        .limit(20)
        .lean();
    }

    const context = { budget, category, keywords };

    const ranked = candidates
      .map((product) => ({ product, score: scoreProduct(product, context) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ product, score }) => ({
        ...mapProduct(product),
        score,
        reasons: buildReason(product, context),
      }));

    return NextResponse.json({
      success: true,
      data: {
        query,
        parsed: { budget, category, keywords },
        recommendations: ranked,
        fallbackMessage: ranked.length ? null : 'No exact match found. Try a different jewellery query.',
      },
    });
  } catch (error) {
    console.error('[Chat Recommendations] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get recommendations.' },
      { status: 500 }
    );
  }
}
