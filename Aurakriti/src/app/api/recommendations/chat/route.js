import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import fs from 'fs';
import path from 'path';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';

const STOP_WORDS = new Set([
  'best', 'product', 'products', 'for', 'with', 'and', 'under', 'below', 'near', 'good', 'buy', 'show',
  'me', 'the', 'a', 'an', 'to', 'in', 'on', 'of', 'need', 'want', 'looking', 'item', 'items', 'please',
]);

const mapProduct = (product) => ({
  id: product.id,
  title: product.name,
  description: product.description,
  price: product.price,
  category: product.category,
  rating: product.rating ?? 0,
  tags: [],
  images: product.images ?? [],
  image: product.images?.[0] ?? '',
  stock: product.stock,
});

function parseBudget(query) {
  const match = query.match(/(?:under|below|less\s+than|max(?:imum)?|upto)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)/i);
  if (match) {
    return Number(match[1]);
  }

  const rupeeMatch = query.match(/(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?)/i);
  if (rupeeMatch) {
    return Number(rupeeMatch[1]);
  }

  return null;
}

function parseCategory(query) {
  const normalized = query.toLowerCase();
  const matched = PRODUCT_CATEGORIES.find((category) => normalized.includes(category.toLowerCase()));
  if (matched) {
    return matched;
  }

  // Jewellery-specific category mappings
  if (normalized.includes('choker') || normalized.includes('neck piece') || normalized.includes('collar')) {
    return 'choker';
  }
  if (normalized.includes('necklace') || normalized.includes('pendant') || normalized.includes('neck')) {
    return 'necklace';
  }
  if (normalized.includes('mangalsutra') || normalized.includes('mangal') || normalized.includes('bridal') || normalized.includes('wedding')) {
    return 'mangalsutra';
  }
  if (normalized.includes('watch') || normalized.includes('timepiece') || normalized.includes('wrist')) {
    return 'watch';
  }

  if (normalized.includes('gold') || normalized.includes('jewellery') || normalized.includes('jewelry')) {
    return null; // keep general jewellery search without forcing a category
  }

  return null;
}

function parseKeywords(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && word.length > 1 && !STOP_WORDS.has(word));
}

function scoreProduct(product, context) {
  const title = (product.title || '').toLowerCase();
  const description = (product.description || '').toLowerCase();

  let score = 0;

  for (const keyword of context.keywords) {
    if (title.includes(keyword)) {
      score += 8;
    }
    if (description.includes(keyword)) {
      score += 4;
    }
  }

  if (context.category && product.category === context.category) {
    score += 12;
  }

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

  if (product.stock <= 0) {
    score -= 20;
  }

  return score;
}

function buildReason(product, context) {
  const reasons = [];
  if (context.category && product.category === context.category) {
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
    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const query = String(body.query || '').trim();

    if (!query) {
      return NextResponse.json({ success: false, message: 'Query is required.' }, { status: 400 });
    }

    // Read products from JSON file
    const filePath = path.join(process.cwd(), 'src/app/data/products.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(rawData);
    let candidates = jsonData.products || [];

    // Filter active and in stock
    candidates = candidates.filter(p => p.stock > 0);

    const budget = parseBudget(query);
    const category = parseCategory(query);
    const keywords = parseKeywords(query);

    // Apply filters
    if (category) {
      candidates = candidates.filter(p => p.category === category);
    }
    if (budget !== null) {
      candidates = candidates.filter(p => p.price <= budget);
    }

    // Keyword search
    if (keywords.length) {
      candidates = candidates.filter(p => {
        const title = p.name.toLowerCase();
        const desc = p.description.toLowerCase();
        return keywords.some(kw => title.includes(kw) || desc.includes(kw));
      });
    }

    // If no matches, show all
    if (!candidates.length) {
      candidates = jsonData.products.filter(p => p.stock > 0);
    }

    const context = {
      budget,
      category,
      keywords,
      preferenceCategories: new Set(),
      cartCategories: new Set(),
    };

    const ranked = candidates
      .map((product) => ({
        product,
        score: scoreProduct(product, context),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ product, score }) => ({
        ...mapProduct(product),
        score,
        reasons: buildReason(product, context),
      }));

    const fallbackMessage = ranked.length
      ? null
      : 'No exact match found. Showing popular products for you.';

    return NextResponse.json({
      success: true,
      data: {
        query,
        parsed: {
          budget,
          category,
          keywords,
        },
        recommendations: ranked,
        fallbackMessage,
      },
    });
  } catch (error) {
    console.error('[Chat Recommendations] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get recommendations.' },
      { status: 500 }
    );
