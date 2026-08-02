'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlossaryLabel } from '@/components/learn/glossary-label';
import { Loader2, Scale } from 'lucide-react';

interface DemoUser {
  id: number;
  name: string;
  email: string;
  hint: string;
}

interface RecommendationItem {
  id: number;
  title: string;
  category: string;
  material: string;
  score: number;
}

interface RecommendationResult {
  items: RecommendationItem[];
  meta?: { source?: string };
  error?: string;
}

interface RecommendationComparatorProps {
  onMissionComplete?: (missionId: string) => void;
}

function RecommendationList({
  title,
  items,
  source,
  loading,
  error,
}: {
  title: string;
  items: RecommendationItem[];
  source: string;
  loading: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Badge variant="outline">{source}</Badge>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-lg border p-3 text-sm"
            >
              <span className="font-mono text-muted-foreground w-5">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.category} · {item.material}
                </p>
              </div>
              <span className="font-mono text-xs tabular-nums">{item.score.toFixed(3)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function RecommendationComparator({ onMissionComplete }: RecommendationComparatorProps) {
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('maria@demo.com');
  const [contentResult, setContentResult] = useState<RecommendationResult | null>(null);
  const [mlResult, setMlResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelAvailable, setModelAvailable] = useState(false);

  useEffect(() => {
    fetch('/api/learn/demo-users')
      .then((response) => response.json())
      .then((payload) => setDemoUsers(payload.users ?? []));

    fetch('/api/learn/model-status')
      .then((response) => response.json())
      .then((payload) => setModelAvailable(Boolean(payload.available)));
  }, []);

  useEffect(() => {
    async function compare() {
      setLoading(true);
      setContentResult(null);
      setMlResult(null);

      const [contentResponse, mlResponse] = await Promise.all([
        fetch(
          `/api/learn/recommendations?email=${encodeURIComponent(selectedEmail)}&source=content&limit=6`
        ),
        fetch(
          `/api/learn/recommendations?email=${encodeURIComponent(selectedEmail)}&source=ml&limit=6`
        ),
      ]);

      const contentData = await contentResponse.json();
      const mlData = await mlResponse.json();

      setContentResult(
        contentResponse.ok
          ? contentData
          : { items: [], error: contentData.error ?? 'Erro ao carregar' }
      );
      setMlResult(
        mlResponse.ok
          ? mlData
          : { items: [], error: mlData.error ?? 'Modelo ML indisponível' }
      );

      if (contentResponse.ok) {
        onMissionComplete?.('compare_algorithms');
      }

      setLoading(false);
    }

    compare();
  }, [selectedEmail, onMissionComplete]);

  const contentIds = new Set(contentResult?.items.map((item) => item.id) ?? []);
  const mlIds = new Set(mlResult?.items.map((item) => item.id) ?? []);
  const onlyContent = [...contentIds].filter((id) => !mlIds.has(id));
  const onlyMl = [...mlIds].filter((id) => !contentIds.has(id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Content-based vs Rede Neural
          </CardTitle>
          <CardDescription>
            Mesmo usuário, dois algoritmos: content-based usa{' '}
            <GlossaryLabel term="cosseno" glossaryKey="cosseno" />; ML usa a rede treinada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {demoUsers.map((user) => (
              <Button
                key={user.email}
                size="sm"
                variant={selectedEmail === user.email ? 'default' : 'outline'}
                onClick={() => setSelectedEmail(user.email)}
              >
                {user.name}
              </Button>
            ))}
          </div>

          {!modelAvailable && (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3">
              Modelo ML do servidor não encontrado. Rode{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">npm run recommendations:train</code>{' '}
              ou treine no playground — o comparador ML usa o modelo salvo em disco.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <RecommendationList
              title="Content-based — Cosseno"
              items={contentResult?.items ?? []}
              source="content"
              loading={loading}
              error={contentResult?.error}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <RecommendationList
              title="ML — Rede Neural"
              items={mlResult?.items ?? []}
              source="ml"
              loading={loading}
              error={mlResult?.error}
            />
          </CardContent>
        </Card>
      </div>

      {!loading && contentResult?.items.length && mlResult?.items.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diferenças no ranking</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Só no content-based</p>
              {onlyContent.length === 0 ? (
                <p className="text-muted-foreground">Nenhum — rankings idênticos</p>
              ) : (
                <ul className="space-y-1 text-muted-foreground">
                  {onlyContent.map((id) => {
                    const item = contentResult.items.find((entry) => entry.id === id);
                    return <li key={id}>{item?.title}</li>;
                  })}
                </ul>
              )}
            </div>
            <div>
              <p className="font-medium mb-2">Só na rede neural</p>
              {onlyMl.length === 0 ? (
                <p className="text-muted-foreground">Nenhum — rankings idênticos</p>
              ) : (
                <ul className="space-y-1 text-muted-foreground">
                  {onlyMl.map((id) => {
                    const item = mlResult.items.find((entry) => entry.id === id);
                    return <li key={id}>{item?.title}</li>;
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
