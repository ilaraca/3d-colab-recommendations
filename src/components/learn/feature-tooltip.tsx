'use client';

import { cn } from '@/lib/utils';

interface FeatureTooltipProps {
  label: React.ReactNode;
  description: string;
  className?: string;
}

export function FeatureTooltip({ label, description, className }: FeatureTooltipProps) {
  return (
    <span className={cn('relative inline-flex max-w-full group/feature-tip', className)}>
      <span className="truncate cursor-help border-b border-dotted border-muted-foreground/40">
        {label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-max max-w-[240px] rounded-md border bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground shadow-md opacity-0 invisible translate-y-0.5 group-hover/feature-tip:opacity-100 group-hover/feature-tip:visible group-hover/feature-tip:translate-y-0 transition-all duration-150"
      >
        {description}
      </span>
    </span>
  );
}
