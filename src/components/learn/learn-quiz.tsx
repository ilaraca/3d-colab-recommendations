'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  QUIZ_TOTAL_QUESTIONS,
  QUIZ_TRACKS,
  quizPassThreshold,
} from '@/lib/recommendations/quiz-questions';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';

const STORAGE_KEY = 'learn-lab-quiz';

interface StoredQuiz {
  answers: Record<string, number>;
  checked: string[];
}

interface LearnQuizProps {
  onMissionComplete?: (missionId: string) => void;
}

export function clearQuizProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function LearnQuiz({ onMissionComplete }: LearnQuizProps) {
  const [activeTrackId, setActiveTrackId] = useState(QUIZ_TRACKS[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checkedTracks, setCheckedTracks] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredQuiz;
        setAnswers(parsed.answers ?? {});
        setCheckedTracks(new Set(parsed.checked ?? []));
      }
    } catch {
      // progresso anterior ilegível: começa do zero
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: StoredQuiz = { answers, checked: [...checkedTracks] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [answers, checkedTracks, hydrated]);

  const activeTrack = useMemo(
    () => QUIZ_TRACKS.find((track) => track.id === activeTrackId) ?? QUIZ_TRACKS[0],
    [activeTrackId]
  );

  const scoreOf = useCallback(
    (trackId: string) => {
      const track = QUIZ_TRACKS.find((item) => item.id === trackId);
      if (!track) return 0;
      return track.questions.filter((question) => answers[question.id] === question.correct).length;
    },
    [answers]
  );

  const isPassed = useCallback(
    (trackId: string) => {
      const track = QUIZ_TRACKS.find((item) => item.id === trackId);
      if (!track || !checkedTracks.has(trackId)) return false;
      return scoreOf(trackId) >= quizPassThreshold(track.questions.length);
    },
    [checkedTracks, scoreOf]
  );

  const passedCount = QUIZ_TRACKS.filter((track) => isPassed(track.id)).length;
  const answeredCount = QUIZ_TRACKS.reduce(
    (total, track) =>
      total + track.questions.filter((question) => answers[question.id] !== undefined).length,
    0
  );

  const activeChecked = checkedTracks.has(activeTrack.id);
  const activeScore = scoreOf(activeTrack.id);
  const activeThreshold = quizPassThreshold(activeTrack.questions.length);
  const activeAnswered = activeTrack.questions.filter(
    (question) => answers[question.id] !== undefined
  ).length;

  function handleCheck() {
    const next = new Set(checkedTracks);
    next.add(activeTrack.id);
    setCheckedTracks(next);

    if (activeScore >= activeThreshold) {
      onMissionComplete?.('quiz_passed');

      const allPassed = QUIZ_TRACKS.every((track) => {
        if (track.id === activeTrack.id) return true;
        return (
          next.has(track.id) && scoreOf(track.id) >= quizPassThreshold(track.questions.length)
        );
      });

      if (allPassed) onMissionComplete?.('quiz_master');
    }
  }

  function handleRetryTrack() {
    setAnswers((prev) => {
      const next = { ...prev };
      activeTrack.questions.forEach((question) => delete next[question.id]);
      return next;
    });
    setCheckedTracks((prev) => {
      const next = new Set(prev);
      next.delete(activeTrack.id);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz do laboratório</CardTitle>
        <CardDescription>
          {QUIZ_TRACKS.length} trilhas · {passedCount}/{QUIZ_TRACKS.length} aprovadas ·{' '}
          {answeredCount}/{QUIZ_TOTAL_QUESTIONS} perguntas respondidas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {QUIZ_TRACKS.map((track) => {
            const passed = isPassed(track.id);
            const selected = track.id === activeTrack.id;
            return (
              <Button
                key={track.id}
                variant={selected ? 'default' : 'outline'}
                size="sm"
                className="h-auto py-2 flex-col items-start gap-0.5"
                onClick={() => setActiveTrackId(track.id)}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  {passed && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {track.label}
                </span>
                <span className="text-[11px] font-normal opacity-70">
                  {track.summary} · {track.questions.length}
                </span>
              </Button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground border-l-2 pl-3">{activeTrack.description}</p>

        <div className="space-y-6">
          {activeTrack.questions.map((question, questionIndex) => (
            <div key={question.id} className="space-y-2">
              <p className="font-medium text-sm">
                {questionIndex + 1}. {question.question}
              </p>
              <div className="space-y-1">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  const isCorrect = optionIndex === question.correct;
                  let variant: 'outline' | 'default' | 'secondary' = 'outline';

                  if (activeChecked && selected && isCorrect) variant = 'default';
                  else if (activeChecked && selected && !isCorrect) variant = 'secondary';

                  return (
                    <Button
                      key={optionIndex}
                      variant={selected && !activeChecked ? 'default' : variant}
                      size="sm"
                      className="w-full justify-start h-auto py-2 text-left font-normal whitespace-normal"
                      disabled={activeChecked}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
                      }
                    >
                      {activeChecked && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 mr-2 shrink-0 text-primary" />
                      )}
                      {activeChecked && selected && !isCorrect && (
                        <XCircle className="h-4 w-4 mr-2 shrink-0 text-destructive" />
                      )}
                      {option}
                    </Button>
                  );
                })}
              </div>
              {activeChecked && (
                <p className="text-xs text-muted-foreground pl-1">{question.explanation}</p>
              )}
            </div>
          ))}
        </div>

        {!activeChecked ? (
          <div className="space-y-2">
            <Button
              onClick={handleCheck}
              disabled={activeAnswered < activeTrack.questions.length}
              className="w-full"
            >
              Verificar respostas
            </Button>
            {activeAnswered < activeTrack.questions.length && (
              <p className="text-xs text-muted-foreground text-center">
                Faltam {activeTrack.questions.length - activeAnswered} de{' '}
                {activeTrack.questions.length} nesta trilha
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center space-y-2">
              <p className="font-semibold">
                {activeScore}/{activeTrack.questions.length} corretas
              </p>
              {activeScore >= activeThreshold ? (
                <Badge>Trilha {activeTrack.label} aprovada</Badge>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Precisa de {activeThreshold} acertos. Leia as explicações e tente de novo.
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRetryTrack} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Refazer esta trilha
            </Button>
          </div>
        )}

        {passedCount === QUIZ_TRACKS.length && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-center">
            <p className="text-sm font-medium">
              Todas as trilhas aprovadas — das analogias aos métodos content-based e ML.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
