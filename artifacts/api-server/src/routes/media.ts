import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  AnalyzeMediaBody,
  AnalyzeMediaResponse,
  CreateJobBody,
  CreateJobResponse,
  DeleteJobParams,
  GetDashboardSummaryResponse,
  GetJobParams,
  GetJobResponse,
  ListJobsResponse,
} from "@workspace/api-zod";
import { providerDefinitions } from "./providers";
import { db, mediaJobs } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

type MediaOption = {
  id: string;
  label: string;
  kind: "video" | "audio" | "image";
  format: string;
  quality: string;
  size?: string;
};

type MediaAnalysis = {
  url: string;
  canonicalUrl: string;
  provider: string;
  providerLabel: string;
  supported: boolean;
  title: string;
  author: string;
  duration: string;
  mediaType: "video" | "audio" | "image" | "unknown";
  thumbnail: string | null;
  options: MediaOption[];
  message: string;
};

type MediaJob = {
  id: string;
  url: string;
  provider: string;
  title: string;
  format: string;
  quality: string;
  status: "processing" | "completed" | "failed" | "expired";
  progress: number;
  size: string;
  createdAt: string;
  expiresAt: string;
  downloadUrl: string | null;
  error: string | null;
};

const jobs = new Map<string, MediaJob>();
const RETENTION_HOURS = 6;

function isPrivateHostname(hostname: string) {
  const value = hostname.toLowerCase();
  return (
    value === "localhost" ||
    value.endsWith(".localhost") ||
    value === "0.0.0.0" ||
    value === "::1" ||
    /^127\./.test(value) ||
    /^10\./.test(value) ||
    /^192\.168\./.test(value) ||
    /^169\.254\./.test(value) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(value)
  );
}

function getUrl(value: string) {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHostname(parsed.hostname)) {
    throw new Error("This URL cannot be accessed safely.");
  }
  return parsed;
}

function detectProvider(parsed: URL) {
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const match = providerDefinitions.find((provider) =>
    provider.id === "direct"
      ? /\.(mp4|webm|mov|mp3|m4a|wav|jpg|jpeg|png|webp)$/i.test(parsed.pathname)
      : provider.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)),
  );
  return match ?? {
    id: "unknown",
    label: "Unknown source",
    domains: [],
    enabled: false,
    accent: "slate",
    note: "This source is not on the current provider allowlist.",
  };
}

function buildAnalysis(url: string): MediaAnalysis {
  const parsed = getUrl(url);
  const provider = detectProvider(parsed);
  const pathname = parsed.pathname.split("/").filter(Boolean);
  const rawName = decodeURIComponent(pathname.at(-1) ?? "public-media")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const title = rawName ? rawName.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Public media";
  const extension = parsed.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const mediaType: MediaAnalysis["mediaType"] = extension
    ? ["mp3", "m4a", "wav"].includes(extension)
      ? "audio"
      : ["jpg", "jpeg", "png", "webp"].includes(extension)
        ? "image"
        : "video"
    : "unknown";
  const kind: MediaOption["kind"] = mediaType === "unknown" ? "video" : mediaType;
  const options: MediaOption[] =
    provider.enabled && mediaType !== "unknown"
      ? [
          {
            id: "original",
            label: `Original ${extension?.toUpperCase() ?? "file"}`,
            kind,
            format: extension ?? "original",
            quality: "source",
            size: "Source quality",
          },
        ]
      : [];

  return AnalyzeMediaResponse.parse({
    url,
    canonicalUrl: parsed.toString(),
    provider: provider.id,
    providerLabel: provider.label,
    supported: provider.enabled && options.length > 0,
    title,
    author: provider.id === "direct" ? parsed.hostname : "Provider adapter",
    duration: mediaType === "image" ? "Still image" : "Source metadata",
    mediaType,
    thumbnail: mediaType === "image" ? parsed.toString() : null,
    options,
    message: provider.enabled
      ? options.length > 0
        ? "Source verified. Choose the original file to continue."
        : "We could not identify a supported media file at this URL."
      : provider.id === "unknown"
        ? "This platform is not currently supported."
        : provider.note,
  });
}

function expireJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (new Date(job.expiresAt).getTime() <= now) {
      jobs.set(id, {
        ...job,
        status: "expired",
        progress: 0,
        downloadUrl: null,
        error: "This temporary file has expired.",
      });
    }
  }
}

export const mediaRouter: IRouter = Router();

mediaRouter.post("/analyze", (req, res) => {
  const parsed = AnalyzeMediaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid public media URL." });
    return;
  }
  try {
    res.json(buildAnalysis(parsed.data.url));
  } catch {
    res.status(400).json({ error: "This URL cannot be accessed safely." });
  }
});

mediaRouter.get("/jobs", async (_req, res) => {
  expireJobs();
  const storedJobs = await db.select().from(mediaJobs).orderBy(desc(mediaJobs.createdAt));
  const memoryJobs = Array.from(jobs.values());
  const merged = [...memoryJobs, ...storedJobs.filter((stored) => !jobs.has(stored.id))].map((job) => ({
    ...job,
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    expiresAt: job.expiresAt instanceof Date ? job.expiresAt.toISOString() : job.expiresAt,
  }));
  res.json(ListJobsResponse.parse(merged));
});

mediaRouter.post("/jobs", async (req, res) => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a supported source format and quality." });
    return;
  }

  try {
    const analysis = buildAnalysis(parsed.data.url);
    if (!analysis.supported || analysis.provider !== "direct") {
      res.status(400).json({ error: "This source is not enabled for processing yet." });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + RETENTION_HOURS * 60 * 60 * 1000);
    const job: MediaJob = {
      id: randomUUID(),
      url: parsed.data.url,
      provider: analysis.provider,
      title: analysis.title,
      format: parsed.data.format,
      quality: parsed.data.quality,
      status: "processing",
      progress: 12,
      size: "Estimating",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      downloadUrl: null,
      error: null,
    };
    jobs.set(job.id, job);
    await db.insert(mediaJobs).values({
      id: job.id,
      visitorId: req.ip || "anonymous",
      url: job.url,
      provider: job.provider,
      title: job.title,
      format: job.format,
      quality: job.quality,
      status: job.status,
      progress: job.progress,
      size: job.size,
      createdAt: now,
      expiresAt,
      downloadUrl: job.downloadUrl,
      error: job.error,
    });

    setTimeout(async () => {
      const current = jobs.get(job.id);
      if (!current) return;
      const completedJob = { ...current, status: "completed" as const, progress: 100, size: "Source file", downloadUrl: current.url };
      jobs.set(job.id, completedJob);
      await db.update(mediaJobs).set({ status: completedJob.status, progress: completedJob.progress, size: completedJob.size, downloadUrl: completedJob.downloadUrl }).where(eq(mediaJobs.id, job.id));
    }, 1400);

    res.status(201).json(CreateJobResponse.parse(job));
  } catch {
    res.status(400).json({ error: "This URL cannot be accessed safely." });
  }
});

mediaRouter.get("/jobs/:id", async (req, res) => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  expireJobs();
  const job = jobs.get(params.data.id);
  if (job) {
    res.json(GetJobResponse.parse(job));
    return;
  }
  const [stored] = await db.select().from(mediaJobs).where(eq(mediaJobs.id, params.data.id));
  if (!stored) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  res.json(GetJobResponse.parse({ ...stored, createdAt: stored.createdAt.toISOString(), expiresAt: stored.expiresAt.toISOString() }));
});

mediaRouter.delete("/jobs/:id", async (req, res) => {
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success || !jobs.has(params.data.id)) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  jobs.delete(params.data.id);
  await db.delete(mediaJobs).where(eq(mediaJobs.id, params.data.id));
  res.status(204).send();
});

mediaRouter.get("/dashboard/summary", (_req, res) => {
  expireJobs();
  const values = Array.from(jobs.values());
  res.json(
    GetDashboardSummaryResponse.parse({
      totalJobs: values.length,
      completedJobs: values.filter((job) => job.status === "completed").length,
      processingJobs: values.filter((job) => job.status === "processing").length,
      savedBytes: "0 B",
      retentionHours: RETENTION_HOURS,
      providerCount: providerDefinitions.filter((provider) => provider.enabled).length,
    }),
  );
});
