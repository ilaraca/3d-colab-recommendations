import { prisma } from '@/lib/prisma';
import { buildContext } from './context';
import { COMPLETED_ORDER_STATUSES } from './constants';
import type { RecommendationContext, RecommendationProduct, UserWithPurchases } from './types';

type ProductWithRelations = Awaited<ReturnType<typeof fetchAvailableProducts>>[number];

function mapProduct(product: ProductWithRelations): RecommendationProduct {
  const ratings = product.reviews.map((review) => review.rating);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : undefined;

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    category: product.category,
    material: product.material,
    price: Number(product.price),
    width: product.width,
    height: product.height,
    depth: product.depth,
    weight: product.weight,
    print_time: product.print_time,
    user_id: product.user_id,
    avgRating,
    purchaseCount: product._count.orderItems,
    user: product.user,
    images: product.images,
  };
}

export async function fetchAvailableProducts() {
  return prisma.product.findMany({
    where: { available: true },
    include: {
      user: { select: { id: true, name: true, avatar_url: true } },
      images: { take: 1 },
      reviews: { select: { rating: true } },
      _count: { select: { orderItems: true } },
    },
  });
}

export async function fetchProductsForRecommendations(): Promise<RecommendationProduct[]> {
  const products = await fetchAvailableProducts();
  return products.map(mapProduct);
}

export async function fetchUserPurchaseHistory(userId: number) {
  const completedOrders = await prisma.order.findMany({
    where: {
      user_id: userId,
      status: { in: [...COMPLETED_ORDER_STATUSES] },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              reviews: { select: { rating: true } },
              _count: { select: { orderItems: true } },
            },
          },
        },
      },
    },
  });

  const purchasedProductIds = new Set<number>();
  const purchasedProducts: RecommendationProduct[] = [];

  for (const order of completedOrders) {
    for (const item of order.items) {
      if (purchasedProductIds.has(item.product_id)) continue;
      purchasedProductIds.add(item.product_id);
      purchasedProducts.push(
        mapProduct({
          ...item.product,
          user: { id: item.product.user_id, name: '', avatar_url: null },
          images: [],
        } as ProductWithRelations)
      );
    }
  }

  return { purchasedProductIds, purchasedProducts };
}

export async function fetchUsersWithPurchases(): Promise<UserWithPurchases[]> {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: [...COMPLETED_ORDER_STATUSES] },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              reviews: { select: { rating: true } },
              _count: { select: { orderItems: true } },
            },
          },
        },
      },
    },
  });

  const usersMap = new Map<number, Map<number, RecommendationProduct>>();

  for (const order of orders) {
    if (!usersMap.has(order.user_id)) {
      usersMap.set(order.user_id, new Map());
    }
    const userProducts = usersMap.get(order.user_id)!;

    for (const item of order.items) {
      if (!item.product.available) continue;
      if (userProducts.has(item.product_id)) continue;

      userProducts.set(
        item.product_id,
        mapProduct({
          ...item.product,
          user: { id: item.product.user_id, name: '', avatar_url: null },
          images: [],
        } as ProductWithRelations)
      );
    }
  }

  return [...usersMap.entries()].map(([id, productsMap]) => ({
    id,
    purchases: [...productsMap.values()],
  }));
}

export async function loadTrainingDataFromPrisma(): Promise<{
  users: UserWithPurchases[];
  products: RecommendationProduct[];
  context: RecommendationContext;
}> {
  const products = await fetchProductsForRecommendations();
  const users = await fetchUsersWithPurchases();
  const context = buildContext(products);

  return { users, products, context };
}

export async function fetchProductById(productId: number): Promise<RecommendationProduct | null> {
  const product = await prisma.product.findFirst({
    where: { id: productId, available: true },
    include: {
      user: { select: { id: true, name: true, avatar_url: true } },
      images: { take: 1 },
      reviews: { select: { rating: true } },
      _count: { select: { orderItems: true } },
    },
  });

  return product ? mapProduct(product) : null;
}
