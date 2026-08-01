'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/product-card';
import { RecommendationsSection } from '@/components/recommendations-section';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface MarketplaceItem {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  material: string;
  user: { id: number; name: string; avatar_url?: string };
  images: { id: number; url: string }[];
  stl_file?: { url: string; filename: string };
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const [localCategory, setLocalCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const response = await fetch(`/api/marketplace?${searchParams.toString()}`);
        const data = await response.json();
        setItems(data.items ?? []);
        setPagination(data.pagination);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (localSearch) params.set('search', localSearch);
    if (localCategory !== 'all') params.set('category', localCategory);
    params.set('page', '1');
    router.push(`/marketplace?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace 3D</h1>
        <p className="text-muted-foreground">
          Catálogo de produtos com recomendação personalizada por similaridade de cosseno
        </p>
      </div>

      <RecommendationsSection className="mb-10" limit={4} />

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="pl-10"
          />
        </div>
        <Select value={localCategory} onValueChange={setLocalCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="decorative">Decorativo</SelectItem>
            <SelectItem value="functional">Funcional</SelectItem>
            <SelectItem value="educational">Educacional</SelectItem>
            <SelectItem value="figure">Figuras</SelectItem>
            <SelectItem value="prototype">Protótipo</SelectItem>
            <SelectItem value="part">Peças</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={applyFilters}>Filtrar</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{pagination.totalCount} produtos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.currentPage <= 1}
                onClick={() => goToPage(pagination.currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => goToPage(pagination.currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="container py-8">Carregando...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
