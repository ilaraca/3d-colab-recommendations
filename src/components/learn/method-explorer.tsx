'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PipelineFlowchart } from '@/components/learn/pipeline-flowchart';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MethodLesson } from '@/lib/recommendations/education-traces';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Loader2,
  RotateCcw,
} from 'lucide-react';

interface MethodExplorerProps {
  onMissionComplete?: (missionId: string) => void;
}

const PHASES: Array<{
  id: MethodLesson['phase'];
  label: string;
}> = [
  { id: 'dados', label: '1. Dados e dataset' },
  { id: 'representacao', label: '2. Representação vetorial' },
  { id: 'treinamento', label: '3. Modelo e treinamento' },
  { id: 'persistencia', label: '4. Exportação e persistência' },
  { id: 'inferencia', label: '5. Inferência e ranking' },
  { id: 'entrega', label: '6. Orquestração e API' },
];

function JsonValue({ value }: { value: unknown }) {
  const content = JSON.stringify(value, null, 2) ?? String(value);

  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100">
      {content}
    </pre>
  );
}

export function MethodExplorer({ onMissionComplete }: MethodExplorerProps) {
  const [lessons, setLessons] = useState<MethodLesson[]>([]);
  const [lessonId, setLessonId] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/learn/method-traces')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Falha ao carregar métodos');
        return payload;
      })
      .then((payload) => {
        const nextLessons = payload.lessons ?? [];
        setLessons(nextLessons);
        setLessonId(nextLessons[0]?.id ?? '');
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : 'Falha ao carregar métodos');
      })
      .finally(() => setLoading(false));
  }, []);

  const lesson = useMemo(
    () => lessons.find((candidate) => candidate.id === lessonId) ?? lessons[0],
    [lessonId, lessons]
  );
  const step = lesson?.steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = lesson ? stepIndex === lesson.steps.length - 1 : false;
  const progress = lesson ? ((stepIndex + 1) / lesson.steps.length) * 100 : 0;

  function selectLesson(value: string) {
    setLessonId(value);
    setStepIndex(0);
  }

  function goToStep(index: number) {
    if (!lesson) return;
    const nextIndex = Math.max(0, Math.min(index, lesson.steps.length - 1));
    setStepIndex(nextIndex);
    if (nextIndex === lesson.steps.length - 1) {
      onMissionComplete?.('trace_method');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !lesson || !step) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execução guiada indisponível</CardTitle>
          <CardDescription>{error ?? 'Nenhuma lição foi encontrada.'}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PipelineFlowchart
        activeLessonId={lesson.id}
        onSelectLesson={selectLesson}
      />

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Código passo a passo</CardTitle>
          </div>
          <CardDescription>
            Use o mapa acima ou selecione um método para acompanhar suas instruções e variáveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="method-lesson">
                Método
              </label>
              <Select value={lesson.id} onValueChange={selectLesson}>
                <SelectTrigger id="method-lesson">
                  <SelectValue placeholder="Selecione um método" />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map((phase, index) => {
                    const phaseLessons = lessons.filter(
                      (candidate) => candidate.phase === phase.id
                    );
                    if (phaseLessons.length === 0) return null;

                    return (
                      <SelectGroup key={phase.id}>
                        {index > 0 && <SelectSeparator />}
                        <SelectLabel>{phase.label}</SelectLabel>
                        {phaseLessons.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.method}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => goToStep(lesson.steps.length - 1)}
            >
              Ver resultado final
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <Badge variant="outline" className="mb-1 w-fit">
              {PHASES.find((phase) => phase.id === lesson.phase)?.label}
            </Badge>
            <CardTitle className="font-mono text-base">{lesson.method}</CardTitle>
            <CardDescription className="break-all">{lesson.file}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{lesson.purpose}</p>
            <ol className="space-y-1">
              {lesson.steps.map((candidate, index) => {
                const complete = index < stepIndex;
                const active = index === stepIndex;

                return (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => goToStep(index)}
                      className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono ${
                          complete ? 'border-primary bg-primary text-primary-foreground' : ''
                        }`}
                      >
                        {complete ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      <span className={active ? 'font-medium' : undefined}>{candidate.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Passo {stepIndex + 1} de {lesson.steps.length}
                  </Badge>
                  <Badge variant={lesson.executionMode === 'illustrated' ? 'outline' : 'default'}>
                    {lesson.executionMode === 'illustrated'
                      ? 'Execução ilustrada'
                      : 'Cálculo real'}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <CardTitle className="pt-2 text-xl">{step.title}</CardTitle>
              <CardDescription>{step.explanation}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Trecho em foco
                </p>
                <pre className="overflow-x-auto rounded-md border-l-4 border-primary bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
                  <code>{step.code}</code>
                </pre>
              </div>

              {step.formula && (
                <div className="rounded-md border bg-primary/5 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    Fórmula
                  </p>
                  <p className="font-mono text-sm">{step.formula}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Variáveis de entrada</CardTitle>
                <CardDescription>Valores usados neste passo.</CardDescription>
              </CardHeader>
              <CardContent>
                <JsonValue value={step.variables} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resultado do passo</CardTitle>
                <CardDescription>Valor calculado ou efeito esperado.</CardDescription>
              </CardHeader>
              <CardContent>
                <JsonValue value={step.output} />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" className="gap-2" onClick={() => goToStep(0)}>
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-1"
                disabled={isFirstStep}
                onClick={() => goToStep(stepIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                className="gap-1"
                disabled={isLastStep}
                onClick={() => goToStep(stepIndex + 1)}
              >
                Próximo passo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
