# Fase 2 — Plano: Rede Neural no Backend

## Objetivo

Evoluir da similaridade de cosseno para um **modelo de classificação binária** (comprou / não comprou), com treino no **servidor** (`npm run recommendations:train`) e no **navegador** (laboratório `/learn`), usando `@tensorflow/tfjs` (com `@tensorflow/tfjs-node` opcional para acelerar).

## Pré-requisitos

- [x] Fase 1 concluída e estável
- [ ] Volume mínimo de dados: **≥ 20 usuários** com pedidos concluídos **OU** **≥ 100 pares** (user, product) no dataset de treino
- [ ] Métricas baseline da Fase 1 registradas (CTR, tempo de resposta)

## Escopo

### Incluído

- [x] Dependência `@tensorflow/tfjs` (+ `@tensorflow/tfjs-node` opcional via `TFJS_USE_NODE=1`)
- [x] Módulos `training-data.ts`, `model.ts`, `ml-recommend.ts`, `model-loader.ts`, `browser-model.ts`
- [x] Treino com leave-one-out (corrige vazamento do demo)
- [x] Persistência do modelo em disco (`models/recommendations/`)
- [x] Job de retreino (`npm run recommendations:train`)
- [x] API estendida: `source=auto|ml|content|both`
- [x] Logs de treino (loss, accuracy por época)
- [x] Validação hold-out (80/20 por usuário)
- [x] Laboratório `/learn`: treino no browser + upload via `POST /api/learn/upload-model`

### Fora de escopo

- Embeddings de texto (Fase 3)
- Filtragem colaborativa user-user

## Entregáveis

| # | Entregável | Critério de aceite |
|---|------------|-------------------|
| 1 | Dataset builder | Gera `xs`, `ys` a partir do Prisma; leave-one-out |
| 2 | Modelo treinado | Arquivo salvo; carregável na inferência |
| 3 | Script de treino | `npm run recommendations:train` |
| 4 | Inferência | API usa ML quando modelo existe; fallback content-based |
| 5 | Validação | Loss de validação documentada; sem overfit extremo |

## Cronograma sugerido

| Semana | Atividade |
|--------|-----------|
| 1 | `training-data.ts` + testes; leave-one-out |
| 2 | `model.ts` — arquitetura, compile, fit |
| 3 | Persistência + script CLI + carregamento na API |
| 4 | Validação, tuning hiperparâmetros, documentação |

## Tarefas detalhadas

### 1. Setup

```bash
npm install @tensorflow/tfjs
# Opcional — acelera treino no Node:
npm install @tensorflow/tfjs-node
```

Adicionar script em `package.json`:

```json
"recommendations:train": "tsx src/scripts/train-recommendation-model.ts"
```

> O projeto usa `src/lib/recommendations/tensorflow.ts` para escolher entre `@tensorflow/tfjs` (padrão) e `@tensorflow/tfjs-node` (`TFJS_USE_NODE=1`).

### 2. Dataset (port do `createTrainingData`)

1. Para cada usuário com compras:
   - Para cada produto do catálogo:
     - Vetor usuário = encode **sem** o produto sendo rotulado (leave-one-out)
     - Vetor produto = encode normal
     - Label = 1 se comprou, 0 se não
2. Split 80/20 **por usuário** (não por par aleatório)
3. Negative sampling opcional: max 5 negativos por positivo se dataset > 10k pares

### 3. Modelo (port do `configureNeuralNetAndTrain`)

Arquitetura inicial (ajustável):

```
Input (userVector + productVector)
  → Dense 64, ReLU, L2 (0.01)
  → Dropout 0.2
  → Dense 32, ReLU
  → Dense 1, Sigmoid
```

> Rede **menor** que o demo (128→64→32) por causa do volume de dados esperado.

Hiperparâmetros iniciais:

| Param | Valor |
|-------|-------|
| Optimizer | Adam 0.01 |
| Loss | binaryCrossentropy |
| Epochs | 50 (com early stopping) |
| Batch size | 32 |
| Early stopping | patience 5, monitor val_loss |

### 4. Persistência

```
models/recommendations/
├── model.json
├── weights.bin
└── metadata.json    # data do treino, métricas, versão
```

Carregar na inicialização da API ou lazy load no primeiro request.

### 5. API estendida

```
GET /api/recommendations?source=auto   # tenta ML, fallback content
GET /api/recommendations?source=ml     # força ML; 503 se modelo ausente
GET /api/recommendations?source=content # Fase 1
```

### 6. Admin / Dev

- Script `train-recommendation-model.ts` — roda local ou CI scheduled
- Log de métricas no console + salva em `metadata.json`
- Opcional: endpoint `POST /api/admin/recommendations/train` (protegido, role admin)

## Critérios de pronto

- [x] Modelo treina sem erro com dados de staging
- [x] Val loss monitorada; early stopping com patience 5
- [x] Inferência < 500ms para catálogo < 500 produtos
- [x] Fallback automático para Fase 1 se modelo não existir
- [x] Leave-one-out implementado e testado
- [x] Produtos comprados excluídos na inferência (igual Fase 1)
- [ ] Validar métricas vs baseline Fase 1 (Precision@K em staging)

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Poucos dados → overfit | Rede pequena; dropout 0.2; early stopping |
| tfjs-node no Vercel | Treinar em CI/cron externo; servir modelo do storage |
| Cold start | Manter fallback content-based da Fase 1 |

## Métricas de avaliação

| Métrica | Alvo |
|---------|------|
| Precision@5 | > baseline Fase 1 |
| Recall@10 | > baseline Fase 1 |
| AUC-ROC (hold-out) | > 0.65 |

## Próximo passo

Após estabilizar Fase 2 com dados reais, avaliar [Fase 3](../phase-03-advanced/plan.md) se catálogo > 1000 produtos ou descriptions forem ricas.

## Referência

- [Spec técnica](./spec.md)
- Demo original: `modelTrainingWorker.js` (parte05)
