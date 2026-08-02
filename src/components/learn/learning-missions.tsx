'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

const MISSIONS = [
  {
    id: 'trace_method',
    title: 'Percorrer um método',
    description: 'Use o mapa e acompanhe código, variáveis e resultado até o último passo.',
  },
  {
    id: 'explore_vectors',
    title: 'Explorar vetores',
    description: 'Visualize o perfil numérico de um usuário demo.',
  },
  {
    id: 'compare_users',
    title: 'Comparar Maria e João',
    description: 'Veja como históricos diferentes geram vetores distintos.',
  },
  {
    id: 'train_model',
    title: 'Treinar no browser',
    description: 'Execute model.fit() e observe loss e val_loss.',
  },
  {
    id: 'compare_algorithms',
    title: 'Content vs ML',
    description: 'Compare rankings lado a lado no comparador.',
  },
  {
    id: 'spot_overfit',
    title: 'Detectar overfit',
    description: 'Treine com ≥50 épocas e veja val_loss subir.',
  },
  {
    id: 'apply_marketplace',
    title: 'Aplicar no marketplace',
    description: 'Treine e envie o modelo para as recomendações ML reais.',
  },
  {
    id: 'quiz_passed',
    title: 'Quiz do pipeline',
    description: 'Seja aprovado em uma trilha do quiz (70% de acertos).',
  },
  {
    id: 'quiz_master',
    title: 'Quiz completo',
    description: 'Aprovado nas 4 trilhas: analogias, vocabulário, content-based e ML.',
  },
] as const;

const STORAGE_KEY = 'learn-lab-missions';

interface LearningMissionsProps {
  completed: Set<string>;
}

export function LearningMissions({ completed }: LearningMissionsProps) {
  const doneCount = MISSIONS.filter((mission) => completed.has(mission.id)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missões guiadas</CardTitle>
        <CardDescription>
          {doneCount}/{MISSIONS.length} concluídas — progresso salvo no navegador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {MISSIONS.map((mission) => {
          const done = completed.has(mission.id);
          return (
            <div
              key={mission.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{mission.title}</p>
                  {done && <Badge variant="secondary">OK</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{mission.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function useLearnMissions() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompleted(new Set(JSON.parse(stored) as string[]));
      }
    } catch {
      // ignore
    }
  }, []);

  const markMission = useCallback((missionId: string) => {
    setCompleted((prev) => {
      if (prev.has(missionId)) return prev;
      const next = new Set(prev);
      next.add(missionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const resetMissions = useCallback(() => {
    setCompleted(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { completed, markMission, resetMissions };
}
