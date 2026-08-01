# Fase 3 — Spec Técnica: Recomendação Avançada

## 1. Visão da arquitetura híbrida

```
                    ┌─────────────────┐
                    │  User Request   │
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │   RecommendationService     │
              └──────────────┬──────────────┘
                             │
     ┌───────────┬───────────┼───────────┬───────────┐
     │           │           │           │           │
     ▼           ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Content │ │   ML    │ │Semantic │ │Item-CF  │ │ Popular │
│ (Fase1) │ │ (Fase2) │ │(3a)     │ │ (3b)    │ │fallback │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │           │
     └───────────┴───────────┴─────┬─────┴───────────┘
                                   │
                          ┌────────▼────────┐
                          │  Hybrid Ranker  │
                          │  (weighted)     │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │  Cache Layer    │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │   Response      │
                          └─────────────────┘
```

---

## 2. Embeddings semânticos (3a)

### Opções de provider

| Opção | Prós | Contras |
|-------|------|---------|
| OpenAI `text-embedding-3-small` | Qualidade alta | Custo, latência, API key |
| Cohere embed | Bom para PT-BR | Custo |
| `@xenova/transformers` (local) | Grátis, offline | CPU, bundle size |
| pgvector + modelo self-hosted | Controle total | Infra extra |

**Recomendação inicial:** OpenAI ou Cohere para MVP 3a; migrar para local se volume crescer.

### Texto para embedding

```typescript
function buildEmbeddingText(product: Product): string {
  return [
    product.title,
    product.category,
    product.material,
    product.description.slice(0, 500),
  ].join(' | ');
}
```

### Schema (migration)

```prisma
model product {
  // ... campos existentes
  embedding       Json?      // number[] length 384 ou 1536
  embedding_at    DateTime?
  embedding_model String?    // ex: "text-embedding-3-small"
}
```

**Alternativa escalável:** tabela separada

```prisma
model productEmbedding {
  id         Int      @id @default(autoincrement())
  product_id Int      @unique
  vector     Json
  model      String
  created_at DateTime @default(now())
  product    product  @relation(fields: [product_id], references: [id])
}
```

### Job de embedding

```typescript
// src/scripts/embed-products.ts
// Trigger: cron diário + webhook pós POST/PUT /api/products

async function embedProduct(productId: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  const text = buildEmbeddingText(product);
  const vector = await embeddingProvider.embed(text);

  await prisma.product.update({
    where: { id: productId },
    data: {
      embedding: vector,
      embedding_at: new Date(),
      embedding_model: EMBEDDING_MODEL,
    },
  });
}
```

### User embedding (média)

```typescript
function buildUserSemanticEmbedding(
  purchasedProducts: ProductWithEmbedding[]
): number[] | null {
  const withEmb = purchasedProducts.filter(p => p.embedding);
  if (withEmb.length === 0) return null;
  return averageVectors(withEmb.map(p => p.embedding as number[]));
}
```

---

## 3. Two-tower (3b)

### User tower

```
Input:
  - encoded numeric user profile (Fase 1 user vector)
  - user semantic embedding (média dos comprados)
  - optional: order count, avg ticket

Architecture:
  Dense(128, relu) → Dense(64, relu) → user_embedding (32 dims)
```

### Product tower

```
Input:
  - encoded numeric product (Fase 1 product vector)
  - product semantic embedding

Architecture:
  Dense(128, relu) → Dense(64, relu) → product_embedding (32 dims)
```

### Score

```typescript
// Opção A: dot product
score = dot(user_embedding, product_embedding);

// Opção B: MLP sobre concat (como Fase 2, mas torres separadas)
score = sigmoid(MLP(concat(user_embedding, product_embedding)));
```

### Treino BPR (alternativa ao binary CE)

Para feedback implícito, preferir **Bayesian Personalized Ranking**:

```
Para cada user:
  sample produto positivo p (comprou)
  sample produto negativo n (não comprou)
  loss = -log(sigmoid(score(p) - score(n)))
```

---

## 4. Filtragem colaborativa item-item (3b)

### Co-ocorrência

```typescript
// Matriz item-item a partir de orderItems
// coPurchaseCount[A][B] = vezes A e B no mesmo pedido

function buildCoPurchaseMatrix(orders: OrderWithItems[]): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();

  for (const order of orders) {
    const productIds = order.items.map(i => i.product_id);
    for (let i = 0; i < productIds.length; i++) {
      for (let j = 0; j < productIds.length; j++) {
        if (i === j) continue;
        increment(matrix, productIds[i], productIds[j]);
      }
    }
  }
  return matrix;
}
```

### Score CF

```typescript
function cfScore(
  userPurchasedIds: Set<number>,
  candidateId: number,
  matrix: CoPurchaseMatrix
): number {
  let score = 0;
  for (const purchasedId of userPurchasedIds) {
    score += matrix.get(purchasedId)?.get(candidateId) ?? 0;
  }
  return score;
}
```

Persistir matriz em cache (Redis JSON ou tabela materializada), recomputar nightly.

---

## 5. Hybrid ranker

### Fórmula

```typescript
interface RankSignals {
  contentScore: number;    // 0–1 cosine Fase 1
  mlScore: number;         // 0–1 Fase 2
  semanticScore: number;   // 0–1 cosine embeddings
  cfScore: number;         // normalizado 0–1
  popularityScore: number; // 0–1
}

const HYBRID_WEIGHTS = {
  content: 0.20,
  ml: 0.25,
  semantic: 0.30,
  cf: 0.15,
  popularity: 0.10,
};

function hybridScore(signals: RankSignals): number {
  return (
    signals.contentScore * HYBRID_WEIGHTS.content +
    signals.mlScore * HYBRID_WEIGHTS.ml +
    signals.semanticScore * HYBRID_WEIGHTS.semantic +
    signals.cfScore * HYBRID_WEIGHTS.cf +
    signals.popularityScore * HYBRID_WEIGHTS.popularity
  );
}
```

Pesos configuráveis via env ou `platformConfig`.

### Diversidade (MMR)

Evitar top-10 todos da mesma categoria:

```typescript
function maximalMarginalRelevance(
  candidates: ScoredProduct[],
  lambda = 0.7,
  limit = 12
): ScoredProduct[] {
  const selected: ScoredProduct[] = [];
  const remaining = [...candidates];

  while (selected.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestMmr = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const relevance = remaining[i].score;
      const maxSim = selected.length === 0
        ? 0
        : Math.max(...selected.map(s =>
            cosineSimilarity(remaining[i].vector, s.vector)
          ));
      const mmr = lambda * relevance - (1 - lambda) * maxSim;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}
```

---

## 6. Cache layer (3c)

### Schema

```prisma
model userRecommendationCache {
  id         Int      @id @default(autoincrement())
  user_id    Int
  product_ids Json    // number[] ordenado
  scores      Json    // number[] paralelo
  source      String  // "hybrid_v3"
  created_at  DateTime @default(now())
  expires_at  DateTime

  user user @relation(fields: [user_id], references: [id])

  @@unique([user_id, source])
  @@index([expires_at])
}
```

### Fluxo API

```typescript
async function getRecommendations(userId: number, limit: number) {
  const cached = await getValidCache(userId);
  if (cached) return hydrateProducts(cached.product_ids, cached.scores);

  const fresh = await computeHybridRecommendations(userId, limit);
  await setCache(userId, fresh, TTL_HOURS = 24);
  return fresh;
}
```

### Invalidação

| Evento | Ação |
|--------|------|
| Novo pedido concluído | Invalidar cache do user |
| Produto editado | Invalidar caches que incluem productId (ou lazy expiry) |
| Retreino modelo | Bump `source` version → cache miss |

---

## 7. ANN / pgvector (opcional, catálogo > 5000)

```sql
-- Extensão pgvector no Neon
CREATE EXTENSION vector;

ALTER TABLE product ADD COLUMN embedding_vector vector(384);
CREATE INDEX ON product USING hnsw (embedding_vector vector_cosine_ops);
```

Query:

```sql
SELECT id, 1 - (embedding_vector <=> $1) AS similarity
FROM product
WHERE available = true
ORDER BY embedding_vector <=> $1
LIMIT 200;
```

Pré-filtrar 200 candidatos por ANN → aplicar hybrid ranker → top 12.

---

## 8. Métricas e A/B

### Eventos (analytics)

```typescript
interface RecommendationEvent {
  type: 'impression' | 'click' | 'add_to_cart' | 'purchase';
  userId: number;
  productId: number;
  source: 'content' | 'ml' | 'hybrid_v3';
  position: number;
  experimentVariant?: string;
}
```

### Métricas admin

| Métrica | Fórmula |
|---------|---------|
| CTR@K | clicks / impressions (top K) |
| Conversion@K | purchases / impressions |
| NDCG@10 | ver literatura LTR |
| Coverage | % catálogo recomendado em 7 dias |
| Diversity | avg unique categories in top 10 |

### Feature flag

```typescript
// src/lib/feature-flags.ts
export function getRecommendationVariant(userId: number): 'v1' | 'v2' | 'v3' {
  const hash = userId % 100;
  if (hash < 33) return 'v1';  // content
  if (hash < 66) return 'v2';  // ml
  return 'v3';                 // hybrid
}
```

---

## 9. API final (consolidada)

```
GET /api/recommendations
  ?limit=12
  &source=auto|content|ml|hybrid
  &mode=personalized|similar|popular
  &productId=123
  &diverse=true          # MMR na Fase 3
  &experiment=v3         # override A/B (admin)
```

---

## 10. Estrutura de arquivos (Fase 3 delta)

```
src/lib/recommendations/
├── ... (Fases 1–2)
├── embeddings/
│   ├── provider.ts       # interface + OpenAI impl
│   ├── product-embedder.ts
│   └── user-embedder.ts
├── collaborative/
│   └── co-purchase.ts
├── hybrid/
│   ├── ranker.ts
│   └── mmr.ts
├── cache/
│   └── recommendation-cache.ts
└── two-tower/
    ├── user-tower.ts
    ├── product-tower.ts
    └── train.ts

src/scripts/
├── embed-products.ts
├── build-co-purchase-matrix.ts
├── train-two-tower.ts
└── warm-recommendation-cache.ts
```

---

## 11. Variáveis de ambiente

```env
# Embeddings
EMBEDDING_PROVIDER=openai          # openai | cohere | local
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small

# Hybrid weights (optional override)
RECOMMEND_WEIGHT_SEMANTIC=0.30
RECOMMEND_WEIGHT_ML=0.25

# Cache
RECOMMENDATION_CACHE_TTL_HOURS=24
RECOMMENDATION_CACHE_ENABLED=true

# Feature flags
RECOMMENDATIONS_V3_ENABLED=false
RECOMMENDATIONS_AB_TEST=true
```

---

## 12. Checklist Fase 3

### 3a
```
[ ] Escolher embedding provider
[ ] Migration product.embedding
[ ] embed-products.ts
[ ] Hook pós create/update product
[ ] semanticScore no ranker
```

### 3b
```
[ ] Two-tower model
[ ] BPR loss (opcional)
[ ] Co-purchase matrix + cfScore
[ ] Hybrid ranker
[ ] MMR diversidade
```

### 3c
```
[ ] userRecommendationCache table
[ ] warm-recommendation-cache cron
[ ] Invalidação por evento
[ ] Admin métricas CTR
[ ] Feature flag A/B
[ ] pgvector (se necessário)
```

---

## 13. Critérios de sucesso quantitativos

| Métrica | Baseline (Fase 1) | Alvo Fase 3 |
|---------|-------------------|-------------|
| CTR@8 | medir | +15% |
| Conversion | medir | +10% |
| P95 latency | ~200ms | < 100ms |
| NDCG@10 | — | > 0.55 |
