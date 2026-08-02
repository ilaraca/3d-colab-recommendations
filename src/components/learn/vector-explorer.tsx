'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VectorBarChart } from '@/components/learn/charts';
import { ConceptPanel } from '@/components/learn/concept-panel';
import { FeatureTooltip } from '@/components/learn/feature-tooltip';
import { VECTORS_CONCEPTS } from '@/lib/recommendations/lab-concepts';
import { WEIGHT_DESCRIPTIONS } from '@/lib/recommendations/feature-descriptions';
import { Loader2 } from 'lucide-react';

interface DemoUser {
  id: number;
  name: string;
  email: string;
  hint: string;
}

interface VectorResponse {
  user: { name: string; email: string };
  hasPurchases: boolean;
  featureLabels: string[];
  featureWeights: Record<string, number>;
  purchases?: Array<{ id: number; title: string; category: string; material: string }>;
  userVector: number[] | null;
}

interface VectorExplorerProps {
  onMissionComplete?: (missionId: string) => void;
}

export function VectorExplorer({ onMissionComplete }: VectorExplorerProps) {
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('maria@demo.com');
  const [viewedEmails, setViewedEmails] = useState<Set<string>>(new Set());
  const [data, setData] = useState<VectorResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learn/demo-users')
      .then((response) => response.json())
      .then((payload) => setDemoUsers(payload.users ?? []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/learn/vectors?email=${encodeURIComponent(selectedEmail)}`)
      .then((response) => response.json())
      .then((payload) => {
        setData(payload);
        setViewedEmails((prev) => {
          const next = new Set(prev);
          next.add(selectedEmail);
          return next;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedEmail]);

  useEffect(() => {
    if (viewedEmails.size >= 1) onMissionComplete?.('explore_vectors');
    if (viewedEmails.has('maria@demo.com') && viewedEmails.has('joao@demo.com')) {
      onMissionComplete?.('compare_users');
    }
  }, [viewedEmails, onMissionComplete]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personas demo</CardTitle>
          <CardDescription>
            Cada usuário vira um vetor numérico — a base do content-based e da rede neural.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoUsers.map((user) => (
            <Button
              key={user.email}
              variant={selectedEmail === user.email ? 'default' : 'outline'}
              className="w-full justify-start h-auto py-3"
              onClick={() => setSelectedEmail(user.email)}
            >
              <div className="text-left">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs opacity-80">{user.hint}</div>
              </div>
            </Button>
          ))}

          {data && (
            <div className="pt-2 space-y-2">
              <p className="text-sm font-medium">Histórico de compras</p>
              {!data.hasPurchases ? (
                <p className="text-sm text-muted-foreground">Sem compras concluídas.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {data.purchases?.map((product) => (
                    <li key={product.id} className="flex items-center gap-2">
                      <Badge variant="secondary">{product.category}</Badge>
                      <span>{product.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vetor codificado</CardTitle>
          <CardDescription>
            Pipeline: produto → encode → média das compras = perfil do usuário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.userVector ? (
            <VectorBarChart
              labels={data.featureLabels}
              values={data.userVector}
              title={`Perfil de ${data.user.name}`}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Usuário sem histórico — o sistema usa produtos populares (cold start).
            </p>
          )}

          {data && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium mb-3">Pesos da codificação</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(data.featureWeights).map(([key, weight]) => (
                  <div
                    key={key}
                    className="flex justify-between rounded-md bg-muted/50 px-3 py-2 overflow-visible"
                  >
                    <FeatureTooltip
                      label={key}
                      description={WEIGHT_DESCRIPTIONS[key] ?? 'Peso da feature no cálculo de similaridade.'}
                      className="text-muted-foreground"
                    />
                    <span className="font-mono">{weight.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
      <ConceptPanel
        sections={VECTORS_CONCEPTS}
        title="Entenda o que você observou"
        description="Consulte a explicação sobre perfil, pesos e cold start quando precisar."
      />
    </div>
  );
}
