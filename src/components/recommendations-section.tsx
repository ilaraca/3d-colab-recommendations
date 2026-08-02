'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

type SourceToggle = 'auto' | 'content' | 'ml' | 'both';

interface RecommendationItem {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  material: string;
  score: number;
  user: { id: number; name: string; avatar_url?: string };
  images: Array<{ id: number; url: string }>;
}

interface RecommendationsSectionProps {
  title?: string;
  limit?: number;
  className?: string;
}

const SOURCE_OPTIONS: Array<{ value: SourceToggle; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'content', label: 'Content' },
  { value: 'ml', label: 'ML' },
  { value: 'both', label: 'Ambos' },
];

function ItemsGrid({ items }: { items: RecommendationItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <ProductCard
          key={item.id}
          product={{
            ...item,
            images: item.images,
            score: item.score,
          }}
        />
      ))}
    </div>
  );
}

export function RecommendationsSection({
  title = 'Recomendados para você',
  limit = 8,
  className,
}: RecommendationsSectionProps) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [mlItems, setMlItems] = useState<RecommendationItem[]>([]);
  const [mode, setMode] = useState<string>('popular');
  const [source, setSource] = useState<string | undefined>();
  const [sourceToggle, setSourceToggle] = useState<SourceToggle>('auto');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      try {
        if (sourceToggle === 'both' && user) {
          const [contentRes, mlRes] = await Promise.all([
            fetch(`/api/recommendations?limit=${limit}&source=content`),
            fetch(`/api/recommendations?limit=${limit}&source=ml`),
          ]);
          const contentData = contentRes.ok ? await contentRes.json() : { items: [] };
          const mlData = mlRes.ok ? await mlRes.json() : { items: [] };
          setItems(contentData.items ?? []);
          setMlItems(mlData.items ?? []);
          setMode(contentData.meta?.mode ?? 'popular');
          setSource('both');
        } else {
          const response = await fetch(
            `/api/recommendations?limit=${limit}&source=${sourceToggle}`
          );
          if (!response.ok) {
            setItems([]);
            setMlItems([]);
            return;
          }
          const data = await response.json();
          setItems(data.items ?? []);
          setMlItems([]);
          setMode(data.meta?.mode ?? 'popular');
          setSource(data.meta?.source);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchRecommendations();
    }
  }, [user, authLoading, limit, sourceToggle]);

  if (loading) {
    return (
      <section className={className}>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0 && mlItems.length === 0) return null;

  const sectionTitle =
    mode === 'personalized'
      ? title
      : mode === 'popular'
        ? 'Mais populares'
        : title;

  const showToggle = mode === 'personalized' && user;

  return (
    <section className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {sectionTitle}
          </h2>
          {mode === 'personalized' && source !== 'both' && (
            <span className="text-xs text-muted-foreground">
              {source === 'ml'
                ? 'Rede neural (TensorFlow)'
                : source === 'content'
                  ? 'Similaridade de cosseno'
                  : 'Personalizado (auto)'}
            </span>
          )}
        </div>

        {showToggle && (
          <div className="flex flex-wrap gap-1">
            {SOURCE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={sourceToggle === option.value ? 'default' : 'outline'}
                onClick={() => setSourceToggle(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {sourceToggle === 'both' && mode === 'personalized' ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium mb-3 text-muted-foreground">Content-based</p>
            {items.length > 0 ? (
              <ItemsGrid items={items} />
            ) : (
              <p className="text-sm text-muted-foreground">Sem resultados</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium mb-3 text-muted-foreground">ML — Rede neural</p>
            {mlItems.length > 0 ? (
              <ItemsGrid items={mlItems} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Modelo ML indisponível — treine no{' '}
                <a href="/learn" className="underline">
                  laboratório
                </a>
              </p>
            )}
          </div>
        </div>
      ) : (
        <ItemsGrid items={items} />
      )}
    </section>
  );
}
