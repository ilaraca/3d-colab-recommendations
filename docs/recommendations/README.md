# Sistema de Recomendações — 3D Colab

Documentação de planos e especificações técnicas para implementar recomendação de produtos no marketplace, inspirada no pipeline do exemplo **ecommerce-recomendations** (TensorFlow.js), adaptada para a stack do 3D Colab.

## Origem da ideia

O demo do curso implementa:

```
contexto → encode (produto/usuário) → dataset → treino → inferência → ranking
```

Este projeto reutiliza **o pipeline**, não o código literal (Web Worker + JSON). Os dados vêm do **Prisma/PostgreSQL** (`product`, `order`, `orderItem`, `purchase`, `review`).

## Fases de implementação

| Fase | Objetivo | Complexidade | Doc |
|------|----------|--------------|-----|
| **1** | MVP content-based (similaridade de cosseno) | Baixa | [Plano](./phase-01-content-based/plan.md) · [Spec](./phase-01-content-based/spec.md) |
| **2** | Rede neural no backend (`@tensorflow/tfjs-node`) | Média | [Plano](./phase-02-neural-network/plan.md) · [Spec](./phase-02-neural-network/spec.md) |
| **3** | Embeddings, two-tower, filtragem colaborativa | Alta | [Plano](./phase-03-advanced/plan.md) · [Spec](./phase-03-advanced/spec.md) |

Leia primeiro o [overview](./OVERVIEW.md) para entender o mapeamento de features e pontos de integração na UI.

## Ordem recomendada

1. Implementar **Fase 1** completa (API + UI + testes)
2. Coletar feedback e métricas básicas
3. Evoluir para **Fase 2** se houver volume suficiente de pedidos
4. Considerar **Fase 3** quando o catálogo e a base de usuários justificarem

## Estrutura de código alvo (visão consolidada)

```
src/
├── lib/recommendations/
│   ├── context.ts           # Estatísticas globais (min/max, índices)
│   ├── encode.ts            # Vetores de produto e usuário
│   ├── similarity.ts        # Fase 1: cosseno
│   ├── training-data.ts     # Fase 2: pares (user, product) + labels
│   ├── model.ts             # Fase 2: rede neural + treino
│   ├── recommend.ts         # Orquestração e ranking
│   └── types.ts             # Tipos compartilhados
├── app/api/recommendations/
│   └── route.ts             # GET recomendações
└── components/
    └── recommendations-section.tsx
```

## Referências internas

- [ARCHITECTURE.md](../ARCHITECTURE.md) — stack e camadas do projeto
- [marketplace-produtos.md](../../manuais/Regras/marketplace-produtos.md) — regras do marketplace
- [prisma/schema.prisma](../../prisma/schema.prisma) — models de dados

## Referência externa (curso)

Pipeline base: `modulo01-fundamentos-de-ia-e-llms-para-programadores/exemplo-01-ecommerce-recomendations-z/parte05-ecommerce-recomendations-with-tensorflow/src/workers/modelTrainingWorker.js`
