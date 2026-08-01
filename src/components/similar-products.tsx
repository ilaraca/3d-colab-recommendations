'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';

interface SimilarProductsProps {
  productId: number;
  limit?: number;
}

export function SimilarProducts({ productId, limit = 4 }: SimilarProductsProps) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilar() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/recommendations?mode=similar&productId=${productId}&limit=${limit}`
        );
        if (!response.ok) return;
        const data = await response.json();
        setItems(data.items ?? []);
      } catch (error) {
        console.error('Failed to fetch similar products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilar();
  }, [productId, limit]);

  if (loading) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Produtos similares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">Produtos similares</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <ProductCard key={item.id as number} product={item as Parameters<typeof ProductCard>[0]['product']} />
        ))}
      </div>
    </section>
  );
}
