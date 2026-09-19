// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const mediaJobs = pgTable("media_jobs", {
  id: uuid("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  url: text("url").notNull(),
  provider: text("provider").notNull(),
  title: text("title").notNull(),
  format: text("format").notNull(),
  quality: text("quality").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").notNull().default(0),
  size: text("size"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  downloadUrl: text("download_url"),
  error: text("error"),
});

export type MediaJobRecord = typeof mediaJobs.$inferSelect;
