'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, Loader2 } from 'lucide-react';

const ThreeScene = dynamic(() => import('./three-scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Iniciando visualizador 3D…</span>
    </div>
  ),
});

export interface StlPreviewProps {
  url: string;
}

export default function StlPreview({ url }: StlPreviewProps) {
  // Pré-carrega Three.js + STLLoader assim que o preview é montado
  useEffect(() => {
    void import('./three-scene');
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <ThreeScene url={url} />
    </div>
  );
}
