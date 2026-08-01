'use client';

import dynamic from 'next/dynamic';
import { Box } from 'lucide-react';

const ThreeScene = dynamic(() => import('./three-scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <div className="animate-pulse">
        <Box className="w-12 h-12 text-muted-foreground" />
      </div>
    </div>
  ),
});

export interface StlPreviewProps {
  url: string;
}

export default function StlPreview({ url }: StlPreviewProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px', position: 'relative' }}>
      <ThreeScene url={url} />
    </div>
  );
} 