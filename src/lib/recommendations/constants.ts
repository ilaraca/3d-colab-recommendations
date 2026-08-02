export const COMPLETED_ORDER_STATUSES = [
  'completed',
  'delivered',
  'shipped',
] as const;

export const FEATURE_WEIGHTS = {
  category: 0.35,
  material: 0.25,
  price: 0.15,
  avgRating: 0.10,
  printTime: 0.05,
  volume: 0.05,
  weight: 0.05,
} as const;

export const RECOMMENDATION_DEFAULT_LIMIT = 12;
export const RECOMMENDATION_MAX_LIMIT = 50;

export type RecommendationMode = 'personalized' | 'similar' | 'popular';
export type RecommendationSource = 'auto' | 'ml' | 'content';
export type RecommendationAlgorithm = 'ml' | 'content' | 'popular';
