import { COMPLETED_ORDER_STATUSES, FEATURE_WEIGHTS } from './constants';
import { buildContext, getCategoryIndex, getMaterialIndex } from './context';
import { getPipelineLessons } from './education-pipeline-lessons';
import { encodeProduct, encodeUserFromPurchases } from './encode';
import { averageVectors, normalize, oneHotWeighted } from './similarity';
import { createTrainingData, encodeUserLeaveOneOut } from './training-data';
import type { RecommendationProduct, UserWithPurchases } from './types';

export interface EducationTraceStep {
  id: string;
  title: string;
  code: string;
  explanation: string;
  formula?: string;
  variables: Record<string, unknown>;
  output: unknown;
}

export interface MethodLesson {
  id: string;
  phase: 'dados' | 'representacao' | 'treinamento' | 'persistencia' | 'inferencia' | 'entrega';
  executionMode?: 'real' | 'illustrated';
  method: string;
  file: string;
  purpose: string;
  steps: EducationTraceStep[];
}

const PRODUCTS: RecommendationProduct[] = [
  {
    id: 101,
    title: 'Vaso geométrico',
    description: 'Vaso decorativo em PLA',
    category: 'decorative',
    material: 'pla',
    price: 80,
    width: 10,
    height: 20,
    depth: 5,
    weight: 180,
    print_time: 240,
    user_id: 10,
    avgRating: 4.5,
  },
  {
    id: 102,
    title: 'Suporte para notebook',
    description: 'Suporte funcional resistente',
    category: 'functional',
    material: 'abs',
    price: 140,
    width: 25,
    height: 8,
    depth: 20,
    weight: 420,
    print_time: 480,
    user_id: 11,
    avgRating: 4,
  },
  {
    id: 103,
    title: 'Miniatura articulada',
    description: 'Miniatura colecionável',
    category: 'toys',
    material: 'pla',
    price: 50,
    width: 8,
    height: 12,
    depth: 6,
    weight: 90,
    print_time: 150,
    user_id: 12,
    avgRating: 5,
  },
];

const USERS: UserWithPurchases[] = [
  { id: 1, purchases: [PRODUCTS[0], PRODUCTS[2]] },
  { id: 2, purchases: [PRODUCTS[1]] },
];

function rounded(value: number): number {
  return Number(value.toFixed(4));
}

function roundedVector(vector: number[]): number[] {
  return vector.map(rounded);
}

function createEncodeProductLesson(): MethodLesson {
  const product = PRODUCTS[0];
  const context = buildContext(PRODUCTS);
  const volume = product.width * product.height * product.depth;
  const avgRating = product.avgRating ?? 0.5;
  const numeric = [
    normalize(product.price, context.minPrice, context.maxPrice) * FEATURE_WEIGHTS.price,
    normalize(avgRating, 0, 5) * FEATURE_WEIGHTS.avgRating,
    normalize(product.print_time, context.minPrintTime, context.maxPrintTime) *
      FEATURE_WEIGHTS.printTime,
    normalize(volume, context.minVolume, context.maxVolume) * FEATURE_WEIGHTS.volume,
    normalize(product.weight, context.minWeight, context.maxWeight) * FEATURE_WEIGHTS.weight,
  ];
  const categoryIndex = getCategoryIndex(context, product.category);
  const materialIndex = getMaterialIndex(context, product.material);
  const categoryOneHot = oneHotWeighted(
    categoryIndex,
    context.numCategories,
    FEATURE_WEIGHTS.category
  );
  const materialOneHot = oneHotWeighted(
    materialIndex,
    context.numMaterials,
    FEATURE_WEIGHTS.material
  );
  const result = encodeProduct(product, context);

  return {
    id: 'encode-product',
    phase: 'representacao',
    method: 'encodeProduct',
    file: 'src/lib/recommendations/encode.ts',
    purpose: 'Transformar os atributos de um produto em um vetor numérico comparável.',
    steps: [
      {
        id: 'volume',
        title: 'Calcular o volume',
        code: 'const volume = product.width * product.height * product.depth;',
        explanation:
          'As três dimensões físicas viram uma única feature. Isso permite comparar o tamanho dos produtos.',
        formula: `${product.width} × ${product.height} × ${product.depth} = ${volume}`,
        variables: {
          width: product.width,
          height: product.height,
          depth: product.depth,
        },
        output: { volume },
      },
      {
        id: 'rating',
        title: 'Resolver a avaliação',
        code: 'const avgRating = product.avgRating ?? 0.5;',
        explanation:
          'Quando existe avaliação, ela é usada. O operador ?? só aplica 0.5 se o valor estiver ausente.',
        variables: { 'product.avgRating': product.avgRating, fallback: 0.5 },
        output: { avgRating },
      },
      {
        id: 'numeric',
        title: 'Normalizar e ponderar features numéricas',
        code: `const numeric = [
  normalize(product.price, context.minPrice, context.maxPrice) * FEATURE_WEIGHTS.price,
  normalize(avgRating, 0, 5) * FEATURE_WEIGHTS.avgRating,
  normalize(product.print_time, context.minPrintTime, context.maxPrintTime) * FEATURE_WEIGHTS.printTime,
  normalize(volume, context.minVolume, context.maxVolume) * FEATURE_WEIGHTS.volume,
  normalize(product.weight, context.minWeight, context.maxWeight) * FEATURE_WEIGHTS.weight,
];`,
        explanation:
          'Cada número é colocado na escala 0–1 e multiplicado pelo peso de negócio da feature.',
        formula: 'normalizado = (valor − mínimo) / (máximo − mínimo); saída = normalizado × peso',
        variables: {
          price: {
            value: product.price,
            min: context.minPrice,
            max: context.maxPrice,
            weight: FEATURE_WEIGHTS.price,
          },
          avgRating: { value: avgRating, min: 0, max: 5, weight: FEATURE_WEIGHTS.avgRating },
          printTime: {
            value: product.print_time,
            min: context.minPrintTime,
            max: context.maxPrintTime,
            weight: FEATURE_WEIGHTS.printTime,
          },
          volume: {
            value: volume,
            min: context.minVolume,
            max: context.maxVolume,
            weight: FEATURE_WEIGHTS.volume,
          },
          weight: {
            value: product.weight,
            min: context.minWeight,
            max: context.maxWeight,
            weight: FEATURE_WEIGHTS.weight,
          },
        },
        output: { numeric: roundedVector(numeric) },
      },
      {
        id: 'one-hot',
        title: 'Codificar categoria e material',
        code: `const categoryOneHot = oneHotWeighted(categoryIndex, context.numCategories, FEATURE_WEIGHTS.category);
const materialOneHot = oneHotWeighted(materialIndex, context.numMaterials, FEATURE_WEIGHTS.material);`,
        explanation:
          'One-hot reserva uma posição para cada opção. Só a posição do produto recebe o peso; as demais recebem zero.',
        variables: {
          category: product.category,
          categoryIndex,
          categoriesIndex: context.categoriesIndex,
          material: product.material,
          materialIndex,
          materialsIndex: context.materialsIndex,
        },
        output: {
          categoryOneHot: roundedVector(categoryOneHot),
          materialOneHot: roundedVector(materialOneHot),
        },
      },
      {
        id: 'concatenate',
        title: 'Concatenar o vetor final',
        code: 'return [...numeric, ...categoryOneHot, ...materialOneHot];',
        explanation:
          'As features numéricas, a categoria e o material são colocados em uma única sequência de dimensão fixa.',
        variables: {
          numericDimensions: numeric.length,
          categoryDimensions: categoryOneHot.length,
          materialDimensions: materialOneHot.length,
        },
        output: { vector: roundedVector(result), dimensions: result.length },
      },
    ],
  };
}

function createEncodeUserLesson(): MethodLesson {
  const context = buildContext(PRODUCTS);
  const purchases = USERS[0].purchases;
  const vectors = purchases.map((product) => encodeProduct(product, context));
  const average = averageVectors(vectors);
  const result = encodeUserFromPurchases(purchases, context);

  return {
    id: 'encode-user',
    phase: 'representacao',
    method: 'encodeUserFromPurchases',
    file: 'src/lib/recommendations/encode.ts',
    purpose: 'Resumir o histórico de compras em um único vetor de preferências.',
    steps: [
      {
        id: 'cold-start-check',
        title: 'Verificar se existe histórico',
        code: 'if (purchasedProducts.length === 0) return null;',
        explanation:
          'Sem compras não existe informação suficiente para calcular preferências. Esse caso segue para o fallback de popularidade.',
        variables: { purchasedProductsLength: purchases.length },
        output: { continues: purchases.length > 0 },
      },
      {
        id: 'map-products',
        title: 'Codificar cada compra',
        code: 'const vectors = purchasedProducts.map((product) => encodeProduct(product, context));',
        explanation:
          'O método anterior é aplicado a cada produto comprado. Agora todas as compras usam a mesma representação numérica.',
        variables: {
          purchases: purchases.map(({ id, title }) => ({ id, title })),
        },
        output: {
          vectors: vectors.map((vector) => roundedVector(vector)),
        },
      },
      {
        id: 'average',
        title: 'Calcular a média por dimensão',
        code: 'return averageVectors(vectors);',
        explanation:
          'Cada posição é somada entre todas as compras e dividida pela quantidade. O resultado representa o perfil médio.',
        formula: 'perfil[i] = soma dos vetores[i] / quantidade de compras',
        variables: {
          vectorCount: vectors.length,
          dimensionsPerVector: vectors[0]?.length ?? 0,
        },
        output: {
          averageFromHelper: roundedVector(average),
          methodResult: roundedVector(result ?? []),
        },
      },
    ],
  };
}

function createTrainingDataLesson(): MethodLesson {
  const context = buildContext(PRODUCTS);
  const selectedUser = USERS[0];
  const selectedProduct = PRODUCTS[0];
  const purchasedIds = new Set(selectedUser.purchases.map((product) => product.id));
  const userVector = encodeUserLeaveOneOut(
    selectedUser.purchases,
    selectedProduct.id,
    context
  );
  const productVector = encodeProduct(selectedProduct, context);
  const label = purchasedIds.has(selectedProduct.id) ? 1 : 0;
  const result = createTrainingData(USERS, PRODUCTS, context);

  return {
    id: 'create-training-data',
    phase: 'dados',
    method: 'createTrainingData',
    file: 'src/lib/recommendations/training-data.ts',
    purpose: 'Gerar pares supervisionados usuário × produto com entrada numérica e label 0/1.',
    steps: [
      {
        id: 'examples',
        title: 'Inicializar a coleção',
        code: 'const examples: TrainingExample[] = [];',
        explanation: 'A função começa com uma lista vazia que receberá um exemplo por par.',
        variables: {},
        output: { examples: [] },
      },
      {
        id: 'user-loop',
        title: 'Selecionar um usuário',
        code: `for (const user of users) {
  const purchasedIds = new Set(user.purchases.map((product) => product.id));`,
        explanation:
          'O Set permite verificar rapidamente se um produto foi comprado pelo usuário atual.',
        variables: {
          userId: selectedUser.id,
          purchases: selectedUser.purchases.map(({ id, title }) => ({ id, title })),
        },
        output: { purchasedIds: [...purchasedIds] },
      },
      {
        id: 'product-loop',
        title: 'Selecionar um produto do catálogo',
        code: 'for (const product of products) {',
        explanation:
          'Cada usuário é combinado com cada produto. A demonstração acompanha apenas um desses pares.',
        variables: {
          productId: selectedProduct.id,
          productTitle: selectedProduct.title,
          totalProducts: PRODUCTS.length,
        },
        output: { currentPair: [selectedUser.id, selectedProduct.id] },
      },
      {
        id: 'leave-one-out',
        title: 'Criar o perfil sem vazar a resposta',
        code: 'const userVector = encodeUserLeaveOneOut(user.purchases, product.id, context);',
        explanation:
          'Como o produto atual foi comprado, ele é removido antes de calcular o perfil. Sem isso, a entrada já conteria parte da resposta.',
        variables: {
          excludedProductId: selectedProduct.id,
          remainingPurchaseIds: selectedUser.purchases
            .filter((product) => product.id !== selectedProduct.id)
            .map((product) => product.id),
        },
        output: { userVector: roundedVector(userVector) },
      },
      {
        id: 'product-and-label',
        title: 'Codificar produto e determinar o label',
        code: `const productVector = encodeProduct(product, context);
const label = purchasedIds.has(product.id) ? 1 : 0;`,
        explanation:
          'O produto recebe seu vetor. O label vale 1 quando há compra e 0 quando não há compra registrada.',
        variables: {
          productId: selectedProduct.id,
          purchasedIds: [...purchasedIds],
        },
        output: { productVector: roundedVector(productVector), label },
      },
      {
        id: 'push',
        title: 'Concatenar e adicionar o exemplo',
        code: `examples.push({
  input: [...userVector, ...productVector],
  label,
  userId: user.id,
  productId: product.id,
});`,
        explanation:
          'A entrada junta perfil e produto. Esse é o vetor que será entregue à primeira camada da rede neural.',
        variables: {
          userVectorDimensions: userVector.length,
          productVectorDimensions: productVector.length,
        },
        output: {
          selectedExample: {
            input: roundedVector([...userVector, ...productVector]),
            label,
            userId: selectedUser.id,
            productId: selectedProduct.id,
          },
          totalExamplesGenerated: result.examples.length,
          inputDimension: result.inputDim,
        },
      },
    ],
  };
}

function createLoadSourceDataLesson(): MethodLesson {
  const products = PRODUCTS;
  const users = USERS;
  const context = buildContext(products);

  return {
    id: 'load-source-data',
    phase: 'dados',
    method: 'loadTrainingDataFromPrisma',
    file: 'src/lib/recommendations/queries.ts',
    purpose:
      'Buscar no PostgreSQL os produtos elegíveis e os históricos de compra que alimentam o pipeline.',
    steps: [
      {
        id: 'eligible-products',
        title: 'Buscar produtos elegíveis',
        code: `const products = await fetchProductsForRecommendations();
// Prisma: available = true, maker e imagens incluídos`,
        explanation:
          'A consulta remove itens indisponíveis e adapta os registros do Prisma para RecommendationProduct.',
        variables: { available: true, source: 'PostgreSQL via Prisma' },
        output: {
          products: products.length,
          catalog: products.map(({ id, title, category, material }) => ({
            id,
            title,
            category,
            material,
          })),
          fields: ['atributos 3D', 'maker', 'imagens', 'purchaseCount'],
        },
      },
      {
        id: 'purchase-history',
        title: 'Buscar usuários com compras',
        code: 'const users = await fetchUsersWithPurchases();',
        explanation:
          'Pedidos nos estados completed, delivered ou shipped são agrupados por usuário. Cada item comprado vira sinal positivo.',
        variables: {
          completedOrderStatuses: [...COMPLETED_ORDER_STATUSES],
        },
        output: {
          users: users.map((user) => ({
            id: user.id,
            purchasedProductIds: user.purchases.map((product) => product.id),
          })),
        },
      },
      {
        id: 'assemble-source',
        title: 'Montar a fonte de treino',
        code: `const context = buildContext(products);
return { users, products, context };`,
        explanation:
          'Produtos, usuários e estatísticas do catálogo seguem juntos para a criação do dataset.',
        variables: { users: users.length, products: products.length },
        output: {
          context: {
            dimensions: context.dimensions,
            numCategories: context.numCategories,
            numMaterials: context.numMaterials,
            categories: Object.keys(context.categoriesIndex),
            materials: Object.keys(context.materialsIndex),
          },
          readyForTrainingData: true,
        },
      },
    ],
  };
}

export function getMethodLessons(): MethodLesson[] {
  const coreLessons = [
    createLoadSourceDataLesson(),
    createEncodeProductLesson(),
    createEncodeUserLesson(),
    createTrainingDataLesson(),
  ];
  const lessons = [...getPipelineLessons(), ...coreLessons];
  const order = [
    'load-source-data',
    'build-context',
    'vector-math',
    'encode-product',
    'encode-user',
    'cold-start-leave-one-out',
    'create-training-data',
    'split-by-user',
    'create-model',
    'train-model',
    'training-entry-points',
    'export-upload',
    'save-load-model',
    'predict-batch',
    'score-products-ml',
    'content-fallback',
    'recommend-orchestrator',
    'recommendations-api',
    'learn-facades',
    'ui-consumers',
  ];

  return lessons.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}
