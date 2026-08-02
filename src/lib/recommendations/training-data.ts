import { encodeColdStartUser, encodeProduct, encodeUserFromPurchases } from './encode';
import type { RecommendationContext, RecommendationProduct, UserWithPurchases } from './types';

export type { UserWithPurchases };

export interface TrainingExample {
  input: number[];
  label: number;
  userId: number;
  productId: number;
}

export function encodeUserLeaveOneOut(
  purchases: RecommendationProduct[],
  excludeProductId: number,
  context: RecommendationContext
): number[] {
  const filtered = purchases.filter((product) => product.id !== excludeProductId);

  if (filtered.length === 0) {
    return encodeColdStartUser(context);
  }

  return encodeUserFromPurchases(filtered, context)!;
}

export function createTrainingData(
  users: UserWithPurchases[],
  products: RecommendationProduct[],
  context: RecommendationContext
): { examples: TrainingExample[]; inputDim: number } {
  const examples: TrainingExample[] = [];

  for (const user of users) {
    const purchasedIds = new Set(user.purchases.map((product) => product.id));

    for (const product of products) {
      const userVector = encodeUserLeaveOneOut(user.purchases, product.id, context);
      const productVector = encodeProduct(product, context);
      const label = purchasedIds.has(product.id) ? 1 : 0;

      examples.push({
        input: [...userVector, ...productVector],
        label,
        userId: user.id,
        productId: product.id,
      });
    }
  }

  return {
    examples,
    inputDim: context.dimensions * 2,
  };
}

export function splitByUser(
  examples: TrainingExample[],
  trainRatio = 0.8,
  randomSeed = 42
): { train: TrainingExample[]; val: TrainingExample[] } {
  const userIds = [...new Set(examples.map((example) => example.userId))];

  const shuffled = [...userIds].sort((a, b) => {
    const hash = (value: number) => ((value * 9301 + 49297 + randomSeed) % 233280) / 233280;
    return hash(a) - hash(b);
  });

  const splitIdx = Math.max(1, Math.floor(shuffled.length * trainRatio));
  const trainUsers = new Set(shuffled.slice(0, splitIdx));

  return {
    train: examples.filter((example) => trainUsers.has(example.userId)),
    val: examples.filter((example) => !trainUsers.has(example.userId)),
  };
}

