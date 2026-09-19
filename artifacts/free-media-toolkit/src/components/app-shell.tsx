import { ArrowUpRight, CircleHelp, FolderClock, Grid2X2, Menu, ShieldCheck, Wrench, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { BrandMark } from '@/components/brand';

const consumerNav = [
  { href: '/', label: 'Download', icon: ArrowUpRight },
  { href: '/workspace', label: 'Workspace', icon: FolderClock },
  { href: '/tools', label: 'Toolkit', icon: Wrench },
];

export function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const links = admin ? [{ href: '/admin', label: 'Operations', icon: Grid2X2 }] : consumerNav;

  return (
    <div className={`min-h-[100dvh] ${admin ? 'bg-[#20243a] text-[#f8f5eb]' : 'bg-background text-foreground'} noise`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${admin ? 'border-white/10 bg-[#20243a]/90' : 'border-foreground/10 bg-background/90'}`}>
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <BrandMark />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {links.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors ${active ? admin ? 'bg-white/10 text-[#c5df57]' : 'bg-foreground text-background' : admin ? 'text-white/65 hover:text-white' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}`}
                  data-testid={`link-nav-${label.toLowerCase()}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-5 md:flex">
            {!admin && (
              <Link href="/admin" className="group flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-foreground" data-testid="link-admin">
                Ops view <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            )}
            <span className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] ${admin ? 'text-white/45' : 'text-muted-foreground'}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> No account needed
            </span>
          </div>
          <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full border border-current/15 md:hidden" aria-label="Toggle navigation" data-testid="button-toggle-navigation">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className={`border-t px-5 py-4 md:hidden ${admin ? 'border-white/10' : 'border-foreground/10'}`}>
            <nav className="flex flex-col gap-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-foreground/5" data-testid={`link-mobile-${label.toLowerCase()}`}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
              {!admin && <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-foreground/5" data-testid="link-mobile-admin"><ShieldCheck className="h-4 w-4" /> Operations</Link>}
            </nav>
          </div>
        )}
      </header>
      {children}
      <footer className={`mx-auto flex max-w-[1240px] flex-col gap-3 border-t px-5 py-8 text-[11px] font-medium uppercase tracking-[.12em] sm:flex-row sm:items-center sm:justify-between sm:px-8 ${admin ? 'border-white/10 text-white/35' : 'border-foreground/10 text-muted-foreground'}`}>
        <span>Free Media Toolkit · public links, private process</span>
        <span className="flex items-center gap-2"><CircleHelp className="h-3.5 w-3.5" /> Files auto-expire</span>
      </footer>
    </div>
  );
}