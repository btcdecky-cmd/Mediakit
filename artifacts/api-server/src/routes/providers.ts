import { Router, type IRouter } from "express";
import { ListProvidersResponse } from "@workspace/api-zod";

export type ProviderDefinition = {
  id: string;
  label: string;
  domains: string[];
  enabled: boolean;
  accent: string;
  note: string;
};

export const providerDefinitions: ProviderDefinition[] = [
  {
    id: "direct",
    label: "Direct media URL",
    domains: ["mp4", "webm", "mov", "mp3", "m4a", "wav", "jpg", "png", "webp"],
    enabled: true,
    accent: "cyan",
    note: "Direct public files can be passed through with no account or platform session.",
  },
  {
    id: "youtube",
    label: "YouTube",
    domains: ["youtube.com", "youtu.be"],
    enabled: false,
    accent: "red",
    note: "Provider adapter planned; only sources cleared for use will be enabled.",
  },
  {
    id: "tiktok",
    label: "TikTok",
    domains: ["tiktok.com"],
    enabled: false,
    accent: "pink",
    note: "Provider adapter planned; private and restricted content is never supported.",
  },
  {
    id: "instagram",
    label: "Instagram",
    domains: ["instagram.com"],
    enabled: false,
    accent: "purple",
    note: "Provider adapter planned; private and restricted content is never supported.",
  },
  {
    id: "reddit",
    label: "Reddit",
    domains: ["reddit.com", "redd.it"],
    enabled: false,
    accent: "orange",
    note: "Provider adapter planned; private and restricted content is never supported.",
  },
  {
    id: "vimeo",
    label: "Vimeo",
    domains: ["vimeo.com"],
    enabled: false,
    accent: "blue",
    note: "Provider adapter planned; only sources cleared for use will be enabled.",
  },
];

export const providersRouter: IRouter = Router();

providersRouter.get("/providers", (_req, res) => {
  res.json(ListProvidersResponse.parse(providerDefinitions));
});
