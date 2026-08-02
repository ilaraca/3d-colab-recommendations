import { encodeProduct, encodeUserFromPurchases } from './encode';
import { loadModel } from './model-loader';
import { predictBatch } from './model';
import type {
  RecommendationContext,
  RecommendationProduct,
  ScoredProduct,
  UserWithPurchases,
} from './types';

export class ModelNotFoundError extends Error {
  constructor() {
    super('Recommendation ML model not found');
    this.name = 'ModelNotFoundError';
  }
}

export async function scoreProductsML(options: {
  user: UserWithPurchases;
  products: RecommendationProduct[];
  context: RecommendationContext;
  purchasedIds: Set<number>;
  ownProductUserId?: number;
  excludeIds: Set<number>;
  limit: number;
}): Promise<ScoredProduct[]> {
  const model = await loadModel();
  if (!model) throw new ModelNotFoundError();

  const userVector = encodeUserFromPurchases(options.user.purchases, options.context);
  if (!userVector) return [];

  const candidates = options.products.filter(
    (product) =>
      !options.purchasedIds.has(product.id) &&
      product.user_id !== options.ownProductUserId &&
      !options.excludeIds.has(product.id)
  );

  if (candidates.length === 0) return [];

  const inputs = candidates.map((product) => {
    const productVector = encodeProduct(product, options.context);
    return [...userVector, ...productVector];
  });

  const scores = await predictBatch(model, inputs);

  return candidates
    .map((product, index) => ({
      product,
      score: scores[index] ?? 0,
      vector: encodeProduct(product, options.context),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit);
}
