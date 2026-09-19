import { useRef, useState } from "react";
import { Check, ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";

const OPENINARY_URL = "https://cdn.openinary.dev";
const BUCKET_ID = "2c4bfdbd-1097-4bd5-9e66-67cfc49a010b";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function OpeninaryUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("Drop a file here or choose one to store it temporarily.");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadedPath, setUploadedPath] = useState("");

  async function upload(file: File) {
    setStatus("uploading");
    setMessage("Signing a secure upload…");
    setPreviewUrl("");
    try {
      const signatureResponse = await fetch(`${API_BASE}/api/openinary/sign`, { method: "POST", credentials: "same-origin" });
      const signed = await signatureResponse.json() as { signature?: string; expires?: number; folder?: string; error?: string };
      if (!signatureResponse.ok || !signed.signature) throw new Error(signed.error || "Could not sign upload.");
      const form = new FormData();
      form.append("signature", signed.signature);
      form.append("expires", String(signed.expires));
      form.append("folder", signed.folder || "");
      form.append("file", file);
      const uploadResponse = await fetch(`${OPENINARY_URL}/upload`, { method: "POST", body: form });
      const result = await uploadResponse.json() as { path?: string; url?: string; error?: string };
      if (!uploadResponse.ok || !result.path) throw new Error(result.error || "Upload failed.");
      setUploadedPath(result.path);
      setPreviewUrl(`${OPENINARY_URL}/b/${BUCKET_ID}/t/${result.path}`);
      setStatus("done");
      setMessage("Stored successfully. The original file is ready to preview or open.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    }
  }

  return (
    <section className="rounded-[26px] border border-foreground/10 bg-card p-5 shadow-[var(--shadow-soft)] sm:p-7" data-testid="section-openinary-upload">
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Save to cloud</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.05em]">Keep a source file handy.</h2><p className="mt-2 max-w-[520px] text-sm leading-6 text-muted-foreground">Upload one public media file to your private temporary bucket. Your API key stays on the server.</p></div>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary"><ImagePlus className="size-5" /></span>
      </div>
      <input ref={inputRef} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/*,audio/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
      <button type="button" disabled={status === "uploading"} onClick={() => inputRef.current?.click()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/20 bg-muted/40 px-5 py-7 text-sm font-semibold transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-wait disabled:opacity-60" data-testid="button-openinary-upload">
        {status === "uploading" ? <LoaderCircle className="size-5 animate-spin text-primary" /> : status === "done" ? <Check className="size-5 text-primary" /> : <UploadCloud className="size-5 text-primary" />}
        {status === "uploading" ? "Uploading…" : status === "done" ? "Upload another file" : "Choose a file"}
      </button>
      <p className={`mt-3 text-xs leading-5 ${status === "error" ? "text-destructive" : "text-muted-foreground"}`} role={status === "error" ? "alert" : undefined}>{message}</p>
      {status === "done" && previewUrl && <div className="mt-5 overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-3"><p className="mb-3 font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">Uploaded original</p>{/\.(?:jpe?g|png|webp|avif|gif)$/i.test(uploadedPath) ? <img src={previewUrl} alt="Uploaded original" className="max-h-72 w-full rounded-xl object-contain" /> : <a href={previewUrl} target="_blank" rel="noreferrer" className="break-all text-sm font-semibold underline underline-offset-4">Open uploaded file</a>}</div>}
    </section>
  );
}
