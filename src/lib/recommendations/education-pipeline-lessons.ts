import type { EducationTraceStep, MethodLesson } from './education-traces';

type LessonPhase = MethodLesson['phase'];

function lesson(
  id: string,
  phase: LessonPhase,
  method: string,
  file: string,
  purpose: string,
  steps: EducationTraceStep[]
): MethodLesson {
  return { id, phase, executionMode: 'illustrated', method, file, purpose, steps };
}

export function getPipelineLessons(): MethodLesson[] {
  return [
    lesson(
      'build-context',
      'dados',
      'buildContext',
      'src/lib/recommendations/context.ts',
      'Criar índices categóricos, limites numéricos e a dimensão fixa usada por todos os vetores.',
      [
        {
          id: 'indexes',
          title: 'Criar índices estáveis',
          code: `const categoriesIndex = buildIndex(products.map((p) => p.category));
const materialsIndex = buildIndex(products.map((p) => p.material));`,
          explanation:
            'Valores são normalizados, deduplicados e ordenados. O índice define a posição ocupada no one-hot.',
          variables: {
            categories: ['decorative', 'functional', 'toys'],
            materials: ['pla', 'abs', 'pla'],
          },
          output: {
            categoriesIndex: { decorative: 0, functional: 1, toys: 2 },
            materialsIndex: { abs: 0, pla: 1 },
          },
        },
        {
          id: 'ranges',
          title: 'Calcular limites numéricos',
          code: `const prices = products.map((p) => p.price);
const printTimes = products.map((p) => p.print_time);
const volumes = products.map(getVolume);
const weights = products.map((p) => p.weight);`,
          explanation:
            'Mínimos e máximos do catálogo serão usados por normalize para colocar grandezas diferentes na mesma escala.',
          variables: {
            prices: [80, 140, 50],
            printTimes: [240, 480, 150],
            volumes: [1000, 4000, 576],
            weights: [180, 420, 90],
          },
          output: {
            minPrice: 0,
            maxPrice: 140,
            minPrintTime: 0,
            maxPrintTime: 480,
            minVolume: 0,
            maxVolume: 4000,
            minWeight: 0,
            maxWeight: 420,
          },
        },
        {
          id: 'dimensions',
          title: 'Fixar a dimensão do vetor',
          code: 'dimensions: numericDims + numCategories + numMaterials',
          explanation:
            'São cinco features numéricas, uma posição por categoria e uma por material.',
          formula: '5 + 3 categorias + 2 materiais = 10 dimensões',
          variables: { numericDims: 5, numCategories: 3, numMaterials: 2 },
          output: { dimensions: 10, modelInputDimension: 20 },
        },
      ]
    ),
    lesson(
      'vector-math',
      'representacao',
      'normalize · oneHotWeighted · averageVectors',
      'src/lib/recommendations/similarity.ts',
      'Explicar as operações matemáticas reutilizadas pela codificação de produto e usuário.',
      [
        {
          id: 'normalize',
          title: 'Normalizar um número',
          code: 'return (value - min) / ((max - min) || 1);',
          explanation:
            'A distância até o mínimo é dividida pelo intervalo. O fallback 1 evita divisão por zero.',
          formula: '(80 − 0) / (140 − 0) = 0.5714',
          variables: { value: 80, min: 0, max: 140 },
          output: 0.5714,
        },
        {
          id: 'one-hot',
          title: 'Criar um one-hot ponderado',
          code: 'return Array.from({ length }, (_, i) => (i === index ? weight : 0));',
          explanation:
            'Somente a posição correspondente à categoria recebe o peso configurado.',
          variables: { index: 1, length: 3, weight: 0.35 },
          output: [0, 0.35, 0],
        },
        {
          id: 'average-vectors',
          title: 'Calcular a média dos vetores',
          code: `for (const vector of vectors) {
  for (let i = 0; i < length; i++) result[i] += vector[i];
}
return result.map((value) => value / vectors.length);`,
          explanation:
            'A soma ocorre posição por posição; depois cada total é dividido pela quantidade de compras.',
          variables: { vectors: [[0.1, 0.3], [0.3, 0.1]] },
          output: [0.2, 0.2],
        },
      ]
    ),
    lesson(
      'cold-start-leave-one-out',
      'dados',
      'encodeColdStartUser · encodeUserLeaveOneOut',
      'src/lib/recommendations/encode.ts · training-data.ts',
      'Tratar usuários sem histórico e impedir que a resposta do treino apareça na própria entrada.',
      [
        {
          id: 'remove-target',
          title: 'Excluir o produto rotulado',
          code: 'const filtered = purchases.filter((product) => product.id !== excludeProductId);',
          explanation:
            'No par usuário 1 × produto 101, o produto 101 é removido antes de formar o perfil.',
          variables: { purchaseIds: [101, 103], excludeProductId: 101 },
          output: { filteredPurchaseIds: [103] },
        },
        {
          id: 'neutral-vector',
          title: 'Gerar vetor neutro se necessário',
          code: `if (filtered.length === 0) {
  return encodeColdStartUser(context);
}`,
          explanation:
            'Se a compra excluída era a única, retorna um vetor de zeros com a dimensão correta.',
          variables: { filteredLength: 0, contextDimensions: 10 },
          output: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        {
          id: 'safe-profile',
          title: 'Codificar o histórico restante',
          code: 'return encodeUserFromPurchases(filtered, context)!;',
          explanation:
            'Com outras compras disponíveis, a média representa preferências sem incluir o produto que define o label.',
          variables: { filteredPurchaseIds: [103] },
          output: { profileUsesTargetProduct: false },
        },
      ]
    ),
    lesson(
      'split-by-user',
      'dados',
      'splitByUser',
      'src/lib/recommendations/training-data.ts',
      'Separar treino e validação por usuário para medir generalização sem vazamento entre conjuntos.',
      [
        {
          id: 'unique-users',
          title: 'Coletar usuários únicos',
          code: 'const userIds = [...new Set(examples.map((example) => example.userId))];',
          explanation:
            'A unidade do split é o usuário inteiro, não uma linha individual.',
          variables: { exampleUserIds: [1, 1, 1, 2, 2, 2] },
          output: { userIds: [1, 2] },
        },
        {
          id: 'seeded-shuffle',
          title: 'Ordenar com seed reproduzível',
          code: `const shuffled = [...userIds].sort((a, b) => {
  const hash = (value) => ((value * 9301 + 49297 + randomSeed) % 233280) / 233280;
  return hash(a) - hash(b);
});`,
          explanation:
            'A seed 42 mantém a demonstração reproduzível entre execuções.',
          variables: { randomSeed: 42, trainRatio: 0.8 },
          output: { shuffledUsers: [1, 2], splitIndex: 1 },
        },
        {
          id: 'partition',
          title: 'Particionar exemplos',
          code: `train: examples.filter((example) => trainUsers.has(example.userId)),
val: examples.filter((example) => !trainUsers.has(example.userId)),`,
          explanation:
            'Nenhum usuário da validação aparece no treino.',
          variables: { trainUsers: [1], validationUsers: [2] },
          output: { trainExamples: 3, validationExamples: 3, userLeakage: false },
        },
      ]
    ),
    lesson(
      'create-model',
      'treinamento',
      'getTensorFlow · createBrowserModel / createModel',
      'src/lib/recommendations/tensorflow.ts · browser-model.ts · model.ts',
      'Inicializar o TensorFlow.js e montar a arquitetura que converte 20 features em uma probabilidade.',
      [
        {
          id: 'backend',
          title: 'Inicializar o TensorFlow',
          code: `const tf = await import('@tensorflow/tfjs');
await tf.setBackend('cpu');
await tf.ready();`,
          explanation:
            'No laboratório, TensorFlow.js carrega no navegador e usa CPU. O servidor usa o adaptador disponível em getTensorFlow.',
          variables: { runtime: 'browser', requestedBackend: 'cpu' },
          output: { tensorflowReady: true },
        },
        {
          id: 'hidden-layers',
          title: 'Adicionar camadas ocultas',
          code: `model.add(tf.layers.dense({
  inputShape: [inputDim], units: 64, activation: 'relu',
  kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
}));
model.add(tf.layers.dropout({ rate: 0.2 }));
model.add(tf.layers.dense({ units: 32, activation: 'relu' }));`,
          explanation:
            'Dense aprende combinações entre features; ReLU adiciona não linearidade; L2 e Dropout reduzem memorização.',
          variables: { inputDim: 20 },
          output: {
            layers: ['Dense(20→64, ReLU, L2)', 'Dropout(20%)', 'Dense(64→32, ReLU)'],
          },
        },
        {
          id: 'output-compile',
          title: 'Criar saída e compilar',
          code: `model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
model.compile({
  optimizer: tf.train.adam(learningRate),
  loss: 'binaryCrossentropy',
  metrics: ['accuracy'],
});`,
          explanation:
            'Sigmoid produz score entre 0 e 1. Adam ajusta pesos para reduzir binary crossentropy.',
          variables: { learningRate: 0.01, target: 'label 0 ou 1' },
          output: { outputShape: [null, 1], scoreRange: [0, 1], compiled: true },
        },
      ]
    ),
    lesson(
      'train-model',
      'treinamento',
      'trainInBrowser / trainRecommendationModel',
      'src/lib/recommendations/browser-model.ts · model.ts',
      'Converter arrays em tensores, ajustar pesos por épocas, validar e parar quando o modelo deixa de melhorar.',
      [
        {
          id: 'tensors',
          title: 'Criar tensores',
          code: `const trainXs = tf.tensor2d(options.trainXs);
const trainYs = tf.tensor2d(options.trainYs.map((label) => [label]));
const valXs = tf.tensor2d(options.valXs);
const valYs = tf.tensor2d(options.valYs.map((label) => [label]));`,
          explanation:
            'Xs contêm vetores de entrada; Ys contêm os labels esperados em formato de coluna.',
          variables: { trainExamples: 3, validationExamples: 3, inputDimension: 20 },
          output: { trainXsShape: [3, 20], trainYsShape: [3, 1], valXsShape: [3, 20] },
        },
        {
          id: 'fit',
          title: 'Executar model.fit',
          code: `await model.fit(trainXs, trainYs, {
  epochs: options.epochs,
  batchSize: 32,
  shuffle: true,
  validationData: [valXs, valYs],
  callbacks: { onEpochEnd },
});`,
          explanation:
            'Cada época percorre o treino, calcula erros, atualiza pesos e mede o resultado nos usuários de validação.',
          variables: { epochs: 50, batchSize: 32, shuffle: true },
          output: {
            sampleEpochs: [
              { epoch: 1, loss: 0.69, valLoss: 0.71, valAccuracy: 0.67 },
              { epoch: 2, loss: 0.61, valLoss: 0.68, valAccuracy: 0.67 },
            ],
          },
        },
        {
          id: 'early-stopping',
          title: 'Aplicar early stopping',
          code: `if (lastLogs.valLoss < bestValLoss) {
  bestValLoss = lastLogs.valLoss;
  patienceCounter = 0;
} else if (++patienceCounter >= 5) {
  model.stopTraining = true;
}`,
          explanation:
            'Cinco épocas sem melhorar val_loss encerram o treino para limitar overfit.',
          variables: { bestValLoss: 0.62, recentValLosses: [0.63, 0.64, 0.66, 0.65, 0.67] },
          output: { patienceCounter: 5, stopTraining: true, epochsRun: 17 },
        },
        {
          id: 'dispose-training',
          title: 'Liberar tensores e retornar métricas',
          code: `trainXs.dispose();
trainYs.dispose();
valXs.dispose();
valYs.dispose();
return { finalTrainLoss, finalValLoss, finalValAcc, epochsRun, model };`,
          explanation:
            'dispose libera memória nativa/WebGL. O modelo treinado e as últimas métricas seguem para exportação.',
          variables: { tensorsInUse: 4 },
          output: { tensorsDisposed: 4, modelReady: true },
        },
      ]
    ),
    lesson(
      'export-upload',
      'persistencia',
      'exportModelArtifacts · uploadModelToServer',
      'src/lib/recommendations/browser-model.ts · api/learn/upload-model/route.ts',
      'Serializar o modelo treinado no navegador e enviá-lo com suas métricas ao servidor.',
      [
        {
          id: 'capture-artifacts',
          title: 'Capturar topologia e pesos',
          code: `const handler = tf.io.withSaveHandler(async (artifacts) => {
  captured = artifacts;
  return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
});
await model.save(handler);`,
          explanation:
            'O save handler intercepta o modelo em memória sem iniciar download de arquivo.',
          variables: { modelReady: true },
          output: { modelTopology: 'JSON', weightSpecs: 'manifesto', weightData: 'ArrayBuffer' },
        },
        {
          id: 'base64',
          title: 'Codificar pesos para JSON',
          code: `const weightDataBase64 =
  Buffer.from(artifacts.weightData as ArrayBuffer).toString('base64');`,
          explanation:
            'Os bytes binários são convertidos para Base64 para viajar no corpo JSON da requisição.',
          variables: { binaryWeights: '<ArrayBuffer>' },
          output: { weightDataBase64: '<texto Base64>' },
        },
        {
          id: 'post-model',
          title: 'Enviar modelo e métricas',
          code: `await fetch('/api/learn/upload-model', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...artifacts, trainExamples, valExamples, finalValAccuracy }),
});`,
          explanation:
            'O servidor recebe arquitetura, pesos e metadados suficientes para reproduzir a inferência.',
          variables: { endpoint: '/api/learn/upload-model', method: 'POST' },
          output: { payloadSent: true },
        },
      ]
    ),
    lesson(
      'save-load-model',
      'persistencia',
      'buildDefaultMetadata · saveModel / saveModelFromArtifacts · loadModel',
      'src/lib/recommendations/model-loader.ts',
      'Persistir model.json, weights.bin e metadata.json, depois carregar e reutilizar o modelo com cache.',
      [
        {
          id: 'metadata',
          title: 'Construir metadados',
          code: `const metadata = buildDefaultMetadata({
  version: \`browser-\${new Date().toISOString()}\`,
  trainedAt: new Date().toISOString(),
  trainExamples, valExamples, finalTrainLoss, finalValLoss,
  finalValAccuracy, inputDimension, epochsRun,
});`,
          explanation:
            'A versão associa uma recomendação às condições e métricas do treinamento que a produziu.',
          variables: { trainExamples: 3, valExamples: 3, epochsRun: 17 },
          output: { version: 'browser-<timestamp>', completedOrderStatusesIncluded: true },
        },
        {
          id: 'server-save',
          title: 'Salvar o modelo treinado no servidor',
          code: `const handler = await createSaveHandler(MODEL_DIR);
await model.save(handler);
await fs.writeFile(METADATA_PATH, JSON.stringify(metadata, null, 2));
cachedModel = model;
cachedMetadata = metadata;`,
          explanation:
            'No treino por CLI, saveModel serializa a instância treinada e já a mantém em cache para inferências posteriores.',
          variables: { origin: 'trainRecommendationModel', modelInMemory: true },
          output: { filesWritten: true, cacheUpdated: true },
        },
        {
          id: 'write-files',
          title: 'Gravar artefatos recebidos do browser',
          code: `await fs.writeFile(path.join(MODEL_DIR, 'model.json'), JSON.stringify(modelJson));
await fs.writeFile(path.join(MODEL_DIR, 'weights.bin'), options.weightData);
await fs.writeFile(METADATA_PATH, JSON.stringify(options.metadata, null, 2));`,
          explanation:
            'A topologia referencia weights.bin; metadata.json fica separado para status e rastreabilidade.',
          variables: { modelDirectory: 'models/recommendations/' },
          output: { files: ['model.json', 'weights.bin', 'metadata.json'] },
        },
        {
          id: 'load-cache',
          title: 'Carregar com cache',
          code: `if (cachedModel) return cachedModel;
if (loadPromise) return loadPromise;
const exists = await modelExists();
cachedModel = await tf.loadLayersModel(createLoadHandler(MODEL_DIR));`,
          explanation:
            'Cache evita ler arquivos e reconstruir a rede a cada requisição. loadPromise evita carregamentos concorrentes duplicados.',
          variables: { cachedModel: null, loadPromise: null, modelExists: true },
          output: { cachedModel: '<LayersModel>', metadataLoaded: true },
        },
      ]
    ),
    lesson(
      'predict-batch',
      'inferencia',
      'predictBatch',
      'src/lib/recommendations/model.ts',
      'Executar uma única inferência vetorizada para todos os produtos candidatos.',
      [
        {
          id: 'empty-batch',
          title: 'Tratar lote vazio',
          code: 'if (inputs.length === 0) return [];',
          explanation: 'Sem candidatos não é necessário alocar tensores nem executar a rede.',
          variables: { inputsLength: 2 },
          output: { continues: true },
        },
        {
          id: 'predict',
          title: 'Criar tensor e prever',
          code: `const inputTensor = tf.tensor2d(inputs);
const predictions = model.predict(inputTensor) as tfTypes.Tensor;
const scores = Array.from(await predictions.data());`,
          explanation:
            'Cada linha contém [vetor do usuário | vetor do produto]. O modelo devolve um score por linha.',
          variables: { inputsShape: [2, 20] },
          output: { predictionsShape: [2, 1], scores: [0.82, 0.37] },
        },
        {
          id: 'dispose-predict',
          title: 'Liberar memória de inferência',
          code: `inputTensor.dispose();
predictions.dispose();
return scores;`,
          explanation:
            'Os números JavaScript permanecem, mas os tensores temporários são descartados.',
          variables: { tensorCount: 2 },
          output: { tensorCount: 0, scores: [0.82, 0.37] },
        },
      ]
    ),
    lesson(
      'score-products-ml',
      'inferencia',
      'scoreProductsML',
      'src/lib/recommendations/ml-recommend.ts',
      'Filtrar candidatos, montar entradas, obter scores ML e produzir o ranking personalizado.',
      [
        {
          id: 'load-and-profile',
          title: 'Carregar modelo e perfil',
          code: `const model = await loadModel();
if (!model) throw new ModelNotFoundError();
const userVector = encodeUserFromPurchases(options.user.purchases, options.context);
if (!userVector) return [];`,
          explanation:
            'ML exige modelo disponível e usuário com histórico. Ausência de um deles aciona erro ou fallback.',
          variables: { modelAvailable: true, purchaseIds: [101, 103] },
          output: { userVectorDimensions: 10 },
        },
        {
          id: 'filter-candidates',
          title: 'Aplicar regras de negócio',
          code: `const candidates = options.products.filter(
  (product) =>
    !options.purchasedIds.has(product.id) &&
    product.user_id !== options.ownProductUserId &&
    !options.excludeIds.has(product.id)
);`,
          explanation:
            'Produtos já comprados, do próprio usuário ou explicitamente excluídos nunca chegam ao modelo.',
          variables: { allProductIds: [101, 102, 103], purchasedIds: [101, 103] },
          output: { candidateIds: [102] },
        },
        {
          id: 'batch-input',
          title: 'Montar entradas do lote',
          code: `const inputs = candidates.map((product) => {
  const productVector = encodeProduct(product, options.context);
  return [...userVector, ...productVector];
});`,
          explanation:
            'O mesmo perfil é concatenado ao vetor de cada candidato.',
          variables: { candidates: 1, userDimensions: 10, productDimensions: 10 },
          output: { batchShape: [1, 20] },
        },
        {
          id: 'rank-ml',
          title: 'Associar scores e ordenar',
          code: `return candidates
  .map((product, index) => ({ product, score: scores[index] ?? 0, vector: encodeProduct(product, context) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, options.limit);`,
          explanation:
            'O maior score aparece primeiro e o limite controla o tamanho da resposta.',
          variables: { scores: [0.82], limit: 12 },
          output: [{ productId: 102, score: 0.82 }],
        },
      ]
    ),
    lesson(
      'content-fallback',
      'inferencia',
      'cosineSimilarity · rankProductsContent',
      'src/lib/recommendations/similarity.ts · recommend.ts',
      'Explicar o algoritmo content-based e seu uso como fallback quando ML não está disponível.',
      [
        {
          id: 'cosine',
          title: 'Calcular similaridade de cosseno',
          code: `const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
return dot / ((magA * magB) || 1);`,
          explanation:
            'O cosseno mede alinhamento entre o perfil e o produto, independentemente do tamanho absoluto dos vetores.',
          variables: { profile: [0.2, 0.4], product: [0.1, 0.5] },
          output: { cosineSimilarity: 0.9648 },
        },
        {
          id: 'content-or-popular',
          title: 'Escolher score content ou popular',
          code: `if (referenceVector) {
  score = cosineSimilarity(referenceVector, vector);
} else {
  score = (product.purchaseCount ?? 0) / maxPurchaseCount;
}`,
          explanation:
            'Com perfil, usa similaridade; sem histórico, normaliza a popularidade do produto.',
          variables: { referenceVectorAvailable: true, purchaseCount: 4, maxPurchaseCount: 5 },
          output: { scoringSource: 'content', score: 0.9648 },
        },
        {
          id: 'content-sort',
          title: 'Ordenar o fallback',
          code: 'return scored.sort((a, b) => b.score - a.score).slice(0, limit);',
          explanation: 'O contrato de ranking é o mesmo do ML, facilitando a troca de algoritmo.',
          variables: { scores: [0.41, 0.96, 0.72], limit: 2 },
          output: [0.96, 0.72],
        },
      ]
    ),
    lesson(
      'recommend-orchestrator',
      'entrega',
      'getRecommendations',
      'src/lib/recommendations/recommend.ts',
      'Orquestrar modos popular, similar e personalizado, escolher ML ou content e formatar a resposta.',
      [
        {
          id: 'parse-options',
          title: 'Resolver opções',
          code: `const mode = options.mode ?? (options.userId ? 'personalized' : 'popular');
const source = options.source ?? 'auto';
const limit = clampLimit(options.limit);
const excludeIds = parseExcludeIds(options.excludeIds);`,
          explanation:
            'Defaults seguros escolhem personalização para usuário autenticado e popularidade para visitante.',
          variables: { userId: 1, source: 'auto', requestedLimit: 100 },
          output: { mode: 'personalized', source: 'auto', limit: 50 },
        },
        {
          id: 'resolve-mode',
          title: 'Construir referência do modo',
          code: `const history = await fetchUserPurchaseHistory(options.userId);
purchasedIds = history.purchasedProductIds;
purchasedProducts = history.purchasedProducts;
referenceVector = encodeUserFromPurchases(history.purchasedProducts, context);
if (!referenceVector) effectiveMode = 'popular';`,
          explanation:
            'No modo personalizado, o histórico gera o perfil. Sem compras, o modo efetivo muda para popular.',
          variables: { requestedMode: 'personalized', purchaseIds: [101, 103] },
          output: { effectiveMode: 'personalized', referenceVectorAvailable: true },
        },
        {
          id: 'choose-algorithm',
          title: 'Tentar ML e aplicar fallback',
          code: `if (canUseML) {
  try {
    ranked = await scoreProductsML(...);
    algorithm = 'ml';
  } catch (error) {
    if (source === 'ml') throw error;
  }
}
if (ranked.length === 0) ranked = rankProductsContent(...);`,
          explanation:
            'source=auto tenta ML e continua com content se necessário. source=ml explícito retorna erro quando o modelo falta.',
          variables: { effectiveMode: 'personalized', source: 'auto', modelAvailable: true },
          output: { algorithm: 'ml', fallbackUsed: false },
        },
        {
          id: 'response',
          title: 'Formatar itens e metadados',
          code: `return {
  items: ranked.map(toResponseItem),
  meta: {
    mode: effectiveMode,
    source: resolveAlgorithmSource(effectiveMode, algorithm),
    modelVersion: metadata?.version,
    totalCandidates: products.length,
    generatedAt: new Date().toISOString(),
  },
};`,
          explanation:
            'A resposta informa tanto os produtos quanto a origem do ranking, permitindo auditoria na UI.',
          variables: { rankedItems: 1, algorithm: 'ml', products: 3 },
          output: {
            items: [{ id: 102, score: 0.82 }],
            meta: { mode: 'personalized', source: 'ml', modelVersion: 'browser-<timestamp>' },
          },
        },
      ]
    ),
    lesson(
      'training-entry-points',
      'treinamento',
      'CLI de treino / TrainingPlayground',
      'src/scripts/train-recommendation-model.ts · components/learn/training-playground.tsx',
      'Conectar as peças do treinamento nos dois entry points suportados: terminal e navegador.',
      [
        {
          id: 'server-cli',
          title: 'Executar o pipeline pelo terminal',
          code: `const { users, products, context } = await loadTrainingDataFromPrisma();
const { examples, inputDim } = createTrainingData(users, products, context);
const { train, val } = splitByUser(examples);
const result = await trainRecommendationModel({ trainXs, trainYs, valXs, valYs });
await saveModel(result.model, metadata);`,
          explanation:
            'npm run recommendations:train executa todo o treinamento no servidor e salva o modelo diretamente.',
          variables: { command: 'npm run recommendations:train', runtime: 'Node.js' },
          output: { destination: 'models/recommendations/', marketplaceReady: true },
        },
        {
          id: 'browser-playground',
          title: 'Executar o pipeline no navegador',
          code: `const trainResult = await trainInBrowser({
  trainXs: dataset.train.map((example) => example.input),
  trainYs: dataset.train.map((example) => example.label),
  valXs: dataset.val.map((example) => example.input),
  valYs: dataset.val.map((example) => example.label),
  epochs,
  learningRate,
  onEpochEnd,
});`,
          explanation:
            'O playground recebe o dataset da API, treina localmente e atualiza os gráficos a cada época.',
          variables: { runtime: 'browser', datasetEndpoint: '/api/learn/dataset' },
          output: { trainedModel: '<LayersModel>', epochChartUpdated: true },
        },
        {
          id: 'apply-browser-model',
          title: 'Aplicar o modelo do playground',
          code: `await uploadModelToServer({
  model: trainedModel,
  trainExamples,
  valExamples,
  finalTrainLoss,
  finalValLoss,
  finalValAccuracy,
  inputDimension,
  epochsRun,
});`,
          explanation:
            'O botão Aplicar no marketplace liga o caminho de treino no browser ao mesmo armazenamento usado em produção.',
          variables: { userAction: 'Aplicar no marketplace' },
          output: { uploaded: true, recommendationsCanUseML: true },
        },
      ]
    ),
    lesson(
      'recommendations-api',
      'entrega',
      'GET /api/recommendations',
      'src/app/api/recommendations/route.ts',
      'Receber a requisição HTTP, identificar o usuário, validar parâmetros e devolver o ranking ao marketplace.',
      [
        {
          id: 'http-params',
          title: 'Ler e validar parâmetros',
          code: `const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
const source = sourceParam && VALID_SOURCES.includes(sourceParam) ? sourceParam : undefined;
const productId = searchParams.get('productId') ? parseInt(searchParams.get('productId')!, 10) : undefined;`,
          explanation:
            'A API aceita modo, fonte, produto de referência, exclusões e limite.',
          variables: { url: '/api/recommendations?source=ml&limit=12' },
          output: { source: 'ml', limit: 12 },
        },
        {
          id: 'session',
          title: 'Resolver identidade',
          code: `const session = await getServerSession(authOptions);
const userId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;`,
          explanation:
            'A personalização usa a sessão do servidor; o cliente não escolhe livremente outro userId.',
          variables: { sessionUserId: '1' },
          output: { userId: 1 },
        },
        {
          id: 'call-service',
          title: 'Executar o serviço',
          code: `const result = await getRecommendations({
  userId,
  mode: mode ?? (userId ? 'personalized' : 'popular'),
  source, productId, limit, excludeIds,
});
return NextResponse.json(result);`,
          explanation:
            'A rota apenas traduz HTTP para o serviço de domínio e devolve seu contrato JSON.',
          variables: { authenticated: true, requestedSource: 'ml' },
          output: { status: 200, responseSource: 'ml' },
        },
        {
          id: 'api-errors',
          title: 'Traduzir indisponibilidade do modelo',
          code: `if (error instanceof ModelNotFoundError) {
  return NextResponse.json(
    { error: 'ML recommendation model is not available.' },
    { status: 503 }
  );
}`,
          explanation:
            'Quando ML foi exigido explicitamente e não existe modelo, a API informa indisponibilidade em vez de fingir que usou ML.',
          variables: { requestedSource: 'ml', modelAvailable: false },
          output: { status: 503, fallbackHidden: false },
        },
      ]
    ),
    lesson(
      'learn-facades',
      'entrega',
      'getLearn* · /api/learn/*',
      'src/lib/recommendations/learn-data.ts · src/app/api/learn/',
      'Expor o mesmo pipeline real em formatos seguros e legíveis para as telas do laboratório.',
      [
        {
          id: 'dataset-facade',
          title: 'Preparar o dataset para o playground',
          code: `const { users, products, context } = await loadTrainingDataFromPrisma();
const { examples, inputDim } = createTrainingData(users, products, context);
const { train, val } = splitByUser(examples);
return { inputDim, featureLabels, stats, train, val };`,
          explanation:
            'getLearnDataset reutiliza o pipeline de treino e acrescenta labels e estatísticas para visualização.',
          variables: { route: '/api/learn/dataset' },
          output: { dataset: true, stats: true, featureLabels: true },
        },
        {
          id: 'inspection-facades',
          title: 'Expor vetores, pares e status',
          code: `getLearnVectors(email);
getLearnTrainingPairs(limit);
getLearnModelStatus();
getLearnDemoUsers();`,
          explanation:
            'Essas facades não criam outro algoritmo; apenas formatam vetores, exemplos, personas e metadados existentes.',
          variables: {
            routes: [
              '/api/learn/vectors',
              '/api/learn/training-pairs',
              '/api/learn/model-status',
              '/api/learn/demo-users',
            ],
          },
          output: { reusablePipeline: true },
        },
        {
          id: 'safe-demo-ranking',
          title: 'Comparar rankings com personas permitidas',
          code: `const userId = await resolveDemoUserId(email);
const result = await getRecommendations({
  userId,
  mode: 'personalized',
  source,
  limit,
});`,
          explanation:
            'A API educacional restringe emails às personas demo e chama exatamente o mesmo getRecommendations da produção.',
          variables: { route: '/api/learn/recommendations', email: 'maria@demo.com' },
          output: { usesProductionOrchestrator: true, arbitraryUserAccess: false },
        },
      ]
    ),
    lesson(
      'ui-consumers',
      'entrega',
      'RecommendationsSection · SimilarProducts · componentes do lab',
      'src/components/recommendations-section.tsx · similar-products.tsx · components/learn/',
      'Fechar o fluxo mostrando como marketplace, produto e laboratório consomem e apresentam os resultados.',
      [
        {
          id: 'marketplace-fetch',
          title: 'Buscar recomendações no marketplace',
          code: `const response = await fetch(
  \`/api/recommendations?limit=\${limit}&source=\${sourceToggle}\`
);
const data = await response.json();
setItems(data.items ?? []);
setMode(data.meta?.mode ?? 'popular');
setSource(data.meta?.source);`,
          explanation:
            'RecommendationsSection permite Auto, Content, ML ou ambos e preserva na UI a origem informada pela API.',
          variables: { sourceToggle: 'auto', authenticated: true },
          output: { section: 'Recomendados para você', algorithmLabelVisible: true },
        },
        {
          id: 'product-similar',
          title: 'Buscar produtos similares',
          code: `fetch(
  \`/api/recommendations?mode=similar&productId=\${productId}&limit=\${limit}\`
);`,
          explanation:
            'Na página do produto, o próprio produto vira referência vetorial e é excluído do resultado.',
          variables: { productId: 101, limit: 4 },
          output: { mode: 'similar', component: 'SimilarProducts' },
        },
        {
          id: 'render-cards',
          title: 'Renderizar o ranking',
          code: `items.map((item) => (
  <ProductCard key={item.id} product={{ ...item, score: item.score }} />
));`,
          explanation:
            'A ordenação já veio do domínio. A UI apenas transforma cada item ranqueado em um card de produto.',
          variables: { itemsOrderedByScore: true },
          output: { endToEndComplete: true, visibleToUser: true },
        },
      ]
    ),
  ];
}
