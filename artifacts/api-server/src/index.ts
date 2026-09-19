import app from "./app";
import { initializeDatabase } from "@workspace/db";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] ?? "8787";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await initializeDatabase();
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to initialize Supabase database");
  process.exit(1);
});
