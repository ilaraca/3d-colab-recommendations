'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureTooltip } from '@/components/learn/feature-tooltip';
import { Loader2 } from 'lucide-react';

interface TrainingPair {
  userName: string;
  productTitle: string;
  productCategory?: string;
  productMaterial?: string;
  label: number;
  labelText: string;
}

export function DatasetExplorer() {
  const [pairs, setPairs] = useState<TrainingPair[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learn/training-pairs?limit=16')
      .then((response) => response.json())
      .then((payload) => {
        setPairs(payload.pairs ?? []);
        setTotal(payload.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Inspecione os pares de treino</CardTitle>
        <CardDescription>
          Cada linha é um exemplo supervisionado: vetor concatenado + label 0/1.{' '}
          <FeatureTooltip
            label="Leave-one-out"
            description="Exclui o produto rotulado do perfil do usuário — evita vazamento de informação."
          />{' '}
          no encode do usuário.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Mostrando {pairs.length} de {total} pares do dataset
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Usuário</th>
                    <th className="pb-2 pr-4 font-medium">Produto</th>
                    <th className="pb-2 pr-4 font-medium">Atributos</th>
                    <th className="pb-2 font-medium">Label</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((pair, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 pr-4">{pair.userName}</td>
                      <td className="py-2 pr-4">{pair.productTitle}</td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">
                        {pair.productCategory} · {pair.productMaterial}
                      </td>
                      <td className="py-2">
                        <Badge variant={pair.label === 1 ? 'default' : 'secondary'}>
                          {pair.labelText}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
