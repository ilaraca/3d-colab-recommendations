import type { RecommendationContext, RecommendationProduct } from './types';

function buildIndex(values: string[]): Record<string, number> {
  const unique = [...new Set(values.map((v) => v.toLowerCase().trim()))].sort();
  return Object.fromEntries(unique.map((value, index) => [value, index]));
}

function getVolume(product: RecommendationProduct): number {
  return product.width * product.height * product.depth;
}

export function buildContext(products: RecommendationProduct[]): RecommendationContext {
  const categoriesIndex = buildIndex(products.map((p) => p.category));
  const materialsIndex = buildIndex(products.map((p) => p.material));

  const prices = products.map((p) => p.price);
  const printTimes = products.map((p) => p.print_time);
  const volumes = products.map(getVolume);
  const weights = products.map((p) => p.weight);

  const numCategories = Object.keys(categoriesIndex).length || 1;
  const numMaterials = Object.keys(materialsIndex).length || 1;
  const numericDims = 5;

  return {
    categoriesIndex,
    materialsIndex,
    numCategories,
    numMaterials,
    minPrice: Math.min(...prices, 0),
    maxPrice: Math.max(...prices, 1),
    minPrintTime: Math.min(...printTimes, 0),
    maxPrintTime: Math.max(...printTimes, 1),
    minVolume: Math.min(...volumes, 0),
    maxVolume: Math.max(...volumes, 1),
    minWeight: Math.min(...weights, 0),
    maxWeight: Math.max(...weights, 1),
    dimensions: numericDims + numCategories + numMaterials,
  };
}

export function getCategoryIndex(context: RecommendationContext, category: string): number {
  return context.categoriesIndex[category.toLowerCase().trim()] ?? 0;
}

export function getMaterialIndex(context: RecommendationContext, material: string): number {
  return context.materialsIndex[material.toLowerCase().trim()] ?? 0;
}
