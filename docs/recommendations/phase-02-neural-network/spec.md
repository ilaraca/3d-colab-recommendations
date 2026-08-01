# Fase 2 — Spec Técnica: Rede Neural no Backend

## 1. Dependências

```json
{
  "dependencies": {
    "@tensorflow/tfjs-node": "^4.22.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

> **Nota Vercel:** `@tensorflow/tfjs-node` pode exigir build em ambiente com native bindings. Alternativa: treinar em máquina local/CI e fazer upload do modelo para Cloudinary/S3; inferência com `@tensorflow/tfjs` ( WASM ) no serverless.

---

## 2. Arquitetura do modelo

### Input

Concatenação `[userVector, productVector]` — reutiliza `encode.ts` da Fase 1.

```
inputDimension = context.dimensions * 2
```

### Layers

```typescript
import * as tf from '@tensorflow/tfjs-node';

function createModel(inputDim: number): tf.Sequential {
  const model = tf.sequential();

  model.add(tf.layers.dense({
    inputShape: [inputDim],
    units: 64,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
  }));

  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid',
  }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}
```

---

## 3. Dataset — Leave-one-out

### Problema do demo original

No demo, `encodeUser` inclui **todos** os produtos comprados ao rotular um positivo — vazamento de dados.

### Correção

```typescript
function encodeUserLeaveOneOut(
  purchases: RecommendationProduct[],
  excludeProductId: number,
  context: RecommendationContext
): number[] {
  const filtered = purchases.filter(p => p.id !== excludeProductId);

  if (filtered.length === 0) {
    // Usuário só comprou este produto — usar vetor "cold" mínimo
    return encodeColdStartUser(context);
  }

  return encodeUserFromPurchases(filtered, context)!;
}
```

### Geração de pares

```typescript
interface TrainingExample {
  input: number[];   // [...userVector, ...productVector]
  label: number;     // 0 | 1
  userId: number;
}

function createTrainingData(
  users: UserWithPurchases[],
  products: RecommendationProduct[],
  context: RecommendationContext
): { examples: TrainingExample[]; inputDim: number } {
  const examples: TrainingExample[] = [];

  for (const user of users) {
    const purchasedIds = new Set(user.purchases.map(p => p.id));

    for (const product of products) {
      const userVector = encodeUserLeaveOneOut(
        user.purchases,
        product.id,
        context
      );
      const productVector = encodeProduct(product, context);
      const label = purchasedIds.has(product.id) ? 1 : 0;

      examples.push({
        input: [...userVector, ...productVector],
        label,
        userId: user.id,
      });
    }
  }

  return {
    examples,
    inputDim: context.dimensions * 2,
  };
}
```

### Split por usuário

```typescript
function splitByUser(
  examples: TrainingExample[],
  trainRatio = 0.8
): { train: TrainingExample[]; val: TrainingExample[] } {
  const userIds = [...new Set(examples.map(e => e.userId))];
  const shuffled = userIds.sort(() => Math.random() - 0.5);
  const splitIdx = Math.floor(shuffled.length * trainRatio);
  const trainUsers = new Set(shuffled.slice(0, splitIdx));

  return {
    train: examples.filter(e => trainUsers.has(e.userId)),
    val: examples.filter(e => !trainUsers.has(e.userId)),
  };
}
```

---

## 4. Treino

```typescript
// src/lib/recommendations/model.ts

export async function trainRecommendationModel(options: {
  trainXs: tf.Tensor2D;
  trainYs: tf.Tensor2D;
  valXs: tf.Tensor2D;
  valYs: tf.Tensor2D;
  epochs?: number;
  onEpochEnd?: (epoch: number, logs: tf.Logs) => void;
}): Promise<tf.LayersModel> {
  const model = createModel(options.trainXs.shape[1]!);

  await model.fit(options.trainXs, options.trainYs, {
    epochs: options.epochs ?? 50,
    batchSize: 32,
    shuffle: true,
    validationData: [options.valXs, options.valYs],
    callbacks: {
      onEpochEnd: (epoch, logs) => options.onEpochEnd?.(epoch, logs ?? {}),
      earlyStopping: {
        monitor: 'val_loss',
        patience: 5,
      },
    },
  });

  return model;
}
```

### Script CLI

```typescript
// src/scripts/train-recommendation-model.ts

async function main() {
  const { users, products, context } = await loadTrainingDataFromPrisma();
  const { examples, inputDim } = createTrainingData(users, products, context);
  const { train, val } = splitByUser(examples);

  const trainXs = tf.tensor2d(train.map(e => e.input));
  const trainYs = tf.tensor2d(train.map(e => [e.label]));
  const valXs = tf.tensor2d(val.map(e => e.input));
  const valYs = tf.tensor2d(val.map(e => [e.label]));

  const model = await trainRecommendationModel({
    trainXs, trainYs, valXs, valYs,
    onEpochEnd: (epoch, logs) => {
      console.log(`Epoch ${epoch}: loss=${logs.loss}, val_loss=${logs.val_loss}`);
    },
  });

  await model.save(`file://./models/recommendations`);
  await saveMetadata({ trainedAt: new Date(), trainSize: train.length, valSize: val.length });

  trainXs.dispose();
  trainYs.dispose();
  valXs.dispose();
  valYs.dispose();
}
```

---

## 5. Inferência

```typescript
// src/lib/recommendations/ml-recommend.ts

let cachedModel: tf.LayersModel | null = null;

export async function loadModel(): Promise<tf.LayersModel | null> {
  if (cachedModel) return cachedModel;
  try {
    cachedModel = await tf.loadLayersModel('file://./models/recommendations/model.json');
    return cachedModel;
  } catch {
    return null;
  }
}

export async function scoreProductsML(options: {
  user: UserWithPurchases;
  products: RecommendationProduct[];
  context: RecommendationContext;
  purchasedIds: Set<number>;
  limit: number;
}): Promise<ScoredProduct[]> {
  const model = await loadModel();
  if (!model) throw new Error('Model not found');

  const userVector = encodeUserFromPurchases(options.user.purchases, options.context);
  if (!userVector) return [];

  const candidates = options.products.filter(
    p => !options.purchasedIds.has(p.id) && p.user_id !== options.user.id
  );

  const inputs = candidates.map(product => {
    const productVector = encodeProduct(product, options.context);
    return [...userVector, ...productVector];
  });

  const inputTensor = tf.tensor2d(inputs);
  const predictions = model.predict(inputTensor) as tf.Tensor;
  const scores = await predictions.data();

  inputTensor.dispose();
  predictions.dispose();

  return candidates
    .map((product, i) => ({
      product,
      score: scores[i],
      vector: encodeProduct(product, options.context),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit);
}
```

---

## 6. API — extensão

### Query param `source`

| Valor | Comportamento |
|-------|---------------|
| `auto` (default) | Tenta ML; fallback content-based |
| `ml` | Só ML; 503 se modelo indisponível |
| `content` | Fase 1 |

### Response meta estendido

```typescript
meta: {
  mode: 'personalized';
  source: 'ml' | 'content' | 'popular';
  modelVersion?: string;  // de metadata.json
  // ...
}
```

---

## 7. Persistência — metadata.json

```typescript
interface ModelMetadata {
  version: string;           // semver ou timestamp
  trainedAt: string;
  trainExamples: number;
  valExamples: number;
  finalTrainLoss: number;
  finalValLoss: number;
  finalValAccuracy: number;
  inputDimension: number;
  completedOrderStatuses: string[];
}
```

---

## 8. Retreino

| Trigger | Método |
|---------|--------|
| Manual | `npm run recommendations:train` |
| Scheduled | GitHub Action cron semanal |
| Pós-deploy | Hook opcional se `MODEL_AUTO_TRAIN=true` |

**Regra:** não retreinar em todo request — apenas batch.

---

## 9. Testes

### Unitários

| Arquivo | Casos |
|---------|-------|
| `training-data.test.ts` | Leave-one-out exclui produto correto; labels 0/1 |
| `split.test.ts` | Nenhum userId aparece em train e val |
| `model.test.ts` | Modelo compila; predict shape [N, 1] |

### Integração

| Caso | Assert |
|------|--------|
| Sem modelo + `source=auto` | Retorna content-based, `source: content` |
| Com modelo + `source=ml` | Retorna scores, `source: ml` |
| `source=ml` sem modelo | 503 |

---

## 10. Estrutura de arquivos (delta sobre Fase 1)

```
src/lib/recommendations/
├── ... (Fase 1)
├── training-data.ts
├── model.ts
├── ml-recommend.ts
└── model-loader.ts

src/scripts/
└── train-recommendation-model.ts

models/recommendations/          # gitignore (exceto .gitkeep)
├── .gitkeep
├── model.json                   # gerado
├── weights.bin                  # gerado
└── metadata.json                # gerado
```

### .gitignore

```
models/recommendations/*
!models/recommendations/.gitkeep
```

---

## 11. Checklist

```
[ ] Instalar @tensorflow/tfjs-node
[ ] training-data.ts com leave-one-out
[ ] model.ts
[ ] ml-recommend.ts + model-loader.ts
[ ] train-recommendation-model.ts
[ ] Estender API com source=auto|ml|content
[ ] metadata.json
[ ] Testes
[ ] Documentar npm run recommendations:train no README
[ ] Validar métricas vs baseline Fase 1
```
