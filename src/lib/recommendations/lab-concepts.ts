export interface PipelineStep {
  step: string;
  description: string;
}

export interface MethodRef {
  name: string;
  file: string;
  description: string;
}

export interface ConceptSection {
  id: string;
  title: string;
  concept: string;
  flow?: PipelineStep[];
  methods?: MethodRef[];
}

/** Tooltips curtos para termos técnicos exibidos na UI do lab */
export const LAB_GLOSSARY: Record<string, string> = {
  épocas:
    'Uma passagem completa pelo dataset de treino. Mais épocas = mais oportunidades de aprender, mas também mais risco de memorizar (overfit).',
  'learning rate':
    'Quanto o modelo ajusta os pesos a cada passo. Muito alto → instável; muito baixo → aprende devagar ou para cedo.',
  treino:
    'Exemplos usados para ajustar os pesos da rede. Aqui: pares (usuário, produto) reservados para treino após splitByUser.',
  validação:
    'Exemplos de usuários que a rede nunca viu no treino. Medem generalização — o que importa na prática.',
  positivos:
    'Pares com label 1 (usuário comprou o produto). São minoria no dataset — típico em recomendação implícita.',
  'input dim':
    'Tamanho do vetor de entrada: vetor do usuário concatenado com vetor do produto (dimensions × 2).',
  'binary crossentropy':
    'Função de perda para classificação binária (comprou / não comprou). Penaliza previsões distantes de 0 ou 1.',
  'leave-one-out':
    'Ao montar o perfil do usuário para um par de treino, exclui o produto sendo rotulado — evita vazamento de informação.',
  'val_loss':
    'Perda na validação. Se sobe enquanto loss cai, o modelo está memorizando o treino (overfit).',
  'val_acc':
    'Acurácia na validação (% de acertos 0/1). Com poucos dados pode ser enganosa — observe também o ranking.',
  relu: 'Ativação que zera valores negativos. Permite aprender relações não-lineares entre features.',
  sigmoid: 'Comprime a saída entre 0 e 1 — interpretável como probabilidade de “vai comprar”.',
  dropout:
    'Desliga 20% dos neurônios aleatoriamente a cada passo. Regulariza e reduz overfit em datasets pequenos.',
  cosseno:
    'Similaridade entre vetores (0 = nada a ver, 1 = mesma direção). Base do algoritmo content-based — sem treino, só geometria.',
};

export const OVERVIEW_CONCEPTS: ConceptSection[] = [
  {
    id: 'dois-fluxos',
    title: 'Dois fluxos conectados pelo modelo persistido',
    concept:
      'O Fluxo A prepara dados, treina e salva model.json, weights.bin e metadata.json. Ele pode começar no terminal ou no playground do navegador. O Fluxo B começa quando a interface chama /api/recommendations: o servidor carrega o modelo salvo, monta um lote de candidatos e produz o ranking. Treinamento não acontece a cada recomendação.',
    flow: [
      { step: 'Fluxo A — preparação', description: 'Banco → contexto → vetores → dataset → treino → arquivos do modelo.' },
      { step: 'Ponte — persistência', description: 'Os artefatos guardam arquitetura, pesos e métricas entre execuções.' },
      { step: 'Fluxo B — produção', description: 'Requisição → histórico → candidatos → score → ranking → ProductCard.' },
    ],
  },
  {
    id: 'algoritmos',
    title: 'Content-based vs ML — duas formas de pontuar',
    concept:
      'Content-based compara diretamente o perfil médio do usuário com cada produto usando similaridade de cosseno. ML usa os mesmos vetores como entrada de uma rede neural que aprende combinações não-lineares. source=auto tenta ML e usa content como fallback; sem histórico, o sistema usa popularidade.',
    methods: [
      { name: 'rankProductsContent + cosineSimilarity', file: 'recommend.ts, similarity.ts', description: 'Content-based — cosseno entre perfil e produto.' },
      { name: 'scoreProductsML + predictBatch', file: 'ml-recommend.ts, model.ts', description: 'ML — score via rede neural.' },
      { name: 'getRecommendations', file: 'recommend.ts', description: 'Seleciona algoritmo, aplica fallback e informa a origem na resposta.' },
    ],
  },
  {
    id: 'execucao',
    title: 'Como interpretar “cálculo real” e “execução ilustrada”',
    concept:
      'Cálculos puros, como normalização, one-hot, vetores e criação de exemplos, são executados com fixtures determinísticas pelos próprios métodos do projeto. Operações com efeitos colaterais — consultas, treino, upload e gravação — usam traces ilustrados com código e estados representativos. Assim, estudar uma lição nunca altera o banco nem substitui o modelo aplicado.',
    methods: [
      { name: 'getMethodLessons', file: 'education-traces.ts', description: 'Gera cálculos reproduzíveis para métodos puros.' },
      { name: 'getPipelineLessons', file: 'education-pipeline-lessons.ts', description: 'Descreve com segurança integrações e efeitos colaterais.' },
    ],
  },
  {
    id: 'roteiro',
    title: 'Como usar este laboratório',
    concept:
      'Siga a ordem: Passo a passo (mapa e métodos) → Vetores (intuição numérica) → Treino TF (experimento supervisionado) → Comparar (content e ML lado a lado) → Quiz (consolidação). O progresso das missões fica salvo no navegador. A documentação técnica completa está em docs/recommendations/README.md.',
  },
];

export const VECTORS_CONCEPTS: ConceptSection[] = [
  {
    id: 'vetor',
    title: 'O que é o vetor de perfil?',
    concept:
      'Um vetor é uma ficha numérica: preço, avaliação, tempo de impressão, volume, peso, mais posições one-hot para categoria e material. O perfil do usuário é a média dos vetores dos produtos que ele comprou — por isso Maria e João têm barras altas em features diferentes.',
    flow: [
      { step: 'Compras do usuário', description: 'Pedidos concluídos → lista de produtos.' },
      { step: 'encodeProduct', description: 'Cada produto vira vetor com pesos (category 0.35, material 0.25…).' },
      { step: 'Média', description: 'encodeUserFromPurchases soma e divide — perfil agregado.' },
      { step: 'Visualização', description: 'Barras mostram as dimensões com maior peso no perfil.' },
    ],
    methods: [
      { name: 'encodeProduct', file: 'encode.ts', description: '5 numéricos normalizados + one-hot categoria + one-hot material.' },
      { name: 'encodeUserFromPurchases', file: 'encode.ts', description: 'Média elemento a elemento dos vetores comprados.' },
      { name: 'normalize + oneHotWeighted', file: 'encode.ts', description: 'Escala 0–1 e marca categoria/material com peso da feature.' },
    ],
  },
  {
    id: 'pesos',
    title: 'Pesos das features — por que category pesa mais?',
    concept:
      'Na codificação, pesos refletem importância de negócio: categoria e material definem “tipo” de produto 3D; preço e rating refinam. No content-based eles influenciam diretamente o cosseno; no ML a rede aprende pesos adicionais nas camadas densas.',
    methods: [
      { name: 'FEATURE_WEIGHTS', file: 'constants.ts', description: 'category 0.35, material 0.25, price 0.15, avgRating 0.10, demais 0.05.' },
    ],
  },
  {
    id: 'cold-start',
    title: 'Usuário sem compras (cold start)',
    concept:
      'Sem histórico não há média de vetores. O sistema usa encodeColdStartUser (vetor neutro) e cai no ranking por popularidade — visível quando uma persona não tem compras concluídas.',
  },
];

export const TRAINING_CONCEPTS: ConceptSection[] = [
  {
    id: 'supervisionado',
    title: 'Aprendizado supervisionado — o que a rede aprende?',
    concept:
      'Cada linha do dataset é um par (usuário, produto) com label: 1 = comprou, 0 = não comprou. A entrada é [vetor_usuário | vetor_produto]. A rede aprende a prever se aquele usuário compraria aquele produto. Label 0 não significa “detesta” — só “não comprou” (feedback implícito).',
    flow: [
      { step: 'createTrainingData', description: 'Para cada user × product do catálogo, monta input e label.' },
      { step: 'encodeUserLeaveOneOut', description: 'Perfil sem o produto rotulado — evita colar a resposta no input.' },
      { step: 'splitByUser', description: 'Treino e validação com usuários diferentes — simula usuário novo.' },
      { step: 'model.fit', description: 'Ajusta pesos minimizando binaryCrossentropy por várias épocas.' },
      { step: 'Inferência', description: 'predictBatch → score 0–1 → ordena produtos não comprados.' },
    ],
    methods: [
      { name: 'createTrainingData', file: 'training-data.ts', description: 'Loop user × product; concatena vetores; label 0/1.' },
      { name: 'encodeUserLeaveOneOut', file: 'training-data.ts', description: 'Filtra produto excluído antes da média.' },
      { name: 'splitByUser', file: 'training-data.ts', description: '80% usuários treino, 20% validação (seed fixa 42).' },
    ],
  },
  {
    id: 'arquitetura',
    title: 'Arquitetura da rede — camada por camada',
    concept:
      'Rede densa (MLP): entrada (input dim) → 64 neurônios ReLU → Dropout 20% → 32 ReLU → 1 Sigmoid. ReLU permite curvas; Dropout combate overfit; Sigmoid entrega probabilidade. Regularização L2 nos pesos da primeira camada.',
    methods: [
      { name: 'createModel', file: 'model.ts', description: 'sequential: Dense(64) → Dropout(0.2) → Dense(32) → Dense(1, sigmoid).' },
      { name: 'trainRecommendationModel', file: 'model.ts', description: 'Adam, binaryCrossentropy, early stopping opcional no servidor.' },
      { name: 'trainInBrowser', file: 'browser-model.ts', description: 'Mesma arquitetura no playground; upload via POST /api/learn/upload-model.' },
    ],
  },
  {
    id: 'metricas',
    title: 'Loss, val_loss e overfit — como ler o gráfico',
    concept:
      'Loss mede erro no treino; val_loss no conjunto de validação (usuários não vistos). Ideal: ambas descem juntas. Se loss cai e val_loss sobe ou estagna, o modelo memorizou exemplos do treino — comum aqui porque há poucos pares. Experimente 80 épocas + lr alto para ver overfit de propósito.',
    methods: [
      { name: 'onEpochEnd', file: 'browser-model.ts', description: 'Callback que alimenta o gráfico a cada época.' },
    ],
  },
  {
    id: 'aplicar',
    title: 'Aplicar no marketplace — do browser ao servidor',
    concept:
      'Após treinar, “Aplicar no marketplace” serializa model.json + weights.bin no servidor. O toggle ML em /marketplace usa scoreProductsML com encodeUserFromPurchases (sem leave-one-out na inferência — perfil completo).',
    flow: [
      { step: 'Treino no browser', description: 'TensorFlow.js roda localmente.' },
      { step: 'uploadModelToServer', description: 'POST /api/learn/upload-model salva em models/recommendations/.' },
      { step: 'GET /api/recommendations?source=ml', description: 'Carrega modelo e ranqueia produtos.' },
    ],
  },
];

export const DATASET_CONCEPTS: ConceptSection[] = [
  {
    id: 'pares',
    title: 'Tabela de pares — exemplos concretos',
    concept:
      'Cada linha mostra um exemplo supervisionado real do seed demo. “Comprou” = label 1; “Não comprou” = label 0 para aquele par user×product, mesmo que o usuário tenha comprado outros itens.',
    methods: [
      { name: 'getTrainingPairsForLab', file: 'learn-data.ts', description: 'Formata pares legíveis para a UI do lab.' },
    ],
  },
];

export const COMPARE_CONCEPTS: ConceptSection[] = [
  {
    id: 'duas-fases',
    title: 'Por que comparar content-based e ML?',
    concept:
      'Content-based é transparente: similaridade de cosseno entre perfil médio e produto. ML pode capturar interações entre features, mas com poucos dados pode só memorizar. Rankings iguais = concordância; divergência = discussão: insight novo ou overfit?',
    flow: [
      { step: 'Mesmo usuário', description: 'Persona selecionada.' },
      { step: 'source=content', description: 'cosineSimilarity(encodeUser, encodeProduct).' },
      { step: 'source=ml', description: 'predict([userVector | productVector]).' },
      { step: 'Diff', description: 'Produtos só em um ranking destacam diferenças.' },
    ],
    methods: [
      { name: 'getRecommendations(..., source: "content")', file: 'recommend.ts', description: 'Ranking por cosseno.' },
      { name: 'getRecommendations(..., source: "ml")', file: 'recommend.ts', description: 'Ranking por rede; 503 se modelo ausente.' },
    ],
  },
];
