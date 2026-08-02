'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConceptPanel } from '@/components/learn/concept-panel';
import { DatasetExplorer } from '@/components/learn/dataset-explorer';
import { LearningMissions, useLearnMissions } from '@/components/learn/learning-missions';
import { LearnQuiz, clearQuizProgress } from '@/components/learn/learn-quiz';
import { MethodExplorer } from '@/components/learn/method-explorer';
import { RecommendationComparator } from '@/components/learn/recommendation-comparator';
import { TrainingPlayground } from '@/components/learn/training-playground';
import { VectorExplorer } from '@/components/learn/vector-explorer';
import { OVERVIEW_CONCEPTS } from '@/lib/recommendations/lab-concepts';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Code2,
  Database,
  FlaskConical,
  GitCompare,
  Layers,
  Monitor,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';

type LabTab = 'overview' | 'methods' | 'vectors' | 'train' | 'compare';

const TABS: Array<{ id: LabTab; label: string; icon: typeof BookOpen }> = [
  { id: 'overview', label: 'Visão geral', icon: BookOpen },
  { id: 'methods', label: 'Passo a passo', icon: Code2 },
  { id: 'vectors', label: 'Vetores', icon: Layers },
  { id: 'train', label: 'Treino TF', icon: FlaskConical },
  { id: 'compare', label: 'Comparar', icon: GitCompare },
];

const PIPELINE_PHASES = [
  {
    number: '01',
    title: 'Dados',
    description: 'Prisma, produtos disponíveis e histórico de compras.',
    icon: Database,
  },
  {
    number: '02',
    title: 'Representação',
    description: 'Normalização, one-hot e vetores de produto e usuário.',
    icon: Layers,
  },
  {
    number: '03',
    title: 'Treinamento',
    description: 'Dataset, split, rede neural, métricas e early stopping.',
    icon: Brain,
  },
  {
    number: '04',
    title: 'Persistência',
    description: 'Exportação, upload, model.json, pesos e metadados.',
    icon: PackageCheck,
  },
  {
    number: '05',
    title: 'Inferência',
    description: 'ML, similaridade de cosseno, fallback e ranking.',
    icon: GitCompare,
  },
  {
    number: '06',
    title: 'Entrega',
    description: 'Orquestração, APIs e cards mostrados ao usuário.',
    icon: Monitor,
  },
] as const;

const LEARNING_PATH: Array<{
  number: string;
  tab: Exclude<LabTab, 'overview'>;
  title: string;
  description: string;
}> = [
  {
    number: '1',
    tab: 'methods',
    title: 'Siga o mapa end-to-end',
    description: 'Percorra 20 lições e 70 passos, do banco até a interface.',
  },
  {
    number: '2',
    tab: 'vectors',
    title: 'Manipule os vetores',
    description: 'Compare personas e veja como o histórico forma preferências.',
  },
  {
    number: '3',
    tab: 'train',
    title: 'Treine a rede',
    description: 'Altere épocas e learning rate e acompanhe loss e validação.',
  },
  {
    number: '4',
    tab: 'compare',
    title: 'Compare os algoritmos',
    description: 'Analise rankings content-based e ML lado a lado.',
  },
];

const NEXT_STEP: Partial<Record<LabTab, { tab: LabTab; label: string; description: string }>> = {
  methods: {
    tab: 'vectors',
    label: 'Próximo: explorar vetores',
    description: 'Agora observe os números usados pelos métodos de codificação.',
  },
  vectors: {
    tab: 'train',
    label: 'Próximo: treinar a rede',
    description: 'Use os vetores para formar exemplos e ajustar o modelo.',
  },
  train: {
    tab: 'compare',
    label: 'Próximo: comparar rankings',
    description: 'Confira como o modelo treinado difere da similaridade de cosseno.',
  },
  compare: {
    tab: 'overview',
    label: 'Concluir com o quiz',
    description: 'Volte à Visão geral para consolidar os conceitos.',
  },
};

export function LearnLab() {
  const [tab, setTab] = useState<LabTab>('overview');
  const [quizToken, setQuizToken] = useState(0);
  const { completed, markMission, resetMissions } = useLearnMissions();

  const handleMission = useCallback(
    (missionId: string) => {
      markMission(missionId);
    },
    [markMission]
  );

  const handleResetProgress = useCallback(() => {
    resetMissions();
    clearQuizProgress();
    setQuizToken((token) => token + 1);
  }, [resetMissions]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Badge className="mb-3">Laboratório interativo · código real</Badge>
        <h1 className="text-3xl font-bold mb-2">
          Entenda um sistema de recomendação end-to-end
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Acompanhe como dados do marketplace viram vetores, exemplos de treino, um modelo
          TensorFlow.js e, por fim, recomendações exibidas para o usuário.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={tab === id ? 'default' : 'outline'}
            onClick={() => setTab(id)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={handleResetProgress} className="ml-auto gap-1">
          <RotateCcw className="h-3 w-3" />
          Resetar progresso
        </Button>
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  Comece aqui
                </Badge>
                <CardTitle className="text-2xl">
                  Primeiro entenda as conexões, depois abra cada método
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-relaxed">
                  O mapa interativo apresenta os dois fluxos do projeto: preparação e treinamento
                  do modelo; depois, recomendação em produção. Cada nó leva ao código, às variáveis
                  e ao resultado daquela etapa.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button className="gap-2" onClick={() => setTab('methods')}>
                  Abrir mapa e passo a passo
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setTab('vectors')}>
                  Explorar um vetor primeiro
                </Button>
              </CardContent>
            </Card>

            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold">O projeto em seis fases</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esta mesma ordem organiza o fluxograma e as lições do passo a passo.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PIPELINE_PHASES.map(({ number, title, description, icon: Icon }) => (
                  <div key={number} className="rounded-lg border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{number}</span>
                    </div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <ConceptPanel
              sections={OVERVIEW_CONCEPTS}
              defaultOpenId="dois-fluxos"
              description="Conceitos essenciais para interpretar o mapa, os métodos e os experimentos."
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Roteiro recomendado</CardTitle>
                <CardDescription>
                  Use o laboratório nesta ordem para sair da visão sistêmica e chegar ao
                  experimento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {LEARNING_PATH.map(({ number, tab: targetTab, title, description }) => (
                  <button
                    key={targetTab}
                    type="button"
                    onClick={() => setTab(targetTab)}
                    className="group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                      {number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{title}</span>
                      <span className="block text-xs text-muted-foreground">{description}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </button>
                ))}
                <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                  <div className="rounded-md bg-primary/5 p-3">
                    <p className="text-xs font-semibold text-primary">Cálculo real</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Funções puras são executadas com dados determinísticos do projeto.
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/60 p-3">
                    <p className="text-xs font-semibold">Execução ilustrada</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Banco, treino e gravação são explicados sem alterar dados ou o modelo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <LearnQuiz key={quizToken} onMissionComplete={handleMission} />
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <LearningMissions completed={completed} />
          </div>
        </div>
      )}

      {tab === 'methods' && <MethodExplorer onMissionComplete={handleMission} />}
      {tab === 'vectors' && <VectorExplorer onMissionComplete={handleMission} />}
      {tab === 'train' && (
        <div className="space-y-6">
          <DatasetExplorer />
          <TrainingPlayground onMissionComplete={handleMission} />
        </div>
      )}
      {tab === 'compare' && <RecommendationComparator onMissionComplete={handleMission} />}

      {tab !== 'overview' && NEXT_STEP[tab] && (
        <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">{NEXT_STEP[tab]?.label}</p>
            <p className="text-xs text-muted-foreground">{NEXT_STEP[tab]?.description}</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setTab(NEXT_STEP[tab]!.tab)}
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
