import { ArrowUpRight } from 'lucide-react';
import { Link } from 'wouter';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" data-testid="link-brand-home">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-primary text-primary-foreground shadow-[var(--shadow-lime)]">
        <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-accent" />
        <span className="relative font-display text-xl font-bold leading-none tracking-[-.08em]">fm</span>
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-bold tracking-[-.04em]">
          free media<span className="text-muted-foreground">/</span>toolkit
        </span>
      )}
    </Link>
  );
}

export function ExternalMark() {
  return <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />;
}