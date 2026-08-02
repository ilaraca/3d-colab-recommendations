'use client';

import { FeatureTooltip } from '@/components/learn/feature-tooltip';
import { LAB_GLOSSARY } from '@/lib/recommendations/lab-concepts';

interface GlossaryLabelProps {
  term: string;
  glossaryKey?: string;
  className?: string;
}

export function GlossaryLabel({ term, glossaryKey, className }: GlossaryLabelProps) {
  const key = glossaryKey ?? term;
  const description = LAB_GLOSSARY[key];

  if (!description) {
    return <span className={className}>{term}</span>;
  }

  return (
    <FeatureTooltip label={term} description={description} className={className} />
  );
}
