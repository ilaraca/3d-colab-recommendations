'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Ruler, Scale, Timer, Box } from 'lucide-react';
import StlPreview from '@/components/stl-preview';
import { SimilarProducts } from '@/components/similar-products';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

interface ProductDetails {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  material: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  print_time: number;
  images: { id: number; url: string }[];
  stl_file?: { url: string; filename: string };
  user: { id: number; name: string; avatar_url: string | null; rating: number };
}

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (response.ok) {
          setProduct(await response.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProduct();
  }, [params.id]);

  useEffect(() => {
    if (product?.stl_file) {
      void import('@/components/stl-preview');
    }
  }, [product?.stl_file]);

  if (loading) {
    return <div className="container py-8">Carregando...</div>;
  }

  if (!product) {
    return <div className="container py-8">Produto não encontrado.</div>;
  }

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(product.price);

  const categoryLabel =
    PRODUCT_CATEGORIES[product.category as keyof typeof PRODUCT_CATEGORIES] || product.category;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {showPreview && product.stl_file ? (
              <StlPreview url={product.stl_file.url} />
            ) : product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Box className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          {product.stl_file && (
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="w-full">
              {showPreview ? 'Ver foto' : 'Preview 3D (STL)'}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{categoryLabel}</Badge>
              <Badge variant="outline">{product.material}</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold leading-tight">{product.title}</h1>
              <p className="text-3xl font-bold text-primary">{priceFormatted}</p>
            </div>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <Card>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center gap-3 min-w-0">
                <Ruler className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm">
                  {product.width}×{product.height}×{product.depth} cm
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Scale className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm">{product.weight} kg</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Timer className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm">{product.print_time}h impressão</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm truncate">{product.user.name}</span>
              </div>
            </CardContent>
          </Card>

          <Link href="/marketplace" className="pt-2">
            <Button variant="outline">← Voltar ao marketplace</Button>
          </Link>
        </div>
      </div>

      <div className="mt-12">
        <SimilarProducts productId={product.id} />
      </div>
    </div>
  );
}
