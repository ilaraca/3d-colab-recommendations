# Overview — Sistema de Recomendações 3D Colab

## Problema

Usuários do marketplace precisam descobrir produtos relevantes além de busca manual e filtros. O sistema atual (`/api/marketplace`) ordena por data, preço ou título — não há personalização.

## Solução proposta

Recomendar produtos com base no **histórico de compras** e **atributos do produto**, evoluindo em três fases de complexidade crescente.

## Classificação da abordagem (referência do curso)

| Aspecto | Demo e-commerce | 3D Colab |
|---------|-----------------|----------|
| Paradigma | Supervised binary classification | Fase 1: content-based · Fase 2+: idem curso |
| Tipo | Híbrido content-based | Híbrido (atributos 3D + histórico) |
| Ranking | Pointwise (score 0–1 por par) | Idem |
| Dados | JSON estático (5 users, 10 products) | PostgreSQL via Prisma |
| Execução | Web Worker no browser | API Route / job no servidor |

## Mapeamento de features

### Produto (`product`)

| Demo | 3D Colab | Tipo | Peso sugerido (Fase 1–2) |
|------|----------|------|--------------------------|
| `category` | `category` | one-hot | 0.35 |
| `color` | `material` | one-hot | 0.25 |
| `price` | `price` | normalizado 0–1 | 0.15 |
| idade média compradores | `avgRating` (reviews) | normalizado 0–1 | 0.10 |
| — | `print_time` | normalizado 0–1 | 0.05 |
| — | `volume` (w×h×d) | normalizado 0–1 | 0.05 |
| — | `weight` | normalizado 0–1 | 0.05 |

### Usuário

| Demo | 3D Colab |
|------|----------|
| Média dos vetores comprados | Média dos produtos em `orderItem` (pedidos `completed`) |
| Sem compras: só idade | Sem compras: categorias mais vistas + produtos populares |
| — | Sinal extra: `trust_score` do maker favorito (opcional) |

## Fontes de dados (Prisma)

### Histórico de compras (label positivo)

```typescript
// Pedidos concluídos → itens → produtos
order {
  status: 'completed' | 'delivered' | ...  // definir lista de status válidos
  items: orderItem[]
}
```

### Histórico alternativo

```typescript
purchase { user_id, product_id, status }
```

> **Decisão:** usar `orderItem` como fonte primária (fluxo principal de compra). `purchase` como fallback se houver dados legados.

### Produtos elegíveis

```typescript
product {
  available: true
}
```

## Pontos de integração na UI

| Local | Componente | Comportamento |
|-------|------------|---------------|
| `/marketplace` | `RecommendationsSection` | Carrossel "Recomendados para você" (usuário logado) |
| `/products/[id]` | `SimilarProducts` | Top 4 produtos similares (content-based ou score NN) |
| `/profile` | Tab pedidos / dashboard | "Continue explorando" com sugestões |
| `/cart` | Opcional Fase 2+ | Cross-sell antes do checkout |

## Fluxo de dados

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  PostgreSQL │────▶│ lib/recommendations │────▶│ GET /api/recommendations │
│  (Prisma)   │     │ encode + rank    │     └────────┬────────┘
└─────────────┘     └──────────────────┘              │
                                                        ▼
                                              ┌─────────────────┐
                                              │ UI Components   │
                                              │ (marketplace,   │
                                              │  product page)  │
                                              └─────────────────┘
```

## Regras de negócio globais

1. **Nunca recomendar** produtos já comprados pelo usuário (mesmo `product_id` em pedidos concluídos)
2. **Nunca recomendar** produtos do próprio usuário (`product.user_id === currentUser.id`)
3. Apenas produtos com `available: true`
4. Usuário não autenticado → fallback para "Mais populares" ou "Novidades" (sem personalização)
5. Resposta sempre paginada (`limit` default 12, max 50)

## Métricas de sucesso

| Métrica | Fase 1 | Fase 2+ |
|---------|--------|---------|
| Tempo de resposta API | < 200ms (catálogo < 500 itens) | < 500ms |
| CTR em recomendações | Baseline manual | +10% vs lista genérica |
| Conversão | — | Pedidos originados de bloco "Recomendados" |

## Riscos conhecidos (do demo original)

| Risco | Mitigação |
|-------|-----------|
| Vazamento no vetor do usuário (inclui produto sendo rotulado) | Leave-one-out no treino (Fase 2) |
| Overfitting (poucos dados) | Fase 1 primeiro; rede menor; validação |
| Label `0` = "não comprou" ≠ "não quer" | Negative sampling; tratar como feedback implícito |
| `accuracy` enganosa | Usar Precision@K na Fase 2+ |

## Dependências por fase

| Fase | Novas deps |
|------|------------|
| 1 | Nenhuma |
| 2 | `@tensorflow/tfjs-node` |
| 3 | API de embeddings (OpenAI/Cohere) ou `@xenova/transformers` |
