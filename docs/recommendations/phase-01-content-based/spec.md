# Fase 1 — Spec Técnica: MVP Content-Based

## 1. API

### Endpoint

```
GET /api/recommendations
```

### Autenticação

- **Logado:** recomendação personalizada
- **Não logado:** `mode=popular` (fallback)

### Query parameters

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `limit` | number | `12` | Máx 50 |
| `mode` | string | `personalized` | `personalized` \| `similar` \| `popular` |
| `productId` | number | — | Obrigatório se `mode=similar` |
| `excludeIds` | string | — | IDs separados por vírgula |

### Response 200

```typescript
interface RecommendationsResponse {
  items: Array<{
    id: number;
    title: string;
    description: string;
    price: number;
    category: string;
    material: string;
    score: number;           // 0–1, similaridade
    user: { id: number; name: string; avatar_url?: string };
    images: Array<{ id: number; url: string }>;
  }>;
  meta: {
    mode: 'personalized' | 'similar' | 'popular';
    totalCandidates: number;
    generatedAt: string;     // ISO 8601
  };
}
```

### Erros

| Status | Condição |
|--------|----------|
| 400 | `mode=similar` sem `productId` |
| 401 | Não necessário — guest usa `popular` |
| 500 | Erro interno Prisma |

---

## 2. Constantes

```typescript
// src/lib/recommendations/constants.ts

export const COMPLETED_ORDER_STATUSES = [
  'completed',
  'delivered',
  'shipped', // incluir se negócio considerar compra efetivada
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
```

---

## 3. Tipos

```typescript
// src/lib/recommendations/types.ts

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
  avgRating?: number;  // calculado de reviews
  purchaseCount?: number;
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
  dimensions: number;  // tamanho do vetor
}

export interface ScoredProduct {
  product: RecommendationProduct;
  score: number;
  vector: number[];
}
```

---

## 4. Algoritmo de encoding

### Normalização

```typescript
function normalize(value: number, min: number, max: number): number {
  return (value - min) / ((max - min) || 1);
}
```

### Vetor de produto

Ordem fixa do vetor (documentar em comentário no código):

```
[
  price_norm * W.price,
  avgRating_norm * W.avgRating,        // default 0.5 se sem reviews
  print_time_norm * W.printTime,
  volume_norm * W.volume,              // width * height * depth
  weight_norm * W.weight,
  ...category_one_hot * W.category,    // numCategories dims
  ...material_one_hot * W.material,    // numMaterials dims
]
```

### One-hot com peso

```typescript
function oneHotWeighted(index: number, length: number, weight: number): number[] {
  return Array.from({ length }, (_, i) => (i === index ? weight : 0));
}
```

### Vetor de usuário

```typescript
function encodeUserFromPurchases(
  purchasedProducts: RecommendationProduct[],
  context: RecommendationContext
): number[] | null {
  if (purchasedProducts.length === 0) return null;

  const vectors = purchasedProducts.map(p => encodeProduct(p, context));
  return averageVectors(vectors);
}
```

### Similaridade

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / ((magA * magB) || 1);
}
```

---

## 5. Queries Prisma

### Produtos disponíveis

```typescript
const products = await prisma.product.findMany({
  where: { available: true },
  include: {
    user: { select: { id: true, name: true, avatar_url: true } },
    images: { take: 1 },
    reviews: { select: { rating: true } },
    _count: { select: { orderItems: true } },
  },
});
```

### Histórico de compras do usuário

```typescript
const completedOrders = await prisma.order.findMany({
  where: {
    user_id: userId,
    status: { in: COMPLETED_ORDER_STATUSES },
  },
  include: {
    items: {
      include: { product: true },
    },
  },
});

const purchasedProductIds = new Set(
  completedOrders.flatMap(o => o.items.map(i => i.product_id))
);

const purchasedProducts = completedOrders
  .flatMap(o => o.items.map(i => i.product))
  .filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx);
```

### Fallback popular

Ordenar por `_count.orderItems` desc, depois `created_at` desc.

---

## 6. Lógica de ranking

```typescript
function rankProducts(options: {
  userVector: number[] | null;
  products: RecommendationProduct[];
  context: RecommendationContext;
  purchasedIds: Set<number>;
  ownProductUserId?: number;
  limit: number;
}): ScoredProduct[] {
  const { userVector, products, context, purchasedIds, ownProductUserId, limit } = options;

  const candidates = products.filter(p =>
    !purchasedIds.has(p.id) &&
    p.user_id !== ownProductUserId
  );

  const scored = candidates.map(product => {
    const vector = encodeProduct(product, context);
    const score = userVector
      ? cosineSimilarity(userVector, vector)
      : (product.purchaseCount ?? 0) / maxPurchaseCount; // mode popular
    return { product, score, vector };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

### Modo `similar`

Usar vetor do produto de referência (`productId`) em vez do vetor do usuário:

```typescript
const referenceVector = encodeProduct(referenceProduct, context);
const score = cosineSimilarity(referenceVector, candidateVector);
```

---

## 7. Componentes UI

### `RecommendationsSection`

**Local:** `src/components/recommendations-section.tsx`

**Props:**

```typescript
interface RecommendationsSectionProps {
  title?: string;  // default: "Recomendados para você"
  limit?: number;
  className?: string;
}
```

**Comportamento:**
- Só renderiza se usuário logado (usar `useSession`)
- `useEffect` → fetch `/api/recommendations?limit=8`
- Loading: skeleton com 4 cards
- Empty: não renderiza ou mensagem discreta
- Reutiliza `ProductCard` existente

### `SimilarProducts`

**Local:** `src/components/similar-products.tsx`

**Props:**

```typescript
interface SimilarProductsProps {
  productId: number;
  limit?: number;  // default 4
}
```

**Integração:** `src/app/products/[id]/page.tsx` — abaixo da descrição ou sidebar.

---

## 8. Estrutura de arquivos

```
src/lib/recommendations/
├── constants.ts
├── types.ts
├── context.ts          # buildContext()
├── encode.ts           # encodeProduct(), encodeUserFromPurchases()
├── similarity.ts       # cosineSimilarity(), averageVectors()
├── queries.ts          # fetchProducts(), fetchUserPurchases()
├── recommend.ts        # getRecommendations(), getSimilarProducts(), getPopularProducts()
└── index.ts            # re-exports

src/app/api/recommendations/
└── route.ts

src/components/
├── recommendations-section.tsx
└── similar-products.tsx

tests/unit/lib/recommendations/
├── encode.test.ts
├── similarity.test.ts
└── recommend.test.ts
```

---

## 9. Testes

### Unitários — `encode.test.ts`

| Caso | Assert |
|------|--------|
| Produto com preço min | `price` component ≈ 0 |
| Produto com preço max | `price` component ≈ WEIGHT |
| Categoria desconhecida | fallback índice 0 ou erro controlado |
| Média de 2 vetores | resultado entre os dois |

### Unitários — `similarity.test.ts`

| Caso | Assert |
|------|--------|
| Vetores idênticos | score = 1 |
| Vetores ortogonais | score ≈ 0 |
| Vetor zero | não divide por zero |

### Integração — API

| Caso | Assert |
|------|--------|
| Guest | `mode: popular`, 200 |
| User com compras | `score` decrescente, exclui comprados |
| `mode=similar&productId=1` | retorna produtos da mesma categoria/material preferencialmente |

---

## 10. Checklist de implementação

```
[ ] constants.ts + types.ts
[ ] context.ts
[ ] encode.ts
[ ] similarity.ts
[ ] queries.ts
[ ] recommend.ts
[ ] route.ts (API)
[ ] recommendations-section.tsx
[ ] similar-products.tsx
[ ] Integração marketplace/page.tsx
[ ] Integração products/[id]/page.tsx
[ ] Testes unitários
[ ] Teste manual com 2+ usuários e históricos diferentes
```
