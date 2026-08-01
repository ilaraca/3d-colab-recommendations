# Fase 3 — Plano: Recomendação Avançada

## Objetivo

Escalar a qualidade e a performance das recomendações para catálogos grandes e dados esparsos, incorporando **embeddings semânticos**, arquitetura **two-tower**, **filtragem colaborativa** e **infraestrutura de cache**.

## Pré-requisitos

- [x] Fase 1 em produção
- [ ] Fase 2 validada OU decisão consciente de pular Fase 2 (dados insuficientes)
- [ ] Catálogo > 200 produtos **OU** descriptions ricas (> 100 chars médio)
- [ ] ≥ 50 usuários ativos com histórico de compra

## Escopo

### Incluído

- [ ] Embeddings de `title` + `description` (API ou modelo local)
- [ ] Arquitetura two-tower (user tower + product tower)
- [ ] Filtragem colaborativa leve (item-item ou user-user)
- [ ] Cache de scores / ANN para busca aproximada
- [ ] Tabela ou cache de recomendações pré-computadas
- [ ] Métricas avançadas (NDCG, diversidade)
- [ ] A/B test: ML vs content vs híbrido

### Fora de escopo (v3+)

- Recomendação em tempo real durante chat
- RL (reinforcement learning) para ordenação
- Recomendação de makers/portfolios
- Recomendação de doações

## Entregáveis

| # | Entregável | Critério de aceite |
|---|------------|-------------------|
| 1 | Pipeline de embeddings | Vetores persistidos por produto |
| 2 | Two-tower model | Treina e exporta embeddings separados |
| 3 | Hybrid ranker | Combina content + CF + semantic |
| 4 | Cache layer | P95 latency < 100ms |
| 5 | Dashboard métricas | Admin vê CTR, conversão por source |

## Fases internas (3a, 3b, 3c)

### 3a — Embeddings semânticos (4 semanas)

- Gerar embedding por produto a partir de texto
- Armazenar em coluna JSON ou tabela `product_embedding`
- Similaridade semântica como sinal adicional no ranker
- Retreinar embeddings quando produto é editado

### 3b — Two-tower + colaborativo (6 semanas)

- User tower: histórico + demographics + embeddings médios
- Product tower: features numéricas + embedding semântico
- Score = dot product ou MLP sobre concat
- Item-item CF: "quem comprou X também comprou Y"

### 3c — Infra e escala (4 semanas)

- Pré-computar top-20 recomendações por usuário (job noturno)
- Cache Redis ou tabela `user_recommendation_cache`
- ANN (HNSW) se catálogo > 5000 — via pgvector ou serviço externo
- Feature flags para rollout gradual

## Cronograma macro

| Mês | Foco |
|-----|------|
| 1 | Embeddings + storage |
| 2 | Two-tower + treino |
| 3 | CF + hybrid ranker |
| 4 | Cache + métricas + A/B |

## Tarefas 3a — Embeddings

1. Escolher provider (ver spec)
2. Migration: `product_embedding vector(384)` ou `Json`
3. Job: embed novos/atualizados produtos
4. Função `semanticSimilarity(userEmbedding, productEmbedding)`
5. Peso no ranker final: `0.3 semantic + 0.4 ml + 0.3 content`

## Tarefas 3b — Two-tower

1. Refatorar encode em duas torres independentes
2. Loss: binary crossentropy ou BPR (Bayesian Personalized Ranking)
3. Exportar embeddings para serving
4. Item-item matrix a partir de co-ocorrência em pedidos

## Tarefas 3c — Infra

1. Tabela cache + TTL 24h
2. Cron: recomputar cache 02:00 UTC
3. Admin dashboard: gráficos CTR por `source`
4. Feature flag `recommendations_v3_enabled`

## Critérios de pronto

- [ ] NDCG@10 > Fase 2 em hold-out
- [ ] P95 API < 100ms (via cache)
- [ ] Embeddings atualizados em < 5min após edit product
- [ ] Rollback via feature flag testado

## Decisão: pular Fase 2?

| Cenário | Recomendação |
|---------|--------------|
| < 50 usuários com compras | Fase 1 + 3a (embeddings) |
| 50–500 usuários | Fase 2 → 3 |
| > 500 usuários, catálogo grande | Fase 1 → 3 direto se embeddings forem prioridade |

## Referência

- [Spec técnica](./spec.md)
- Two-tower: padrão YouTube DNN, Spotify, etc.
