# Fase 1 — Plano: MVP Content-Based

## Objetivo

Entregar recomendações personalizadas **sem rede neural**, usando vetores de features normalizados e **similaridade de cosseno**. Valida o pipeline e a UX antes de investir em ML mais pesado.

## Escopo

### Incluído

- [ ] Módulo `src/lib/recommendations/` (context, encode, similarity, recommend)
- [ ] API `GET /api/recommendations`
- [ ] Componente `RecommendationsSection` no marketplace
- [ ] Componente `SimilarProducts` na página de produto
- [ ] Fallback para usuários não logados (produtos populares)
- [ ] Testes unitários das funções de encode e similaridade
- [ ] Testes de integração da API (mock Prisma ou DB de teste)

### Fora de escopo

- Treino de rede neural
- Cache Redis / persistência de scores
- Embeddings de texto
- Retreino automático
- Recomendação de doações (`donation`)

## Entregáveis

| # | Entregável | Critério de aceite |
|---|------------|-------------------|
| 1 | `lib/recommendations/*` | Funções puras testáveis, sem dependência de React |
| 2 | API Route | Retorna JSON paginado; 401 tratado; guest retorna popular |
| 3 | UI Marketplace | Seção visível para usuário logado com ≥1 pedido |
| 4 | UI Product page | "Produtos similares" com 4 itens |
| 5 | Testes | Cobertura das funções core; CI passa |

## Cronograma sugerido

| Semana | Atividade |
|--------|-----------|
| 1 | Lib core (context, encode, similarity) + testes unitários |
| 2 | API Route + queries Prisma |
| 3 | Componentes UI + integração marketplace e product page |
| 4 | QA manual, ajuste de pesos, documentação |

## Tarefas detalhadas

### 1. Fundação (`lib/recommendations`)

1. Criar `types.ts` com interfaces `RecommendationContext`, `ProductVector`, `ScoredProduct`
2. Implementar `buildContext(products)` — min/max, índices de category e material
3. Implementar `encodeProduct(product, context)` — array numérico
4. Implementar `encodeUserFromPurchases(purchases, context)` — média dos vetores
5. Implementar `cosineSimilarity(a, b)`
6. Implementar `rankProducts(userVector, productVectors, options)` — exclui comprados e próprios

### 2. Camada de dados

1. Criar `fetchRecommendationData(userId)` em `recommend.ts`
2. Query pedidos concluídos + produtos disponíveis (ver spec)
3. Definir lista `COMPLETED_ORDER_STATUSES` em constante compartilhada

### 3. API

1. Criar `src/app/api/recommendations/route.ts`
2. Autenticação via `getServerSession` (NextAuth)
3. Query params: `limit`, `excludeProductId`, `mode` (`personalized` | `similar`)

### 4. UI

1. `RecommendationsSection.tsx` — fetch `/api/recommendations`, reutiliza `ProductCard`
2. Integrar em `src/app/marketplace/page.tsx` (topo ou sidebar)
3. `SimilarProducts.tsx` em `src/app/products/[id]/page.tsx`
4. Loading skeleton e empty state

### 5. Testes

1. `tests/unit/lib/recommendations/encode.test.ts`
2. `tests/unit/lib/recommendations/similarity.test.ts`
3. `tests/integration/api/recommendations.test.ts` (opcional na Fase 1)

## Critérios de pronto (Definition of Done)

- [ ] Usuário logado com histórico vê produtos ordenados por relevância
- [ ] Usuário sem histórico vê fallback (populares por nº de vendas ou reviews)
- [ ] Produtos já comprados não aparecem
- [ ] Produtos do próprio maker não aparecem
- [ ] API responde em < 200ms com catálogo atual
- [ ] Testes unitários passam no CI
- [ ] Sem regressão no marketplace existente

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Poucos pedidos no DB de dev | Script seed ou dados de teste documentados |
| Categorias/material free-text | Normalizar para lowercase; mapear aliases comuns |
| Performance com catálogo grande | Limitar produtos candidatos; cache na Fase 2 |

## Próximo passo após Fase 1

Validar com usuários reais ou staging. Se CTR/conversão justificar, iniciar [Fase 2](./../phase-02-neural-network/plan.md).

## Referência

- [Spec técnica](./spec.md)
- [Overview](../OVERVIEW.md)
