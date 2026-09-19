import { ArrowRight, AudioLines, Check, FileImage, Film, Image as ImageIcon, Music2, Search, WandSparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';

type Tool = { id: string; type: 'video' | 'image' | 'audio'; title: string; description: string; detail: string; accent: string; icon: typeof Film };

const tools: Tool[] = [
  { id: 'video-trim', type: 'video', title: 'Trim a video', description: 'Cut the useful bit, lose the rest.', detail: 'Bring in a video file and set precise in and out points. A focused trim tool for quick edits, not a full timeline.', accent: '#d9e7a4', icon: Film },
  { id: 'video-gif', type: 'video', title: 'Video to GIF', description: 'Turn a small moment into a loop.', detail: 'Convert a short clip into a shareable GIF with sensible defaults and a clean export.', accent: '#f7c4a8', icon: WandSparkles },
  { id: 'image-compress', type: 'image', title: 'Compress an image', description: 'Smaller files. Same visual idea.', detail: 'Reduce image weight for messages, websites, and docs while keeping the details that matter.', accent: '#c7d5ed', icon: ImageIcon },
  { id: 'image-convert', type: 'image', title: 'Convert image format', description: 'PNG, JPG, WebP — pick the right one.', detail: 'Move between common image formats without wrestling with a desktop editor.', accent: '#e9d99d', icon: FileImage },
  { id: 'audio-extract', type: 'audio', title: 'Extract audio', description: 'Keep the sound, leave the picture.', detail: 'Pull an audio track from a public video link, then choose a format that fits your next step.', accent: '#c8dba8', icon: AudioLines },
  { id: 'audio-convert', type: 'audio', title: 'Convert audio', description: 'Make the file fit the workflow.', detail: 'Convert between MP3, M4A, WAV, and other practical formats for editing or listening.', accent: '#efc8b4', icon: Music2 },
];

const groups = [
  { key: 'video', label: 'Video', count: '02', copy: 'Motion, cut down to what matters.' },
  { key: 'image', label: 'Image', count: '02', copy: 'Lightweight files with visual fidelity.' },
  { key: 'audio', label: 'Audio', count: '02', copy: 'Sound that travels well.' },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>();
  const [query, setQuery] = useState('');
  const visibleTools = useMemo(() => tools.filter((tool) => `${tool.title} ${tool.description}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const ActiveToolIcon = activeTool?.icon;
  return (
    <AppShell>
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-16">
        <div className="flex flex-col justify-between gap-7 border-b border-foreground/10 pb-10 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.18em] text-primary">The toolkit</p><h1 className="mt-3 font-display text-5xl font-semibold tracking-[-.07em] sm:text-7xl">Useful little<br /><span className="text-muted-foreground">machines.</span></h1></div><div className="max-w-[310px]"><p className="text-sm leading-6 text-muted-foreground">Small tools for the parts of media work that should never take an afternoon.</p><label className="mt-5 flex items-center gap-2 border-b border-foreground/20 pb-2 text-sm"><Search className="h-4 w-4 text-primary" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a tool" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" aria-label="Find a tool" data-testid="input-search-tools" /></label></div></div>
        <div className="grid gap-4 py-10 md:grid-cols-3">{groups.map((group) => <div key={group.key} className="rounded-2xl border border-foreground/10 bg-card p-5"><div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">{group.count} tools</span><span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.key === 'video' ? '#d5e890' : group.key === 'image' ? '#b9cae9' : '#f1b99f' }} /></div><h2 className="mt-7 font-display text-2xl font-semibold tracking-[-.05em]">{group.label}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{group.copy}</p></div>)}</div>
        {visibleTools.length === 0 && <div className="rounded-2xl border border-dashed border-foreground/20 p-12 text-center" data-testid="status-tools-empty"><Search className="mx-auto h-7 w-7 text-muted-foreground/50" /><p className="mt-4 font-display font-semibold">No tools match that search.</p><button onClick={() => setQuery('')} className="mt-3 text-xs font-bold underline underline-offset-4" data-testid="button-clear-tool-search">Clear search</button></div>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTools.map((tool, index) => { const Icon = tool.icon; return <article key={tool.id} className="group flex min-h-[235px] flex-col justify-between rounded-[22px] border border-foreground/10 bg-card p-5 transition-transform hover:-translate-y-1" style={{ animationDelay: `${index * 50}ms` }} data-testid={`card-tool-${tool.id}`}><div><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ backgroundColor: tool.accent }}><Icon className="h-5 w-5 text-[#20243a]" /></span><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{tool.type}</span></div><h3 className="mt-8 font-display text-2xl font-semibold tracking-[-.05em]">{tool.title}</h3><p className="mt-2 max-w-[250px] text-sm leading-6 text-muted-foreground">{tool.description}</p></div><button onClick={() => setActiveTool(tool)} className="mt-6 flex items-center gap-2 self-start text-xs font-bold" data-testid={`button-open-tool-${tool.id}`}>Open tool <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></button></article>; })}
        </div>
      </main>
      {activeTool && ActiveToolIcon && <div className="fixed inset-0 z-50 grid place-items-center bg-[#20243a]/60 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={activeTool.title} data-testid="dialog-tool-preview"><div className="relative w-full max-w-[480px] rounded-[26px] bg-card p-7 shadow-2xl sm:p-9"><button onClick={() => setActiveTool(undefined)} className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground" aria-label="Close tool preview" data-testid="button-close-tool"><X className="h-4 w-4" /></button><div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ backgroundColor: activeTool.accent }}><ActiveToolIcon className="h-5 w-5 text-[#20243a]" /></div><p className="mt-7 font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">Tool preview</p><h2 className="mt-2 font-display text-4xl font-semibold tracking-[-.06em]">{activeTool.title}</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">{activeTool.detail}</p><div className="mt-7 flex items-center gap-2 rounded-xl bg-primary/15 p-3 text-xs font-semibold"><Check className="h-4 w-4 text-primary" /> Built around public, usable files</div><button onClick={() => setActiveTool(undefined)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground" data-testid="button-dismiss-tool-preview">Back to toolkit <ArrowRight className="h-4 w-4" /></button></div></div>}
    </AppShell>
  );
}