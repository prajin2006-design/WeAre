import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'outline' | 'subtle' | 'accent';
  className?: string;
}

export default function Badge({ children, variant = 'outline', className = '' }: BadgeProps) {
  let style = 'border-border/60 text-muted';
  if (variant === 'gold') {
    style = 'bg-accent/90 text-black font-bold border-transparent';
  } else if (variant === 'accent') {
    style = 'border-accent/40 text-accent bg-accent/10';
  } else if (variant === 'subtle') {
    style = 'bg-surface/80 text-foreground/80 border-border/40';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase border ${style} ${className}`}
    >
      {children}
    </span>
  );
}
