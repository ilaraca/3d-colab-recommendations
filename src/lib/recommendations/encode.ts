import { FEATURE_WEIGHTS } from './constants';
import { getCategoryIndex, getMaterialIndex } from './context';
import type { RecommendationContext } from './types';
import { normalize, oneHotWeighted, averageVectors } from './similarity';
import type { RecommendationProduct } from './types';

/**
 * Vetor fixo:
 * [price, avgRating, printTime, volume, weight, ...category one-hot, ...material one-hot]
 */
export function encodeProduct(
  product: RecommendationProduct,
  context: RecommendationContext
): number[] {
  const volume = product.width * product.height * product.depth;
  const avgRating = product.avgRating ?? 0.5;

  const numeric = [
    normalize(product.price, context.minPrice, context.maxPrice) * FEATURE_WEIGHTS.price,
    normalize(avgRating, 0, 5) * FEATURE_WEIGHTS.avgRating,
    normalize(product.print_time, context.minPrintTime, context.maxPrintTime) * FEATURE_WEIGHTS.printTime,
    normalize(volume, context.minVolume, context.maxVolume) * FEATURE_WEIGHTS.volume,
    normalize(product.weight, context.minWeight, context.maxWeight) * FEATURE_WEIGHTS.weight,
  ];

  const categoryIndex = getCategoryIndex(context, product.category);
  const materialIndex = getMaterialIndex(context, product.material);

  const categoryOneHot = oneHotWeighted(
    categoryIndex,
    context.numCategories,
    FEATURE_WEIGHTS.category
  );
  const materialOneHot = oneHotWeighted(
    materialIndex,
    context.numMaterials,
    FEATURE_WEIGHTS.material
  );

  return [...numeric, ...categoryOneHot, ...materialOneHot];
}

export function encodeUserFromPurchases(
  purchasedProducts: RecommendationProduct[],
  context: RecommendationContext
): number[] | null {
  if (purchasedProducts.length === 0) return null;

  const vectors = purchasedProducts.map((product) => encodeProduct(product, context));
  return averageVectors(vectors);
}
