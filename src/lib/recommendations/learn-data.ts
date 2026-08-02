import { prisma } from '@/lib/prisma';
import { FEATURE_WEIGHTS } from './constants';
import { buildContext } from './context';
import { encodeProduct, encodeUserFromPurchases } from './encode';
import { loadModelMetadata, modelExists } from './model-loader';
import { loadTrainingDataFromPrisma } from './queries';
import { createTrainingData, splitByUser } from './training-data';
import type { RecommendationContext, RecommendationProduct } from './types';

const DEMO_BUYER_EMAILS = ['maria@demo.com', 'joao@demo.com'] as const;

function buildFeatureLabels(context: RecommendationContext): string[] {
  const numeric = ['price', 'avgRating', 'printTime', 'volume', 'weight'];
  const categories = Object.keys(context.categoriesIndex).sort(
    (a, b) => context.categoriesIndex[a]! - context.categoriesIndex[b]!
  );
  const materials = Object.keys(context.materialsIndex).sort(
    (a, b) => context.materialsIndex[a]! - context.materialsIndex[b]!
  );

  return [
    ...numeric,
    ...categories.map((category) => `category:${category}`),
    ...materials.map((material) => `material:${material}`),
  ];
}

function summarizePurchases(purchases: RecommendationProduct[]) {
  const categories = [...new Set(purchases.map((product) => product.category))];
  const materials = [...new Set(purchases.map((product) => product.material))];
  return { count: purchases.length, categories, materials };
}

export async function getLearnDataset() {
  const { users, products, context } = await loadTrainingDataFromPrisma();
  const { examples, inputDim } = createTrainingData(users, products, context);
  const { train, val } = splitByUser(examples);

  const demoUsers = await prisma.user.findMany({
    where: { email: { in: [...DEMO_BUYER_EMAILS] } },
    select: { id: true, name: true, email: true },
  });

  return {
    inputDim,
    featureLabels: buildFeatureLabels(context),
    featureWeights: FEATURE_WEIGHTS,
    context: {
      dimensions: context.dimensions,
      numCategories: context.numCategories,
      numMaterials: context.numMaterials,
      categories: Object.keys(context.categoriesIndex),
      materials: Object.keys(context.materialsIndex),
    },
    stats: {
      userCount: users.length,
      productCount: products.length,
      trainExamples: train.length,
      valExamples: val.length,
      positiveLabels: examples.filter((example) => example.label === 1).length,
      negativeLabels: examples.filter((example) => example.label === 0).length,
    },
    demoUsers,
    users: users.map((user) => {
      const profile = demoUsers.find((demo) => demo.id === user.id);
      return {
        id: user.id,
        name: profile?.name ?? `Usuário ${user.id}`,
        email: profile?.email,
        ...summarizePurchases(user.purchases),
      };
    }),
    train: train.map((example) => ({
      input: example.input,
      label: example.label,
      userId: example.userId,
    })),
    val: val.map((example) => ({
      input: example.input,
      label: example.label,
      userId: example.userId,
    })),
  };
}

export async function getLearnVectors(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return null;
  }

  const { users, products, context } = await loadTrainingDataFromPrisma();
  const buyer = users.find((entry) => entry.id === user.id);

  if (!buyer) {
    return {
      user,
      hasPurchases: false,
      featureLabels: buildFeatureLabels(context),
      featureWeights: FEATURE_WEIGHTS,
      userVector: null,
      sampleProducts: products.slice(0, 3).map((product) => ({
        id: product.id,
        title: product.title,
        category: product.category,
        material: product.material,
        vector: encodeProduct(product, context),
      })),
    };
  }

  const userVector = encodeUserFromPurchases(buyer.purchases, context);

  return {
    user,
    hasPurchases: true,
    featureLabels: buildFeatureLabels(context),
    featureWeights: FEATURE_WEIGHTS,
    purchases: buyer.purchases.map((product) => ({
      id: product.id,
      title: product.title,
      category: product.category,
      material: product.material,
    })),
    userVector,
    sampleProducts: products.slice(0, 3).map((product) => ({
      id: product.id,
      title: product.title,
      category: product.category,
      material: product.material,
      vector: encodeProduct(product, context),
    })),
  };
}

export async function getLearnDemoUsers() {
  const users = await prisma.user.findMany({
    where: { email: { in: [...DEMO_BUYER_EMAILS] } },
    select: { id: true, name: true, email: true },
  });

  return users.map((user) => ({
    ...user,
    hint:
      user.email === 'maria@demo.com'
        ? 'Histórico decorativo / PLA'
        : 'Histórico funcional / ABS',
  }));
}

export async function getLearnModelStatus() {
  const exists = await modelExists();
  const metadata = exists ? await loadModelMetadata() : null;

  return {
    available: exists,
    metadata,
  };
}

export async function resolveDemoUserId(email: string): Promise<number | null> {
  if (!DEMO_BUYER_EMAILS.includes(email as (typeof DEMO_BUYER_EMAILS)[number])) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function getLearnTrainingPairs(limit = 24) {
  const { users, products, context } = await loadTrainingDataFromPrisma();
  const { examples } = createTrainingData(users, products, context);

  const demoProfiles = await prisma.user.findMany({
    where: { email: { in: [...DEMO_BUYER_EMAILS] } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(demoProfiles.map((profile) => [profile.id, profile]));
  const productMap = new Map(products.map((product) => [product.id, product]));

  const pairs = examples.slice(0, limit).map((example) => {
    const profile = userMap.get(example.userId);
    const product = productMap.get(example.productId);

    return {
      userId: example.userId,
      userName: profile?.name ?? `Usuário ${example.userId}`,
      userEmail: profile?.email,
      productId: example.productId,
      productTitle: product?.title ?? 'Produto',
      productCategory: product?.category,
      productMaterial: product?.material,
      label: example.label,
      labelText: example.label === 1 ? 'Comprou' : 'Não comprou',
    };
  });

  return { pairs, total: examples.length };
}

