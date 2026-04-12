import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { PRODUCT_CATEGORIES } from '@/lib/catalog';
import productsData from '@/app/data/products.json';

const JEWELLERY_CATEGORY_SET = new Set(PRODUCT_CATEGORIES.map((value) => String(value).toLowerCase()));

const STOP_WORDS = new Set([
  'best', 'product', 'products', 'for', 'with', 'and', 'under', 'below', 'near', 'good', 'buy', 'show',
  'me', 'the', 'a', 'an', 'to', 'in', 'on', 'of', 'need', 'want', 'looking', 'item', 'items', 'please',
]);

const NON_JEWELLERY_TERMS = new Set([
  'mobile', 'mobiles', 'phone', 'phones', 'laptop', 'tv', 'electronics', 'electronic', 'gadget', 'gadgets', 'other',
]);

const CHATBOT_DEBUG_PREFIX = '[Chat Recommendations API]';

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

const mapFallbackProduct = (product) => ({
  id: String(product.id),
  title: product.name,
  description: product.description,
  price: product.price,
  category: product.category,
  rating: product.rating ?? 0,
  tags: product.tags ?? [],
  images: product.images ?? [],
  image: product.images?.[0] ?? '',
  stock: product.stock ?? 0,
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

const rankProducts = (products, context) =>
  products
    .map((product) => ({ product, score: scoreProduct(product, context) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ product, score }) => ({
      ...product,
      score,
      reasons: buildReason(product, context),
    }));

const parseJsonBodySafely = async (request) => {
  try {
    return await request.json();
  } catch (error) {
    console.error(`${CHATBOT_DEBUG_PREFIX} Failed to parse request JSON:`, error);
    return null;
  }
};

const buildContextFromQuery = (query) => ({
  budget: parseBudget(query),
  category: parseCategory(query),
  keywords: parseKeywords(query),
});

const buildMongoQuery = (context) => {
  const mongoQuery = {
    isActive: true,
    stock: { $gt: 0 },
    category: { $in: Array.from(JEWELLERY_CATEGORY_SET) },
  };

  if (context.category) {
    mongoQuery.category = context.category;
  }

  if (context.budget !== null) {
    mongoQuery.price = { $lte: context.budget };
  }

  if (context.keywords.length) {
    const tokenRegexes = context.keywords.map((keyword) => ({ $regex: keyword, $options: 'i' }));
    mongoQuery.$or = [
      { title: { $in: tokenRegexes } },
      { description: { $in: tokenRegexes } },
      { category: { $in: tokenRegexes } },
      { tags: { $in: tokenRegexes } },
    ];
  }

  return mongoQuery;
};

const getFallbackRecommendations = (context) => {
  const fallbackProducts = Array.isArray(productsData?.products) ? productsData.products : [];
  const normalizedFallback = fallbackProducts
    .map(mapFallbackProduct)
    .filter((product) => product.stock > 0 && JEWELLERY_CATEGORY_SET.has(String(product.category).toLowerCase()));
  return rankProducts(normalizedFallback, context);
};

export async function POST(request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const token = request.cookies?.get('ecocommerce_auth')?.value;

  console.log(`${CHATBOT_DEBUG_PREFIX} Request received`, {
    requestId,
    method: request.method,
    url: request.url,
    hasAuthToken: Boolean(token),
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasPublicBaseUrl: Boolean(process.env.NEXT_PUBLIC_BASE_URL),
  });

  try {
    const body = await parseJsonBodySafely(request);
    console.log(`${CHATBOT_DEBUG_PREFIX} Request body`, { requestId, body });

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.', debugRequestId: requestId },
        { status: 400 }
      );
    }

    const query = String(body.query || '').trim();

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Query is required.', debugRequestId: requestId },
        { status: 400 }
      );
    }

    const context = buildContextFromQuery(query);
    const mongoQuery = buildMongoQuery(context);
    console.log(`${CHATBOT_DEBUG_PREFIX} Parsed query context`, {
      requestId,
      parsed: context,
      mongoQuery,
    });

    let ranked = [];
    let dataSource = 'mongodb';

    try {
      const dbConnection = await connectDB();
      console.log(`${CHATBOT_DEBUG_PREFIX} DB connected`, {
        requestId,
        dbName: dbConnection?.connection?.name,
        host: dbConnection?.connection?.host,
      });

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

      const normalizedCandidates = candidates.map(mapProduct);
      ranked = rankProducts(normalizedCandidates, context);
    } catch (dbError) {
      dataSource = 'fallback-json';
      console.error(`${CHATBOT_DEBUG_PREFIX} DB flow failed; using fallback data`, {
        requestId,
        name: dbError?.name,
        message: dbError?.message,
      });
      ranked = getFallbackRecommendations(context);
    }

    console.log(`${CHATBOT_DEBUG_PREFIX} Response ready`, {
      requestId,
      dataSource,
      recommendationCount: ranked.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        query,
        parsed: context,
        dataSource,
        recommendations: ranked,
        fallbackMessage: ranked.length ? null : 'No exact match found. Try a different jewellery query.',
      },
      debugRequestId: requestId,
    });
  } catch (error) {
    console.error(`${CHATBOT_DEBUG_PREFIX} Fatal route error`, {
      requestId,
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to get recommendations.', debugRequestId: requestId },
      { status: 500 }
    );
  }
}
