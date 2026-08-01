import { buildContext } from '@/lib/recommendations/context';
import { encodeProduct, encodeUserFromPurchases } from '@/lib/recommendations/encode';
import { FEATURE_WEIGHTS } from '@/lib/recommendations/constants';
import type { RecommendationProduct } from '@/lib/recommendations/types';

const sampleProducts: RecommendationProduct[] = [
  {
    id: 1,
    title: 'A',
    description: 'A',
    category: 'decorative',
    material: 'PLA',
    price: 10,
    width: 10,
    height: 10,
    depth: 10,
    weight: 0.1,
    print_time: 2,
    user_id: 1,
    avgRating: 5,
  },
  {
    id: 2,
    title: 'B',
    description: 'B',
    category: 'functional',
    material: 'ABS',
    price: 100,
    width: 20,
    height: 20,
    depth: 20,
    weight: 1,
    print_time: 10,
    user_id: 2,
    avgRating: 1,
  },
];

describe('encode', () => {
  const context = buildContext(sampleProducts);

  it('normalizes min price to ~0', () => {
    const vector = encodeProduct(sampleProducts[0], context);
    expect(vector[0]).toBeCloseTo(0, 1);
  });

  it('normalizes max price to ~WEIGHT', () => {
    const vector = encodeProduct(sampleProducts[1], context);
    expect(vector[0]).toBeCloseTo(FEATURE_WEIGHTS.price, 1);
  });

  it('returns null for user with no purchases', () => {
    expect(encodeUserFromPurchases([], context)).toBeNull();
  });

  it('averages two product vectors', () => {
    const v1 = encodeProduct(sampleProducts[0], context);
    const v2 = encodeProduct(sampleProducts[1], context);
    const userVector = encodeUserFromPurchases(sampleProducts, context)!;

    expect(userVector.length).toBe(v1.length);
    expect(userVector[0]).toBeGreaterThan(v1[0]);
    expect(userVector[0]).toBeLessThan(v2[0]);
  });
});
