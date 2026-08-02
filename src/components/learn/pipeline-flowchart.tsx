'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Code2,
  Database,
  GitBranch,
  Layers,
  Monitor,
  PackageCheck,
  Server,
  SlidersHorizontal,
  Split,
} from 'lucide-react';

interface PipelineFlowchartProps {
  activeLessonId?: string;
  onSelectLesson: (lessonId: string) => void;
}

interface FlowNodeProps {
  id: string;
  step: number;
  title: string;
  description: string;
  icon: typeof Database;
  activeLessonId?: string;
  onSelectLesson: (lessonId: string) => void;
  tone?: 'default' | 'ml' | 'content';
}

function FlowNode({
  id,
  step,
  title,
  description,
  icon: Icon,
  activeLessonId,
  onSelectLesson,
  tone = 'default',
}: FlowNodeProps) {
  return (
    <button
      type="button"
      onClick={() => onSelectLesson(id)}
      className={cn(
        'group relative min-h-28 w-full rounded-lg border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        activeLessonId === id && 'border-primary bg-primary/10 ring-1 ring-primary',
        tone === 'ml' && 'border-violet-500/40 bg-violet-500/5',
        tone === 'content' && 'border-amber-500/40 bg-amber-500/5'
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{step}</span>
      </div>
      <p className="text-xs font-semibold leading-tight">{title}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{description}</p>
    </button>
  );
}

function HorizontalArrow() {
  return (
    <div className="hidden items-center justify-center text-muted-foreground lg:flex">
      <ArrowRight className="h-5 w-5" />
    </div>
  );
}

export function PipelineFlowchart({
  activeLessonId,
  onSelectLesson,
}: PipelineFlowchartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitBranch className="h-5 w-5 text-primary" />
              Mapa end-to-end
            </CardTitle>
            <CardDescription className="mt-1">
              Comece por este fluxo. Clique em qualquer etapa para abrir seus métodos no passo a
              passo.
            </CardDescription>
          </div>
          <Badge variant="outline">Banco → modelo → recomendação → tela</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge>Fluxo A</Badge>
            <p className="text-sm font-medium">Preparação e treinamento</p>
          </div>
          <div className="grid items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
            <FlowNode
              id="load-source-data"
              step={1}
              title="Prisma / PostgreSQL"
              description="Produtos e compras concluídas"
              icon={Database}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
            <HorizontalArrow />
            <FlowNode
              id="build-context"
              step={2}
              title="Contexto"
              description="Min/max e índices categóricos"
              icon={SlidersHorizontal}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
            <HorizontalArrow />
            <FlowNode
              id="encode-product"
              step={3}
              title="Vetorização"
              description="Produto e usuário viram números"
              icon={Layers}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
            <HorizontalArrow />
            <FlowNode
              id="create-training-data"
              step={4}
              title="Dataset"
              description="Pares user × product e labels"
              icon={Code2}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
            <HorizontalArrow />
            <FlowNode
              id="split-by-user"
              step={5}
              title="Split por usuário"
              description="Treino 80% e validação 20%"
              icon={Split}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
            <HorizontalArrow />
            <FlowNode
              id="train-model"
              step={6}
              title="Treinamento"
              description="Browser ou servidor ajusta pesos"
              icon={Brain}
              tone="ml"
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
          </div>

          <div className="my-2 flex justify-center text-muted-foreground">
            <ArrowDown className="h-5 w-5" />
          </div>

          <div className="mx-auto max-w-sm">
            <FlowNode
              id="save-load-model"
              step={7}
              title="Modelo persistido"
              description="model.json + weights.bin + metadata.json"
              icon={PackageCheck}
              tone="ml"
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
          </div>
        </section>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ArrowDown className="h-4 w-4" />
          O modelo salvo fica disponível para as requisições de produção
          <ArrowDown className="h-4 w-4" />
        </div>

        <section className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="secondary">Fluxo B</Badge>
            <p className="text-sm font-medium">Recomendação em produção</p>
          </div>
          <div className="grid items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.35fr_auto_1fr]">
            <FlowNode
              id="recommendations-api"
              step={8}
              title="Requisição"
              description="Sessão, modo, fonte e limite"
              icon={Server}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
            <HorizontalArrow />
            <FlowNode
              id="recommend-orchestrator"
              step={9}
              title="Orquestração"
              description="Histórico, contexto e candidatos"
              icon={GitBranch}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
            <HorizontalArrow />
            <FlowNode
              id="score-products-ml"
              step={10}
              title="Entrada da inferência"
              description="[vetor usuário | vetor produto]"
              icon={Layers}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
            <HorizontalArrow />

            <div className="grid gap-2">
              <FlowNode
                id="predict-batch"
                step={11}
                title="Caminho ML"
                description="Modelo carregado → score 0–1"
                icon={Brain}
                tone="ml"
                activeLessonId={activeLessonId}
                onSelectLesson={onSelectLesson}
              />
              <div className="flex items-center gap-2 px-2 text-[10px] text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                source=auto tenta ML; content é o fallback
              </div>
              <FlowNode
                id="content-fallback"
                step={11}
                title="Caminho Content"
                description="Cosseno ou popularidade"
                icon={SlidersHorizontal}
                tone="content"
                activeLessonId={activeLessonId}
                onSelectLesson={onSelectLesson}
              />
            </div>

            <HorizontalArrow />
            <FlowNode
              id="ui-consumers"
              step={12}
              title="Ranking na interface"
              description="Ordena, limita e renderiza ProductCard"
              icon={Monitor}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
            />
          </div>
        </section>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-xs">
            <span className="font-medium">Roxo:</span>{' '}
            <span className="text-muted-foreground">rede neural e modelo persistido</span>
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
            <span className="font-medium">Amarelo:</span>{' '}
            <span className="text-muted-foreground">content-based e fallback popular</span>
          </div>
          <div className="rounded-md border px-3 py-2 text-xs">
            <span className="font-medium">Clique:</span>{' '}
            <span className="text-muted-foreground">abre diretamente a lição correspondente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
