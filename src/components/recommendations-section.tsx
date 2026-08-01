'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

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

export function RecommendationsSection({
  title = 'Recomendados para você',
  limit = 8,
  className,
}: RecommendationsSectionProps) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [mode, setMode] = useState<string>('popular');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      try {
        const response = await fetch(`/api/recommendations?limit=${limit}`);
        if (!response.ok) return;
        const data = await response.json();
        setItems(data.items ?? []);
        setMode(data.meta?.mode ?? 'popular');
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchRecommendations();
    }
  }, [user, authLoading, limit]);

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

  if (items.length === 0) return null;

  const sectionTitle =
    mode === 'personalized'
      ? title
      : mode === 'popular'
        ? 'Mais populares'
        : title;

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {sectionTitle}
        </h2>
        {mode === 'personalized' && (
          <span className="text-xs text-muted-foreground">Personalizado com IA content-based</span>
        )}
      </div>
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
    </section>
  );
}
