import { ArrowRight, Check, Clock3, Download, FileAudio, FileImage, FileVideo, Link2, LockKeyhole, ScanSearch, TriangleAlert } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import type { JobInputFormat, JobInputQuality, MediaAnalysis, MediaOption } from '@workspace/api-client-react';
import { getListJobsQueryKey, useAnalyzeMedia, useCreateJob } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';

function TypeIcon({ kind, className = 'h-5 w-5' }: { kind: MediaOption['kind']; className?: string }) {
  if (kind === 'audio') return <FileAudio className={className} />;
  if (kind === 'image') return <FileImage className={className} />;
  return <FileVideo className={className} />;
}

function AnalysisCard({ analysis, selected, onSelect, onCreate, creating }: { analysis: MediaAnalysis; selected: MediaOption | undefined; onSelect: (option: MediaOption) => void; onCreate: () => void; creating: boolean }) {
  return (
    <section className="animate-rise overflow-hidden rounded-[26px] border border-foreground/10 bg-card shadow-[var(--shadow-soft)]" data-testid="section-analysis-result">
      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="relative min-h-[250px] overflow-hidden bg-[#d7dfbd]">
          {analysis.thumbnail ? (
            <img src={analysis.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" data-testid="img-media-thumbnail" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[#c9d789] text-[#3a4620]"><TypeIcon kind={analysis.mediaType === 'audio' ? 'audio' : analysis.mediaType === 'image' ? 'image' : 'video'} className="h-14 w-14" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#20243a]/75 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-[#fffdf5]">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em]"><span className="rounded-full bg-primary px-2.5 py-1 text-primary-foreground">{analysis.providerLabel}</span>{analysis.duration && <span>{analysis.duration}</span>}</div>
            <h2 className="font-display line-clamp-2 text-2xl font-semibold leading-[1.05] tracking-[-.045em]" data-testid="text-analysis-title">{analysis.title || 'Untitled media'}</h2>
            <p className="mt-2 text-xs text-white/70">{analysis.author || 'Public media'}</p>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">Choose an output</p><p className="mt-1 text-sm text-muted-foreground">{analysis.message || 'Ready to turn this into a file.'}</p></div>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/20 text-primary"><Check className="h-4 w-4" /></span>
          </div>
          <div className="space-y-2" role="listbox" aria-label="Available media formats">
            {analysis.options.map((option) => {
              const active = selected?.id === option.id;
              return (
                <button key={option.id} onClick={() => onSelect(option)} className={`group flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all ${active ? 'border-primary bg-primary/15 shadow-[0_4px_18px_rgba(150,184,36,.16)]' : 'border-foreground/10 bg-background/55 hover:border-foreground/25 hover:bg-muted/50'}`} data-testid={`button-option-${option.id}`}>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><TypeIcon kind={option.kind} className="h-4 w-4" /></span>
                    <span className="min-w-0"><span className="block truncate text-sm font-bold">{option.label}</span><span className="font-mono-ui text-[10px] uppercase tracking-[.08em] text-muted-foreground">{option.format} · {option.quality}</span></span>
                  </span>
                  <span className="ml-3 shrink-0 text-xs font-semibold text-muted-foreground">{option.size || '—'} <span className={`ml-1 inline-block transition-transform ${active ? 'translate-x-0.5 text-foreground' : 'text-transparent'}`}>→</span></span>
                </button>
              );
            })}
          </div>
          <button onClick={onCreate} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3.5 text-sm font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" disabled={!selected || creating} data-testid="button-start-download">
            <Download className="h-4 w-4" /> {creating ? 'Starting workspace…' : 'Create temporary file'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<MediaAnalysis>();
  const [selected, setSelected] = useState<MediaOption>();
  const [error, setError] = useState('');
  const analyze = useAnalyzeMedia();
  const createJob = useCreateJob();

  useEffect(() => {
    if (analysis?.options?.length) setSelected(analysis.options[0]);
  }, [analysis]);

  const submitAnalysis = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setAnalysis(undefined);
    if (!url.trim() || !/^https?:\/\/.+/i.test(url.trim())) {
      setError('Paste a complete public link beginning with https://');
      return;
    }
    try {
      const result = await analyze.mutateAsync({ data: { url: url.trim() } });
      setAnalysis(result);
      if (!result.supported) setError(result.message || 'This source is not supported yet.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not inspect that link. Try another public URL.');
    }
  };

  const createTemporaryJob = async () => {
    if (!analysis || !selected) return;
    setError('');
    try {
      const job = await createJob.mutateAsync({ data: { url: analysis.canonicalUrl || analysis.url, format: selected.format as JobInputFormat, quality: selected.quality as JobInputQuality } });
      await queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      setLocation(`/workspace?job=${encodeURIComponent(job.id)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That file could not be queued. Please retry.');
    }
  };

  const selectedForCard = selected;
  return (
    <AppShell>
      <main>
        <section className="paper-grid relative overflow-hidden border-b border-foreground/10">
          <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
          <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
            <div className="max-w-[820px] animate-rise">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.17em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Link in. File out.</div>
              <h1 className="font-display max-w-[780px] text-[clamp(3.25rem,9vw,7.9rem)] font-semibold leading-[.86] tracking-[-.085em]">Make the link<br /><span className="text-primary">useful.</span></h1>
              <p className="mt-7 max-w-[580px] text-base leading-7 text-muted-foreground sm:text-lg">A fast, quiet way to turn a public media link into a file you can actually use. No ads. No account wall. No mystery buttons.</p>
            </div>
            <form onSubmit={submitAnalysis} className="relative mt-11 max-w-[850px] animate-rise [animation-delay:120ms]" data-testid="form-analyze-url">
              <div className="flex flex-col gap-2 rounded-[22px] border border-foreground/15 bg-card p-2 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-4"><Link2 className="h-5 w-5 shrink-0 text-primary" /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste a public media link" className="h-12 w-full min-w-0 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/70" aria-label="Public media URL" data-testid="input-media-url" /></div>
                <button type="submit" disabled={analyze.isPending} className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-[15px] bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[var(--shadow-lime)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-65" data-testid="button-analyze-url">{analyze.isPending ? <><ScanSearch className="h-4 w-4 animate-pulse" /> Inspecting…</> : <><ScanSearch className="h-4 w-4" /> Inspect link</>}</button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-2 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><ShieldIcon /> Public links only</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Auto-clears in {24}h</span><button type="button" onClick={() => setUrl('https://www.youtube.com/watch?v=example')} className="ml-auto underline decoration-foreground/25 underline-offset-4 hover:text-foreground" data-testid="button-use-example">Use an example</button></div>
            </form>
            {error && <div className="mt-5 flex max-w-[850px] items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-rise" role="alert" data-testid="status-analysis-error"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError('')} className="opacity-70 hover:opacity-100" aria-label="Dismiss error" data-testid="button-dismiss-error">×</button></div>}
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14">
          {analyze.isPending && <div className="grid overflow-hidden rounded-[26px] border border-foreground/10 bg-card md:grid-cols-2" data-testid="status-analysis-loading"><div className="min-h-[250px] animate-pulse bg-muted" /><div className="space-y-5 p-7"><div className="h-3 w-28 animate-pulse rounded-full bg-muted" /><div className="h-12 animate-pulse rounded-2xl bg-muted" /><div className="h-12 animate-pulse rounded-2xl bg-muted" /><div className="h-12 animate-pulse rounded-2xl bg-muted" /></div></div>}
          {analysis && analysis.supported && <div className="space-y-4"><AnalysisCard analysis={analysis} selected={selectedForCard} onSelect={setSelected} onCreate={createTemporaryJob} creating={createJob.isPending} /><div className="flex items-center gap-2 px-2 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5 text-primary" /> Your link is used to create this one temporary file, then discarded.</div></div>}
          {!analysis && !analyze.isPending && (
            <div className="grid gap-8 py-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div><p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.19em] text-primary">A small tool with a clear point of view</p><h2 className="mt-3 max-w-[530px] font-display text-4xl font-semibold leading-[.95] tracking-[-.06em] sm:text-5xl">Less hunting.<br />More making.</h2><p className="mt-5 max-w-[510px] leading-7 text-muted-foreground">We inspect the link first so you choose a real, available output—not a guessing game. The workspace keeps each file around only long enough to download it.</p></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                {[['01', 'Paste', 'Drop in a public URL'], ['02', 'Inspect', 'See what is available'], ['03', 'Choose', 'Pick format and quality'], ['04', 'Keep moving', 'Download before it clears']].map(([num, title, copy]) => <div key={num} className="rounded-2xl border border-foreground/10 bg-card p-4"><span className="font-mono-ui text-[10px] text-primary">{num}</span><h3 className="mt-6 font-display font-semibold tracking-[-.02em]">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p></div>)}
              </div>
            </div>
          )}
        </section>

        <section className="bg-secondary text-secondary-foreground">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><LockKeyhole className="h-5 w-5" /></div><h2 className="font-display text-4xl font-semibold leading-[.95] tracking-[-.06em] sm:text-5xl">The privacy promise<br /><span className="text-primary">is the feature.</span></h2></div>
            <div className="grid gap-6 text-sm leading-6 text-secondary-foreground/65 sm:grid-cols-2"><p><strong className="mb-1 block text-secondary-foreground">No account, ever.</strong> There is nothing to profile and no feed to build. Paste a link and get on with your work.</p><p><strong className="mb-1 block text-secondary-foreground">Temporary by design.</strong> Files and job details are automatically cleared after the retention window. Keep what you need locally.</p><p><strong className="mb-1 block text-secondary-foreground">Public sources only.</strong> We do not help bypass private access, paywalls, or permissions. If it is not public, it does not belong here.</p><p><strong className="mb-1 block text-secondary-foreground">Built to be legible.</strong> Every available output is shown before processing starts. No dark patterns, no ad maze.</p></div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function ShieldIcon() {
  return <LockKeyhole className="h-3.5 w-3.5 text-primary" />;
}