export interface RecommendationProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  material: string;
  price: number;
  width: number;
  height: number;
  depth: number;
  weight: number;
  print_time: number;
  user_id: number;
  avgRating?: number;
  purchaseCount?: number;
  user?: {
    id: number;
    name: string;
    avatar_url?: string | null;
  };
  images?: Array<{ id: number; url: string }>;
}

export interface RecommendationContext {
  categoriesIndex: Record<string, number>;
  materialsIndex: Record<string, number>;
  numCategories: number;
  numMaterials: number;
  minPrice: number;
  maxPrice: number;
  minPrintTime: number;
  maxPrintTime: number;
  minVolume: number;
  maxVolume: number;
  minWeight: number;
  maxWeight: number;
  dimensions: number;
}

export interface ScoredProduct {
  product: RecommendationProduct;
  score: number;
  vector: number[];
}

export interface RecommendationsResponse {
  items: Array<{
    id: number;
    title: string;
    description: string;
    price: number;
    category: string;
    material: string;
    score: number;
    user: { id: number; name: string; avatar_url?: string };
    images: Array<{ id: number; url: string }>;
  }>;
  meta: {
    mode: 'personalized' | 'similar' | 'popular';
    totalCandidates: number;
    generatedAt: string;
  };
}
