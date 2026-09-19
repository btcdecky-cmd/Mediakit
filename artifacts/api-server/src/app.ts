import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const requestWindows = new Map<string, { startedAt: number; count: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use((req, res, next) => {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const window = requestWindows.get(key);
  if (!window || now - window.startedAt >= WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    next();
    return;
  }
  if (window.count >= MAX_REQUESTS) {
    res.status(429).json({ error: "Too many requests. Please try again shortly." });
    return;
  }
  window.count += 1;
  next();
});
app.use(cors({ origin: true, methods: ["GET", "POST", "DELETE", "OPTIONS"] }));
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
