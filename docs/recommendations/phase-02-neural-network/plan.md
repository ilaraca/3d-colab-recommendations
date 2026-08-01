# Fase 2 — Plano: Rede Neural no Backend

## Objetivo

Evoluir da similaridade de cosseno para um **modelo de classificação binária** (comprou / não comprou), portando o pipeline do demo TensorFlow.js para o servidor Node.js com `@tensorflow/tfjs-node`.

## Pré-requisitos

- [x] Fase 1 concluída e estável
- [ ] Volume mínimo de dados: **≥ 20 usuários** com pedidos concluídos **OU** **≥ 100 pares** (user, product) no dataset de treino
- [ ] Métricas baseline da Fase 1 registradas (CTR, tempo de resposta)

## Escopo

### Incluído

- [ ] Dependência `@tensorflow/tfjs-node`
- [ ] Módulos `training-data.ts`, `model.ts` em `lib/recommendations/`
- [ ] Treino com leave-one-out (corrige vazamento do demo)
- [ ] Persistência do modelo em disco ou object storage
- [ ] Job de retreino (script CLI ou API admin)
- [ ] API estendida: `source=ml` vs `source=content` (fallback)
- [ ] Logs de treino (loss, accuracy por época)
- [ ] Validação hold-out (80/20 por usuário)

### Fora de escopo

- Treino no browser (Web Worker)
- Embeddings de texto (Fase 3)
- Filtragem colaborativa user-user
- UI de treino para usuário final (apenas admin/dev)

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
npm install @tensorflow/tfjs-node
```

Adicionar script em `package.json`:

```json
"recommendations:train": "tsx src/scripts/train-recommendation-model.ts"
```

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
  → Dense 64, ReLU
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

- [ ] Modelo treina sem erro com dados de staging
- [ ] Val loss não diverge (> 2× train loss = revisar)
- [ ] Inferência < 500ms para catálogo < 500 produtos
- [ ] Fallback automático para Fase 1 se modelo não existir
- [ ] Leave-one-out implementado e testado
- [ ] Produtos comprados excluídos na inferência (igual Fase 1)

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
