export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizTrack {
  id: string;
  label: string;
  summary: string;
  description: string;
  questions: QuizQuestion[];
}

const ANALOGIES: QuizQuestion[] = [
  {
    id: 'an1',
    question: 'O vetor de um produto foi comparado a uma "ficha resumida". O que essa ficha guarda?',
    options: [
      'A foto e a descrição completa do produto',
      'Números que resumem categoria, material, preço e tamanho',
      'O nome do maker que fabricou a peça',
    ],
    correct: 1,
    explanation:
      'Cada posição da ficha é uma característica virada número. O computador não lê texto — ele compara listas de números.',
  },
  {
    id: 'an2',
    question:
      'Na analogia da biblioteca, o content-based classifica livros pela etiqueta ("Romance, 300 páginas"). Quem faria o papel de uma futura abordagem com embeddings?',
    options: [
      'O bibliotecário que organiza as estantes em ordem alfabética',
      'Alguém que leu o livro e diz com quais outros ele combina pelo assunto',
      'O catálogo que registra quantas cópias existem',
    ],
    correct: 1,
    explanation:
      'Content-based olha etiquetas que nós escolhemos. O embedding capta o significado do texto — por isso "Engrenagem Educacional" pode ficar perto de "Quebra-cabeça 3D".',
  },
  {
    id: 'an3',
    question: 'O modelo ML foi comparado a uma "prova de adivinhação". Qual é a pergunta de cada questão dessa prova?',
    options: [
      'Este produto é parecido com aquele outro?',
      'A Maria compraria este produto? Sim ou não',
      'Qual é o preço médio do catálogo?',
    ],
    correct: 1,
    explanation:
      'Cada exemplo de treino é um par (usuário, produto) com resposta 1 (comprou) ou 0 (não comprou). No começo a rede chuta; depois de ver os pares, encontra padrões.',
  },
  {
    id: 'an4',
    question:
      'Na analogia da receita, o cozinheiro prova 100 pratos e vai ajustando os temperos. O que são os "temperos" na rede neural?',
    options: [
      'Os produtos do catálogo',
      'Os pesos internos da rede, ajustados durante o treino',
      'As categorias e materiais do produto',
    ],
    correct: 1,
    explanation:
      'No content-based a receita é fixa ("decorativo vale 0.35"). No ML a própria rede ajusta seus pesos até errar menos.',
  },
  {
    id: 'an5',
    question: 'Na analogia do médico em formação, para que servem os casos que ele nunca viu?',
    options: [
      'Para aumentar a quantidade de exemplos de treino',
      'Para descobrir se ele generalizou ou apenas decorou os casos antigos',
      'Para escolher a especialidade dele',
    ],
    correct: 1,
    explanation:
      'Esse é o papel do conjunto de validação. Ir bem no treino e mal na validação significa que decorou — é overfit.',
  },
  {
    id: 'an6',
    question:
      'Comparamos content-based a uma "régua fixa" e ML a um "aprendiz". Qual a consequência prática dessa diferença?',
    options: [
      'A régua precisa de treino e o aprendiz não',
      'A régua funciona no primeiro dia; o aprendiz precisa de exemplos antes de servir',
      'As duas sempre produzem exatamente o mesmo ranking',
    ],
    correct: 1,
    explanation:
      'Content-based funciona com um único pedido no banco. ML só responde depois de treinar e salvar um modelo.',
  },
  {
    id: 'an7',
    question:
      'Na analogia de compatibilidade de perfis (two-tower), por que guardar o vetor do produto com antecedência ajuda?',
    options: [
      'Porque assim não é preciso rodar a rede inteira para cada par usuário × produto',
      'Porque o produto passa a ter mais características',
      'Porque o banco de dados fica menor',
    ],
    correct: 0,
    explanation:
      'No ML atual cada par passa pela rede completa. Com milhares de produtos isso não escala — no two-tower o lado do produto já está pronto e só se compara.',
  },
  {
    id: 'an8',
    question: '"Gente parecida com você também comprou isto" descreve qual abordagem?',
    options: [
      'Content-based, como o algoritmo de cosseno atual',
      'Filtragem colaborativa, uma possível evolução',
      'Busca por palavra-chave',
    ],
    correct: 1,
    explanation:
      'Content-based olha o produto ("parecido com o que você comprou"); colaborativa olha as pessoas. Por isso ela exige muitos usuários — na demo, com 2 compradores, quase não funciona.',
  },
  {
    id: 'an9',
    question:
      'Na analogia do "cardápio do dia", a cozinha monta o top 10 da Maria de madrugada. Que problema isso resolve?',
    options: [
      'Melhora a qualidade das recomendações',
      'Evita recalcular tudo a cada clique do usuário',
      'Reduz o número de produtos do catálogo',
    ],
    correct: 1,
    explanation:
      'É cache, uma evolução de escala. Não muda o que é recomendado, muda quando o cálculo acontece.',
  },
  {
    id: 'an10',
    question: 'Na analogia da lista telefônica, quando o pgvector começa a fazer diferença?',
    options: [
      'Sempre, mesmo com 20 produtos',
      'Quando há tantos itens que comparar um a um fica lento',
      'Somente se trocarmos o PostgreSQL por outro banco',
    ],
    correct: 1,
    explanation:
      'Com 20 contatos você abre a agenda inteira; com 1 milhão precisa de índice. E pgvector é extensão do próprio Postgres, não um banco separado.',
  },
  {
    id: 'an11',
    question:
      'Persistir o embedding foi comparado a arquivar a ficha na gaveta em vez de reescrevê-la. Por que isso vale a pena?',
    options: [
      'Porque o texto do produto muda toda hora',
      'Porque gerar o embedding é lento e o texto do produto raramente muda',
      'Porque a ficha ocupa menos espaço quando guardada',
    ],
    correct: 1,
    explanation:
      'Calcular embedding é caro; ler do banco é barato. Como título e descrição são estáveis, calcula-se uma vez e guarda.',
  },
];

const VOCABULARY: QuizQuestion[] = [
  {
    id: 'vo1',
    question: 'No projeto, o que significa "encode"?',
    options: [
      'Criptografar os dados do usuário',
      'Transformar um produto ou usuário em lista de números',
      'Compactar as imagens do produto',
    ],
    correct: 1,
    explanation:
      'encode.ts recebe um produto e devolve um vetor. Nada a ver com criptografia.',
  },
  {
    id: 'vo2',
    question: 'Um produto é da categoria decorative, entre 6 categorias possíveis. Como o one-hot representa isso?',
    options: [
      'Um único número de 1 a 6',
      'Seis posições, todas zero, exceto a de decorative',
      'O texto "decorative" convertido letra por letra',
    ],
    correct: 1,
    explanation:
      'One-hot evita que o modelo ache que a categoria 5 é "maior" que a 2. Não existe ordem natural entre categorias.',
  },
  {
    id: 'vo3',
    question: 'Por que normalizar o preço entre 0 e 1 antes de montar o vetor?',
    options: [
      'Para deixar todos os produtos com o mesmo preço',
      'Para que o preço (R$ 150) não domine o vetor só por ser um número grande',
      'Para arredondar os centavos',
    ],
    correct: 1,
    explanation:
      'Sem normalizar, preço em reais pesaria muito mais que uma nota de 0 a 5. normalize() põe tudo na mesma escala antes de aplicar os pesos.',
  },
  {
    id: 'vo4',
    question: 'A similaridade de cosseno entre dois vetores mede o quê?',
    options: [
      'A distância em centímetros entre dois produtos',
      'O quanto os dois vetores apontam na mesma direção',
      'Quantos números os dois vetores têm em comum',
    ],
    correct: 1,
    explanation:
      'O cosseno ignora o tamanho do vetor e olha a direção. Vai de 0 (nada a ver) a 1 (mesma direção).',
  },
  {
    id: 'vo5',
    question: 'O que é um "label" no dataset de ML?',
    options: [
      'O nome do produto exibido na tela',
      'A resposta certa do exemplo: 1 comprou, 0 não comprou',
      'A etiqueta de categoria do produto',
    ],
    correct: 1,
    explanation:
      'Label é o gabarito. É o que torna o treino supervisionado — a rede compara seu chute com o label.',
  },
  {
    id: 'vo6',
    question: 'Uma "época" de treino corresponde a:',
    options: [
      'Uma passada completa por todos os exemplos de treino',
      'Um único exemplo processado pela rede',
      'Um segundo de processamento',
    ],
    correct: 0,
    explanation:
      'Com 20 exemplos e 30 épocas, a rede vê aqueles mesmos 20 exemplos 30 vezes. Muitas épocas em poucos dados levam a overfit.',
  },
  {
    id: 'vo7',
    question: 'O que o learning rate controla?',
    options: [
      'Quantos exemplos entram no dataset',
      'O tamanho do passo de ajuste dos pesos em cada correção',
      'A velocidade da internet ao carregar o modelo',
    ],
    correct: 1,
    explanation:
      'Passo grande aprende rápido mas pode passar do ponto e oscilar; passo pequeno é estável mas lento. No projeto o padrão é 0.01.',
  },
  {
    id: 'vo8',
    question: 'Qual a diferença entre loss e val_loss?',
    options: [
      'loss é o erro nos dados de treino; val_loss é o erro em dados separados',
      'loss é do browser e val_loss é do servidor',
      'São dois nomes para a mesma métrica',
    ],
    correct: 0,
    explanation:
      'É a comparação entre as duas que revela overfit: loss caindo enquanto val_loss sobe significa memorização.',
  },
  {
    id: 'vo9',
    question: 'A última camada da rede usa ativação sigmoid. Por quê?',
    options: [
      'Para acelerar o treino',
      'Para forçar a saída a um valor entre 0 e 1, lido como probabilidade',
      'Para gerar números inteiros',
    ],
    correct: 1,
    explanation:
      'Como o label é 0 ou 1, a saída precisa viver na mesma faixa. Um score 0.87 é lido como "87% de chance de compra".',
  },
  {
    id: 'vo10',
    question: 'O dropout de 0.2 durante o treino faz o quê?',
    options: [
      'Descarta 20% dos produtos do catálogo',
      'Desliga aleatoriamente 20% dos neurônios em cada passo',
      'Reduz o dataset em 20%',
    ],
    correct: 1,
    explanation:
      'Desligar neurônios impede a rede de depender de um caminho único. É defesa contra overfit, junto com a regularização L2.',
  },
  {
    id: 'vo11',
    question: 'O que é "cold start" neste sistema?',
    options: [
      'O servidor demorar para iniciar',
      'Um usuário (ou produto) sem histórico para embasar a recomendação',
      'A primeira época do treino',
    ],
    correct: 1,
    explanation:
      'Quem acabou de se cadastrar não tem compras, então o sistema cai no modo popular. encodeColdStartUser devolve um vetor de zeros.',
  },
  {
    id: 'vo12',
    question: 'Overfit é quando o modelo:',
    options: [
      'Não aprendeu nada e erra em tudo',
      'Vai muito bem nos exemplos de treino e mal em exemplos novos',
      'Roda lento demais',
    ],
    correct: 1,
    explanation:
      'É o oposto do underfit. Com só 40 pares no dataset da demo ele aparece rápido — dá para provocar de propósito no playground.',
  },
];

const PHASE_1_METHODS: QuizQuestion[] = [
  {
    id: 'm1a',
    question: 'Qual o papel de buildContext(products)?',
    options: [
      'Treinar o modelo com os produtos',
      'Calcular min/max de preço, tempo, volume e peso, e indexar categorias e materiais',
      'Salvar os produtos no banco',
    ],
    correct: 1,
    explanation:
      'Sem esse passo não há como normalizar nem montar one-hot: é ele que define o tamanho do vetor (dimensions).',
  },
  {
    id: 'm1b',
    question: 'Em buildContext, dimensions vale 5 + numCategories + numMaterials. Por que o 5?',
    options: [
      'São as 5 primeiras categorias',
      'São as 5 features numéricas: preço, nota, tempo de impressão, volume e peso',
      'É o número de casas decimais usado',
    ],
    correct: 1,
    explanation:
      'Com as 6 categorias e 5 materiais do seed, o vetor fica com 5 + 6 + 5 = 16 posições.',
  },
  {
    id: 'm1c',
    question: 'normalize(value, min, max) divide por ((max - min) || 1). Para que serve o || 1?',
    options: [
      'Para arredondar o resultado',
      'Para evitar divisão por zero quando todos os produtos têm o mesmo valor',
      'Para garantir um resultado inteiro',
    ],
    correct: 1,
    explanation:
      'Se todo produto custasse R$ 50, max - min seria 0. O || 1 troca o divisor por 1 e evita NaN.',
  },
  {
    id: 'm1d',
    question: 'O que oneHotWeighted(index, length, weight) devolve?',
    options: [
      'Uma lista de zeros com o peso na posição do índice',
      'O índice multiplicado pelo peso',
      'Uma lista com o peso repetido em todas as posições',
    ],
    correct: 0,
    explanation:
      'É one-hot e ponderação no mesmo passo: para categoria, a posição correta recebe 0.35 em vez de 1.',
  },
  {
    id: 'm1e',
    question: 'Qual a ordem das posições no vetor devolvido por encodeProduct?',
    options: [
      'Categoria, material e depois os numéricos',
      'Os 5 numéricos, depois one-hot de categoria, depois one-hot de material',
      'Ordem alfabética dos nomes das features',
    ],
    correct: 1,
    explanation:
      'A ordem precisa ser sempre a mesma; senão a posição 7 significaria coisas diferentes em produtos diferentes e o modelo não teria o que aprender.',
  },
  {
    id: 'm1f',
    question: 'Um produto sem nenhuma review: o que encodeProduct usa como avgRating?',
    options: [
      'Zero, já que não tem nota',
      '0.5 como valor neutro (product.avgRating ?? 0.5)',
      'A média das notas do catálogo',
    ],
    correct: 1,
    explanation:
      'Zero seria interpretado como nota péssima. Um valor neutro evita punir produto novo por falta de avaliação.',
  },
  {
    id: 'm1g',
    question: 'Como encodeUserFromPurchases constrói o perfil do usuário?',
    options: [
      'Usa o vetor da compra mais recente',
      'Faz a média dos vetores de todos os produtos comprados',
      'Soma os vetores sem dividir',
    ],
    correct: 1,
    explanation:
      'averageVectors calcula a média. Por isso o perfil da Maria puxa para decorativo/PLA: é o centro de gravidade das compras dela.',
  },
  {
    id: 'm1h',
    question: 'Quando encodeUserFromPurchases devolve null?',
    options: [
      'Quando a lista de produtos comprados está vazia',
      'Quando o usuário não está logado',
      'Quando o modelo de ML não existe',
    ],
    correct: 0,
    explanation:
      'Sem compras não há média possível. Quem chama trata o null caindo no modo popular.',
  },
  {
    id: 'm1i',
    question: 'Em cosineSimilarity o denominador também tem || 1. Que caso isso protege?',
    options: [
      'Vetores de tamanhos diferentes',
      'Um vetor todo de zeros, cuja magnitude é zero',
      'Vetores com números negativos',
    ],
    correct: 1,
    explanation:
      'É justamente o vetor de cold start. Sem a proteção o resultado seria NaN e o ranking quebraria.',
  },
];

const PHASE_2_METHODS: QuizQuestion[] = [
  {
    id: 'm2a',
    question:
      'createTrainingData percorre cada usuário e cada produto. Com 2 compradores e 20 produtos, quantos exemplos saem?',
    options: ['10, um por compra', '40, todos os pares usuário × produto', '2, um por usuário'],
    correct: 1,
    explanation:
      'Todo produto vira exemplo para todo usuário: os comprados com label 1, os demais com label 0.',
  },
  {
    id: 'm2b',
    question: 'createTrainingData devolve inputDim igual a context.dimensions * 2. Por que o dobro?',
    options: [
      'Porque cada exemplo aparece duas vezes',
      'Porque a entrada é o vetor do usuário concatenado com o do produto',
      'Porque existem dois usuários no dataset',
    ],
    correct: 1,
    explanation:
      '16 do usuário + 16 do produto = 32. É por isso que metadata.json registra inputDimension: 32.',
  },
  {
    id: 'm2c',
    question: 'O que encodeUserLeaveOneOut faz de diferente de encodeUserFromPurchases?',
    options: [
      'Usa apenas a compra mais recente',
      'Remove do perfil o produto que está sendo rotulado',
      'Dobra o peso das categorias',
    ],
    correct: 1,
    explanation:
      'Sem isso o perfil da Maria conteria o próprio vaso sobre o qual estamos perguntando — a resposta estaria dentro da pergunta.',
  },
  {
    id: 'm2d',
    question: 'Como se chama o problema que o leave-one-out evita?',
    options: ['Vazamento de dados (data leakage)', 'Cold start', 'Underfit'],
    correct: 0,
    explanation:
      'Informação da resposta escapa para a entrada e a métrica fica otimista demais. O demo original do curso tinha esse defeito.',
  },
  {
    id: 'm2e',
    question:
      'Um usuário comprou só 1 produto, e é justamente o que está sendo rotulado. O que encodeUserLeaveOneOut devolve?',
    options: [
      'Erro, porque a lista fica vazia',
      'O vetor de cold start, todo de zeros',
      'O vetor do próprio produto',
    ],
    correct: 1,
    explanation:
      'Ao filtrar, sobra lista vazia. Em vez de quebrar, chama encodeColdStartUser e mantém o exemplo utilizável.',
  },
  {
    id: 'm2f',
    question: 'Por que splitByUser divide o dataset por usuário em vez de sortear linhas?',
    options: [
      'Para deixar o treino mais rápido',
      'Para que nenhum usuário apareça no treino e na validação ao mesmo tempo',
      'Para equilibrar a quantidade de labels 0 e 1',
    ],
    correct: 1,
    explanation:
      'Sorteando linhas, a Maria estaria nos dois lados e a validação mediria memorização, não generalização.',
  },
  {
    id: 'm2g',
    question: 'splitByUser recebe randomSeed = 42. Que efeito isso tem?',
    options: [
      'Embaralha de forma diferente a cada execução',
      'Mantém a divisão sempre igual, permitindo comparar treinos',
      'Define 42 exemplos de validação',
    ],
    correct: 1,
    explanation:
      'Semente fixa dá reprodutibilidade: se você mudar as épocas e o resultado mudar, foi a mudança e não o sorteio.',
  },
  {
    id: 'm2h',
    question:
      'createModel termina em Dense(1, sigmoid) e compila com binaryCrossentropy. Que tipo de problema é esse?',
    options: [
      'Regressão do preço',
      'Classificação binária: comprou ou não comprou',
      'Agrupamento de produtos',
    ],
    correct: 1,
    explanation:
      'Uma saída, entre 0 e 1, comparada a um label 0/1. Sigmoid + binaryCrossentropy é a combinação padrão para isso.',
  },
  {
    id: 'm2i',
    question: 'Em trainRecommendationModel, patience = 5 significa que o treino para quando:',
    options: [
      'Passarem 5 épocas no total',
      'val_loss não melhorar por 5 épocas seguidas',
      'A acurácia chegar a 5%',
    ],
    correct: 1,
    explanation:
      'É o early stopping. No modelo salvo do projeto ele agiu: epochsRun foi 11 das 50 permitidas.',
  },
  {
    id: 'm2j',
    question: 'Por que predictBatch prevê todos os candidatos de uma vez em vez de um por um?',
    options: [
      'Porque o TensorFlow só aceita lote',
      'Porque uma chamada com matriz é bem mais eficiente que N chamadas',
      'Porque assim os scores já saem ordenados',
    ],
    correct: 1,
    explanation:
      'Monta um tensor2d com todas as linhas e chama predict uma vez. Note também o dispose() nos tensores — sem isso a memória vaza.',
  },
  {
    id: 'm2k',
    question:
      'Na inferência, scoreProductsML usa encodeUserFromPurchases com todas as compras. Por que não usa leave-one-out aqui?',
    options: [
      'Porque seria lento',
      'Porque não há label a proteger: queremos o perfil mais completo possível',
      'Porque a função não existe no servidor',
    ],
    correct: 1,
    explanation:
      'Leave-one-out existe para o treino não trapacear. Na hora de recomendar, quanto mais histórico no perfil, melhor.',
  },
  {
    id: 'm2l',
    question: 'Quando loadModel() devolve null, scoreProductsML lança ModelNotFoundError. O que o usuário vê?',
    options: [
      'Sempre uma lista vazia',
      'HTTP 503 se pediu source=ml, ou o ranking content-based se pediu auto',
      'Erro 500 em qualquer caso',
    ],
    correct: 1,
    explanation:
      'auto usa content-based como fallback; ml explícito falha alto, para você perceber que precisa treinar.',
  },
];

function hashId(value: string): number {
  let hash = 7;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

/**
 * Rotaciona as alternativas por um deslocamento derivado do id, para que a
 * resposta certa não fique sempre na mesma posição. Estável entre recargas,
 * porque as respostas do aluno são guardadas por índice.
 */
function rotateOptions(question: QuizQuestion): QuizQuestion {
  const size = question.options.length;
  const shift = hashId(question.id) % size;

  if (shift === 0) return question;

  return {
    ...question,
    options: question.options.map((_, index) => question.options[(index + shift) % size]),
    correct: (question.correct - shift + size) % size,
  };
}

const TRACKS: QuizTrack[] = [
  {
    id: 'analogies',
    label: 'Analogias',
    summary: 'Biblioteca, receita, médico, cardápio',
    description:
      'As mesmas comparações usadas para explicar as fases sem jargão. Comece por aqui se os termos técnicos ainda soam estranhos.',
    questions: ANALOGIES,
  },
  {
    id: 'vocabulary',
    label: 'Vocabulário',
    summary: 'O que cada palavra significa',
    description:
      'Cada pergunta cobre um termo que aparece nas telas do laboratório: encode, one-hot, cosseno, label, época, loss, sigmoid, dropout.',
    questions: VOCABULARY,
  },
  {
    id: 'phase1',
    label: 'Métodos — Content',
    summary: 'context, encode, similarity',
    description:
      'Nível de código do content-based: buildContext, normalize, oneHotWeighted, encodeProduct, encodeUserFromPurchases e cosineSimilarity.',
    questions: PHASE_1_METHODS,
  },
  {
    id: 'phase2',
    label: 'Métodos — ML',
    summary: 'dataset, treino, inferência',
    description:
      'Nível de código da rede neural: createTrainingData, encodeUserLeaveOneOut, splitByUser, createModel, trainRecommendationModel, predictBatch e scoreProductsML.',
    questions: PHASE_2_METHODS,
  },
];

export const QUIZ_TRACKS: QuizTrack[] = TRACKS.map((track) => ({
  ...track,
  questions: track.questions.map(rotateOptions),
}));

export const QUIZ_PASS_RATIO = 0.7;

export function quizPassThreshold(total: number): number {
  return Math.max(1, Math.ceil(total * QUIZ_PASS_RATIO));
}

export const QUIZ_TOTAL_QUESTIONS = QUIZ_TRACKS.reduce(
  (total, track) => total + track.questions.length,
  0
);
