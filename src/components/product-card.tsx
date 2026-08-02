'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { User, Box } from 'lucide-react';
import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';

const StlPreview = dynamic(() => import('./stl-preview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <Box className="w-8 h-8 text-muted-foreground animate-pulse" />
    </div>
  ),
});

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    description: string;
    price: number;
    category: string;
    material?: string;
    user?: { id: number; name: string; avatar_url?: string | null };
    images?: { id: number; url: string }[];
    stl_file?: { url: string; filename: string };
    score?: number;
  };
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const categoryLabel =
    PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES] || product.category;

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price);

  const imageBlock = (
    <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
      {showPreview && product.stl_file?.url ? (
        <StlPreview url={product.stl_file.url} />
      ) : product.images?.[0] ? (
        <Image
          src={product.images[0].url}
          alt={product.title}
          fill
          sizes={viewMode === 'list' ? '192px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Box className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      {product.stl_file && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setShowPreview(!showPreview);
          }}
          className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-xs backdrop-blur"
        >
          {showPreview ? 'Foto' : '3D'}
        </button>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <Link href={`/products/${product.id}`}>
        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex">
            <div className="relative w-48 flex-shrink-0">{imageBlock}</div>
            <CardContent className="flex-1 p-4">
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-bold text-primary">{priceFormatted}</span>
                <Badge variant="secondary">{categoryLabel}</Badge>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.id}`}>
      <Card className={cn('hover:shadow-md transition-shadow overflow-hidden h-full')}>
        {imageBlock}
        <CardHeader className="p-4 pb-2">
          <h3 className="font-semibold line-clamp-1">{product.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{product.user?.name ?? 'Maker'}</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">{priceFormatted}</span>
            <div className="flex gap-1">
              <Badge variant="secondary">{categoryLabel}</Badge>
              {product.material && <Badge variant="outline">{product.material}</Badge>}
            </div>
          </div>
          {product.score !== undefined && (
            <p className="mt-1 text-xs text-muted-foreground">
              Relevância: {(product.score * 100).toFixed(0)}%
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
