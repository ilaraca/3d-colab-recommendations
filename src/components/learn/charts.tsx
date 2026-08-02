'use client';

import { FeatureTooltip } from '@/components/learn/feature-tooltip';
import { describeFeatureLabel } from '@/lib/recommendations/feature-descriptions';

interface LossChartProps {
  logs: Array<{ epoch: number; loss: number; valLoss: number }>;
  className?: string;
}

export function LossChart({ logs, className }: LossChartProps) {
  if (logs.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 rounded-lg border border-dashed text-sm text-muted-foreground ${className ?? ''}`}>
        Treine o modelo para ver o gráfico de loss
      </div>
    );
  }

  const width = 480;
  const height = 200;
  const padding = 32;
  const maxLoss = Math.max(...logs.flatMap((log) => [log.loss, log.valLoss]), 0.01);

  const toX = (epoch: number) =>
    padding + ((epoch - 1) / Math.max(logs.length - 1, 1)) * (width - padding * 2);
  const toY = (value: number) =>
    height - padding - (value / maxLoss) * (height - padding * 2);

  const toPoints = (key: 'loss' | 'valLoss') =>
    logs.map((log) => `${toX(log.epoch)},${toY(log[key])}`).join(' ');

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 bg-muted/20 rounded-lg">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * (height - padding * 2);
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
            />
          );
        })}
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          points={toPoints('loss')}
        />
        <polyline
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          strokeDasharray="6 4"
          points={toPoints('valLoss')}
        />
      </svg>
      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-primary" /> loss (treino)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-destructive border-dashed" /> val_loss
        </span>
      </div>
    </div>
  );
}

interface VectorBarChartProps {
  labels: string[];
  values: number[];
  title: string;
  maxBars?: number;
}

export function VectorBarChart({ labels, values, title, maxBars = 12 }: VectorBarChartProps) {
  const pairs = labels
    .map((label, index) => ({ label, value: values[index] ?? 0 }))
    .filter((entry) => Math.abs(entry.value) > 0.001)
    .sort((a, b) => b.value - a.value)
    .slice(0, maxBars);

  const maxValue = Math.max(...pairs.map((entry) => entry.value), 0.01);

  return (
    <div>
      <p className="text-sm font-medium mb-3">{title}</p>
      {pairs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Vetor vazio ou zerado (cold start)</p>
      ) : (
        <div className="space-y-2 overflow-visible">
          {pairs.map((entry) => (
            <div key={entry.label} className="grid grid-cols-[120px_1fr_40px] gap-2 items-center text-xs overflow-visible">
              <FeatureTooltip
                label={entry.label}
                description={describeFeatureLabel(entry.label)}
                className="text-muted-foreground"
              />
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(entry.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="text-right tabular-nums">{entry.value.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-3">Passe o mouse sobre o nome da feature para ver a explicação.</p>
    </div>
  );
}
