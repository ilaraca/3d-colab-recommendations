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
              <Image src={product.images[0].url} alt={product.title} fill className="object-cover" />
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

        <div className="space-y-6">
          <div>
            <div className="flex gap-2 mb-2">
              <Badge>{categoryLabel}</Badge>
              <Badge variant="outline">{product.material}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{product.title}</h1>
            <p className="text-3xl font-bold text-primary mt-2">{priceFormatted}</p>
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {product.width}×{product.height}×{product.depth} cm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{product.weight} kg</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{product.print_time}h impressão</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{product.user.name}</span>
              </div>
            </CardContent>
          </Card>

          <Link href="/marketplace">
            <Button variant="outline">← Voltar ao marketplace</Button>
          </Link>
        </div>
      </div>

      <SimilarProducts productId={product.id} />
    </div>
  );
}
