'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConceptSection } from '@/lib/recommendations/lab-concepts';
import { BookOpen, ChevronDown } from 'lucide-react';

interface ConceptPanelProps {
  sections: ConceptSection[];
  title?: string;
  description?: string;
  defaultOpenId?: string;
}

function ConceptSectionBlock({
  section,
  defaultOpen,
}: {
  section: ConceptSection;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border bg-muted/20 open:bg-muted/30 transition-colors"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>{section.title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t px-4 pb-4 pt-3 text-sm text-muted-foreground">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/70">
            Conceito
          </p>
          {section.concept.split('\n\n').map((paragraph, index) => (
            <p key={index} className={index > 0 ? 'mt-2' : undefined}>
              {paragraph}
            </p>
          ))}
        </div>

        {section.flow && section.flow.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
              Fluxo de implementação
            </p>
            <ol className="space-y-2">
              {section.flow.map((step, index) => (
                <li key={step.step} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-mono text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{step.step}</p>
                    <p className="text-xs leading-relaxed">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {section.methods && section.methods.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
              Métodos no código
            </p>
            <ul className="space-y-2">
              {section.methods.map((method) => (
                <li
                  key={method.name}
                  className="rounded-md border bg-background/60 px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <code className="font-mono text-primary">{method.name}</code>
                    <span className="text-muted-foreground">· {method.file}</span>
                  </div>
                  <p className="mt-1 leading-relaxed">{method.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

export function ConceptPanel({
  sections,
  title = 'Como funciona?',
  description = 'Conceitos, fluxo do pipeline e métodos correspondentes no código.',
  defaultOpenId,
}: ConceptPanelProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map((section) => (
          <ConceptSectionBlock
            key={section.id}
            section={section}
            defaultOpen={section.id === defaultOpenId}
          />
        ))}
      </CardContent>
    </Card>
  );
}
