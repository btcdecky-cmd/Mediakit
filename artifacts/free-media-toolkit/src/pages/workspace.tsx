import { Check, ChevronRight, Clock3, Download, ExternalLink, FileArchive, LoaderCircle, RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import type { MediaJob } from '@workspace/api-client-react';
import { getGetJobQueryKey, getListJobsQueryKey, useDeleteJob, useGetJob, useListJobs } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';

function JobStatus({ status }: { status: MediaJob['status'] }) {
  const config = {
    processing: { label: 'Processing', icon: LoaderCircle, className: 'bg-accent/20 text-[#9f4a29]', spin: true },
    completed: { label: 'Ready', icon: Check, className: 'bg-primary/20 text-[#5c7612]', spin: false },
    failed: { label: 'Could not finish', icon: TriangleAlert, className: 'bg-destructive/10 text-destructive', spin: false },
    expired: { label: 'Expired', icon: Clock3, className: 'bg-muted text-muted-foreground', spin: false },
  }[status];
  const Icon = config.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${config.className}`}><Icon className={`h-3 w-3 ${config.spin ? 'animate-spin' : ''}`} />{config.label}</span>;
}

function formatDate(value: string) {
  try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); } catch { return value; }
}

function JobRow({ job, active, onOpen, onDelete }: { job: MediaJob; active: boolean; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className={`group rounded-2xl border p-4 transition-colors ${active ? 'border-primary bg-primary/10' : 'border-foreground/10 bg-card hover:border-foreground/20'}`} data-testid={`row-job-${job.id}`}>
      <div className="flex items-start justify-between gap-4">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left" data-testid={`button-open-job-${job.id}`}>
          <div className="mb-2 flex flex-wrap items-center gap-2"><JobStatus status={job.status} /><span className="font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground">{job.format} · {job.quality}</span></div>
          <p className="truncate text-sm font-bold">{job.title || 'Untitled media'}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{job.provider} · {formatDate(job.createdAt)}</p>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={onOpen} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open job" data-testid={`button-view-job-${job.id}`}><ChevronRight className="h-4 w-4" /></button>
          <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete job" data-testid={`button-delete-job-${job.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {job.status === 'processing' && <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="animate-pulse-bar h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(5, job.progress)}%` }} /></div>}
    </div>
  );
}

export default function WorkspacePage() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const jobId = useMemo(() => new URLSearchParams(location.split('?')[1] || '').get('job') || '', [location]);
  const jobsQuery = useListJobs({ query: { queryKey: getListJobsQueryKey(), refetchInterval: 5000 } });
  const jobQuery = useGetJob(jobId, { query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId), refetchInterval: jobId ? 1800 : false } });
  const deleteJob = useDeleteJob();
  const jobs = jobsQuery.data || [];
  const activeJob = jobQuery.data;

  const selectJob = (id: string) => setLocation(`/workspace?job=${encodeURIComponent(id)}`);
  const removeJob = (id: string) => {
    if (!window.confirm('Remove this temporary job from the workspace?')) return;
    deleteJob.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() }); if (id === jobId) setLocation('/workspace'); } });
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Temporary workspace</p><h1 className="mt-3 font-display text-5xl font-semibold tracking-[-.07em] sm:text-6xl">Your files,<br /><span className="text-muted-foreground">while they last.</span></h1></div><p className="max-w-[270px] text-sm leading-6 text-muted-foreground">This is a short-lived workbench. Download what you need, then let the rest disappear.</p></div>
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <section className="order-2 lg:order-1">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold tracking-[-.04em]">Recent jobs</h2><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}</span></div>
            {jobsQuery.isLoading && <div className="space-y-3" data-testid="status-jobs-loading">{[1, 2, 3].map((item) => <div key={item} className="h-[104px] animate-pulse rounded-2xl bg-muted" />)}</div>}
            {jobsQuery.isError && <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-sm text-destructive" data-testid="status-jobs-error"><TriangleAlert className="mb-3 h-5 w-5" /><p>Recent jobs are unavailable.</p><button onClick={() => jobsQuery.refetch()} className="mt-3 font-bold underline underline-offset-4" data-testid="button-retry-jobs">Retry</button></div>}
            {!jobsQuery.isLoading && !jobsQuery.isError && jobs.length === 0 && <div className="rounded-2xl border border-dashed border-foreground/20 bg-card/40 p-8 text-center" data-testid="status-jobs-empty"><FileArchive className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-4 font-display font-semibold">Nothing in the workspace</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Analyze a link to make your first temporary file.</p><Link href="/" className="mt-4 inline-flex rounded-full bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground" data-testid="link-start-first-job">Analyze a link</Link></div>}
            <div className="space-y-3">{jobs.map((job) => <JobRow key={job.id} job={job} active={job.id === jobId} onOpen={() => selectJob(job.id)} onDelete={() => removeJob(job.id)} />)}</div>
          </section>

          <section className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-[26px] border border-foreground/10 bg-card shadow-[var(--shadow-soft)]">
              {!jobId && <div className="flex min-h-[430px] flex-col items-center justify-center px-8 text-center" data-testid="status-workspace-empty"><div className="relative mb-7 grid h-24 w-24 place-items-center rounded-[28px] bg-muted"><div className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-accent" /><FileArchive className="relative h-9 w-9 text-muted-foreground" /></div><p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Select a job</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-.06em]">A quiet place<br />for the in-between.</h2><p className="mt-3 max-w-[300px] text-sm leading-6 text-muted-foreground">Choose a job from the left to watch it process or download the finished file.</p></div>}
              {jobId && jobQuery.isLoading && <div className="min-h-[430px] p-7" data-testid="status-job-loading"><div className="h-5 w-24 animate-pulse rounded-full bg-muted" /><div className="mt-8 h-10 w-4/5 animate-pulse rounded-xl bg-muted" /><div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-muted" /><div className="mt-16 h-3 w-full animate-pulse rounded-full bg-muted" /></div>}
              {jobId && jobQuery.isError && <div className="flex min-h-[430px] flex-col items-center justify-center p-8 text-center" data-testid="status-job-error"><TriangleAlert className="h-9 w-9 text-destructive" /><h2 className="mt-4 font-display text-2xl font-semibold">That job is unavailable</h2><p className="mt-2 max-w-[300px] text-sm leading-6 text-muted-foreground">It may have expired already, or the link is no longer valid.</p><button onClick={() => jobQuery.refetch()} className="mt-5 flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground" data-testid="button-retry-job"><RotateCcw className="h-3.5 w-3.5" /> Try again</button></div>}
              {activeJob && <JobDetail job={activeJob} onDelete={() => removeJob(activeJob.id)} />}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function JobDetail({ job, onDelete }: { job: MediaJob; onDelete: () => void }) {
  const completed = job.status === 'completed';
  const expired = job.status === 'expired';
  return (
    <div className="p-6 sm:p-8" data-testid={`panel-job-detail-${job.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3"><JobStatus status={job.status} /><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">ID {job.id.slice(0, 8)}</span></div>
      <h2 className="mt-8 max-w-[600px] font-display text-3xl font-semibold leading-[.98] tracking-[-.06em] sm:text-4xl" data-testid="text-job-title">{job.title || 'Untitled media'}</h2>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{job.provider}</span><span>{job.format.toUpperCase()}</span><span>{job.quality}</span><span>{job.size || 'Size pending'}</span></div>
      {job.status === 'processing' && <div className="mt-14"><div className="mb-3 flex items-center justify-between text-xs font-semibold"><span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin text-primary" /> Building your file</span><span className="font-mono-ui">{Math.round(job.progress)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(3, job.progress)}%` }} /></div><p className="mt-4 text-xs leading-5 text-muted-foreground">You can leave this tab open. This panel checks for updates automatically.</p></div>}
      {completed && <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/10 p-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" /></span><div><p className="font-semibold">Your file is ready.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Download it now. This temporary link clears at {formatDate(job.expiresAt)}.</p></div></div>{job.downloadUrl ? <a href={job.downloadUrl} download className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3.5 text-sm font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-download-file"><Download className="h-4 w-4" /> Download {job.format.toUpperCase()} <ExternalLink className="h-3.5 w-3.5" /></a> : <p className="mt-4 text-xs text-destructive">The download link was not returned. Refresh the job and try again.</p>}</div>}
      {job.status === 'failed' && <div className="mt-12 rounded-2xl border border-destructive/25 bg-destructive/10 p-5 text-sm"><div className="flex items-center gap-2 font-bold text-destructive"><TriangleAlert className="h-4 w-4" /> Processing stopped</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{job.error || 'Something went wrong while building this file.'}</p></div>}
      {expired && <div className="mt-12 rounded-2xl border border-foreground/10 bg-muted p-5 text-sm"><div className="flex items-center gap-2 font-bold"><Clock3 className="h-4 w-4 text-muted-foreground" /> This file has cleared</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Temporary jobs are removed after the retention window. Return to the downloader to make a fresh one.</p></div>}
      <div className="mt-10 flex items-center justify-between border-t border-foreground/10 pt-5"><span className="font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground">Created {formatDate(job.createdAt)}</span><button onClick={onDelete} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive" data-testid="button-delete-active-job"><Trash2 className="h-3.5 w-3.5" /> Remove</button></div>
    </div>
  );
}