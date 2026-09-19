# Free Media Toolkit

A free, mobile-first media utility for analyzing public links, choosing an available output, and tracking temporary processing jobs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/free-media-toolkit/src/` — consumer homepage, workspace, tools, and operations views.
- `artifacts/api-server/src/routes/providers.ts` — provider registry and capability metadata.
- `artifacts/api-server/src/routes/media.ts` — safe URL analysis and temporary job lifecycle.
- `lib/api-spec/openapi.yaml` — source of truth for API contracts.
- `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` — generated client and validation types.

## Architecture decisions

- Provider support is allowlist-driven and each provider advertises whether it is enabled; unreviewed platform adapters stay disabled instead of pretending to work.
- The first processing path supports safe direct public media URLs as temporary pass-through jobs; platform extraction and FFmpeg transforms remain separate adapter/worker concerns.
- URL validation rejects private and link-local hostnames before any future worker or fetch layer can access them.
- The workspace is intentionally account-free and uses a short retention window for temporary job metadata and files.

## Product

- Homepage: paste and analyze a public URL, inspect detected media metadata, and select an available output.
- Workspace: monitor temporary jobs, see progress and expiry, download completed items, and delete jobs.
- Tools: browse planned video, image, and audio utilities.
- Admin: review queue summary, provider readiness, and recent jobs.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Regenerate client and Zod helpers with `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- The generated React client needs `dom.iterable` in its TypeScript lib list because Orval normalizes `Headers.entries()`.
- API ad hoc checks must go through the shared proxy at `http://localhost:80/api/...`, not the service port directly.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
