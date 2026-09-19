import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error(
    "Upstash Redis requires UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN.",
  );
}

export const redis = new Redis({ url: redisUrl, token: redisToken });
export const mediaRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "mediakit:rate",
});

export const mediaJobsCacheKey = (id: string) => `mediakit:job:${id}`;
