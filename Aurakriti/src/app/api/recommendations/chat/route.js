import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Product from '@/models/Product';
import Cart from '@/models/Cart';
import Order from '@/models/Order';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';

const STOP_WORDS = new Set([
  'best', 'product', 'products', 'for', 'with', 'and', 'under', 'below', 'near', 'good', 'buy', 'show',
  'me', 'the', 'a', 'an', 'to', 'in', 'on', 'of', 'need', 'want', 'looking', 'item', 'items', 'please',
]);

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

  if (normalized.includes('phone') || normalized.includes('laptop') || normalized.includes('gaming')) {
    return 'Electronics';
  }
  if (normalized.includes('shoe') || normalized.includes('sneaker')) {
    return 'Footwear';
  }
  if (normalized.includes('cloth') || normalized.includes('shirt') || normalized.includes('dress') || normalized.includes('jeans')) {
    return 'Men Clothing';
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
  const tags = (product.tags || []).map((tag) => String(tag).toLowerCase());

  let score = 0;

  for (const keyword of context.keywords) {
    if (title.includes(keyword)) {
      score += 8;
    }
    if (description.includes(keyword)) {
      score += 4;
    }
    if (tags.some((tag) => tag.includes(keyword))) {
      score += 5;
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

  if (context.preferenceCategories.has(product.category)) {
    score += 7;
  }

  if (context.cartCategories.has(product.category)) {
    score += 4;
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
  if (context.preferenceCategories.has(product.category)) {
    reasons.push('Based on your previous orders');
  }
  return reasons.slice(0, 3);
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['user']);
    if (auth.error) {
      return auth.error;
    }

    await connectDB();

    const body = await request.json();
    const query = String(body.query || '').trim();

    if (!query) {
      return NextResponse.json({ success: false, message: 'Query is required.' }, { status: 400 });
    }

    const [orders, cart] = await Promise.all([
      Order.find({ user: auth.user._id }).sort({ createdAt: -1 }).limit(25).lean(),
      Cart.findOne({ user: auth.user._id }).populate('items.product').lean(),
    ]);

    const preferenceCategories = new Set();
    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.category) {
          preferenceCategories.add(item.category);
        }
      }
    }

    const cartCategories = new Set();
    for (const item of cart?.items || []) {
      if (item.product?.category) {
        cartCategories.add(item.product.category);
      }
    }

    const budget = parseBudget(query);
    const category = parseCategory(query);
    const keywords = parseKeywords(query);

    const mongoFilter = { isActive: true, stock: { $gt: 0 } };
    if (category) {
      mongoFilter.category = category;
    }
    if (budget !== null) {
      mongoFilter.price = { $lte: budget };
    }

    const orConditions = [];
    for (const keyword of keywords.slice(0, 6)) {
      const regex = { $regex: keyword, $options: 'i' };
      orConditions.push({ title: regex });
      orConditions.push({ description: regex });
      orConditions.push({ tags: regex });
    }

    if (orConditions.length) {
      mongoFilter.$or = orConditions;
    }

    let candidates = await Product.find(mongoFilter)
      .limit(120)
      .sort({ rating: -1, createdAt: -1 })
      .lean();

    if (!candidates.length) {
      candidates = await Product.find({ isActive: true, stock: { $gt: 0 } })
        .limit(120)
        .sort({ rating: -1, createdAt: -1 })
        .lean();
    }

    const context = {
      budget,
      category,
      keywords,
      preferenceCategories,
      cartCategories,
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
    console.error('POST /api/recommendations/chat failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate recommendations.' }, { status: 500 });
  }
}
