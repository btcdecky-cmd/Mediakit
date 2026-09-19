import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = Redis.fromEnv();
export const mediaRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "mediakit:rate",
});

export const mediaJobsCacheKey = (id: string) => `mediakit:job:${id}`;
