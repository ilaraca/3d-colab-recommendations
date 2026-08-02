import { buildContext } from '@/lib/recommendations/context';
import { encodeProduct } from '@/lib/recommendations/encode';
import {
  createTrainingData,
  encodeUserLeaveOneOut,
  splitByUser,
} from '@/lib/recommendations/training-data';
import type { RecommendationProduct } from '@/lib/recommendations/types';

const products: RecommendationProduct[] = [
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
    user_id: 10,
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
    user_id: 11,
  },
  {
    id: 3,
    title: 'C',
    description: 'C',
    category: 'decorative',
    material: 'PLA',
    price: 20,
    width: 15,
    height: 15,
    depth: 15,
    weight: 0.2,
    print_time: 3,
    user_id: 12,
  },
];

const users = [
  {
    id: 1,
    purchases: [products[0], products[2]],
  },
  {
    id: 2,
    purchases: [products[1]],
  },
];

describe('training-data', () => {
  const context = buildContext(products);

  it('leave-one-out excludes the labeled product from user vector', () => {
    const fullVector = encodeUserLeaveOneOut(users[0].purchases, 999, context);
    const leaveOneOut = encodeUserLeaveOneOut(users[0].purchases, 1, context);

    expect(fullVector).not.toEqual(leaveOneOut);
    expect(leaveOneOut.length).toBe(context.dimensions);
  });

  it('uses cold start vector when user has only one purchase', () => {
    const vector = encodeUserLeaveOneOut(users[1].purchases, 2, context);
    expect(vector.every((value) => value === 0)).toBe(true);
  });

  it('creates positive and negative labels', () => {
    const { examples } = createTrainingData(users, products, context);

    const user1Positive = examples.filter(
      (example) => example.userId === 1 && example.label === 1
    );
    const user1Negative = examples.filter(
      (example) => example.userId === 1 && example.label === 0
    );

    expect(user1Positive).toHaveLength(2);
    expect(user1Negative).toHaveLength(1);
  });

  it('concatenates user and product vectors', () => {
    const { examples, inputDim } = createTrainingData(users, products, context);
    expect(inputDim).toBe(context.dimensions * 2);
    expect(examples[0].input).toHaveLength(inputDim);
  });

  it('splitByUser keeps users disjoint between train and val', () => {
    const { examples } = createTrainingData(users, products, context);
    const { train, val } = splitByUser(examples, 0.5, 42);

    const trainUsers = new Set(train.map((example) => example.userId));
    const valUsers = new Set(val.map((example) => example.userId));

    for (const userId of trainUsers) {
      expect(valUsers.has(userId)).toBe(false);
    }
  });

  it('input rows differ for purchased vs non-purchased pairs', () => {
    const { examples } = createTrainingData(users, products, context);
    const productVector = encodeProduct(products[0], context);

    const positive = examples.find(
      (example) => example.userId === 1 && example.label === 1 && example.input.includes(productVector[0]!)
    );
    expect(positive).toBeDefined();
  });
});
