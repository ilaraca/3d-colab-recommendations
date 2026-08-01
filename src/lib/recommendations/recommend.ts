import {
  RECOMMENDATION_DEFAULT_LIMIT,
  RECOMMENDATION_MAX_LIMIT,
  type RecommendationMode,
} from './constants';
import { buildContext } from './context';
import { encodeProduct, encodeUserFromPurchases } from './encode';
import {
  fetchProductsForRecommendations,
  fetchProductById,
  fetchUserPurchaseHistory,
} from './queries';
import { cosineSimilarity } from './similarity';
import type {
  RecommendationContext,
  RecommendationProduct,
  RecommendationsResponse,
  ScoredProduct,
} from './types';

interface RankOptions {
  referenceVector: number[] | null;
  products: RecommendationProduct[];
  context: RecommendationContext;
  purchasedIds: Set<number>;
  ownProductUserId?: number;
  excludeIds: Set<number>;
  limit: number;
  mode: RecommendationMode;
}

function rankProducts(options: RankOptions): ScoredProduct[] {
  const {
    referenceVector,
    products,
    context,
    purchasedIds,
    ownProductUserId,
    excludeIds,
    limit,
    mode,
  } = options;

  const candidates = products.filter(
    (product) =>
      !purchasedIds.has(product.id) &&
      product.user_id !== ownProductUserId &&
      !excludeIds.has(product.id)
  );

  const maxPurchaseCount = Math.max(
    ...candidates.map((product) => product.purchaseCount ?? 0),
    1
  );

  const scored = candidates.map((product) => {
    const vector = encodeProduct(product, context);
    let score: number;

    if (referenceVector) {
      score = cosineSimilarity(referenceVector, vector);
    } else {
      score = (product.purchaseCount ?? 0) / maxPurchaseCount;
    }

    return { product, score, vector };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function toResponseItem(scored: ScoredProduct): RecommendationsResponse['items'][number] {
  const { product, score } = scored;
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    material: product.material,
    score,
    user: {
      id: product.user?.id ?? product.user_id,
      name: product.user?.name ?? 'Maker',
      avatar_url: product.user?.avatar_url ?? undefined,
    },
    images: product.images ?? [],
  };
}

function parseExcludeIds(excludeIds?: string): Set<number> {
  if (!excludeIds) return new Set();
  return new Set(
    excludeIds
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !Number.isNaN(id))
  );
}

function clampLimit(limit?: number): number {
  const value = limit ?? RECOMMENDATION_DEFAULT_LIMIT;
  return Math.min(Math.max(1, value), RECOMMENDATION_MAX_LIMIT);
}

export async function getRecommendations(options: {
  userId?: number;
  mode?: RecommendationMode;
  productId?: number;
  limit?: number;
  excludeIds?: string;
}): Promise<RecommendationsResponse> {
  const mode = options.mode ?? (options.userId ? 'personalized' : 'popular');
  const limit = clampLimit(options.limit);
  const excludeIds = parseExcludeIds(options.excludeIds);

  const products = await fetchProductsForRecommendations();
  const context = buildContext(products);

  let purchasedIds = new Set<number>();
  let ownProductUserId: number | undefined;
  let referenceVector: number[] | null = null;
  let effectiveMode: RecommendationMode = mode;

  if (mode === 'similar') {
    if (!options.productId) {
      throw new Error('productId is required for similar mode');
    }
    const referenceProduct = await fetchProductById(options.productId);
    if (!referenceProduct) {
      return {
        items: [],
        meta: { mode: 'similar', totalCandidates: 0, generatedAt: new Date().toISOString() },
      };
    }
    referenceVector = encodeProduct(referenceProduct, context);
    excludeIds.add(referenceProduct.id);
    effectiveMode = 'similar';
  } else if (options.userId) {
    ownProductUserId = options.userId;
    const history = await fetchUserPurchaseHistory(options.userId);
    purchasedIds = history.purchasedProductIds;
    referenceVector = encodeUserFromPurchases(history.purchasedProducts, context);

    if (!referenceVector) {
      effectiveMode = 'popular';
      referenceVector = null;
    } else {
      effectiveMode = 'personalized';
    }
  } else {
    effectiveMode = 'popular';
  }

  const ranked = rankProducts({
    referenceVector,
    products,
    context,
    purchasedIds,
    ownProductUserId,
    excludeIds,
    limit,
    mode: effectiveMode,
  });

  return {
    items: ranked.map(toResponseItem),
    meta: {
      mode: effectiveMode,
      totalCandidates: products.length,
      generatedAt: new Date().toISOString(),
    },
  };
}
