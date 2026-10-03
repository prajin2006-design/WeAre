import React from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionText,
  actionHref = '/',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border/40 bg-surface/40 p-8 text-center backdrop-blur-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-border/80 text-muted shadow-inner">
        {icon || <Film className="h-7 w-7 text-accent" />}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted leading-relaxed">{description}</p>
      {actionText && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-accent-hover active:scale-95 shadow-lg shadow-accent/10"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
