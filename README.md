# Engineering Notes — Config-Driven Knowledge Base

A config-driven engineering **notes / knowledge base**. Note content is stored as typed
JSON blocks in Supabase and rendered on three surfaces that share one block schema:

- **`apps/web`** — public web reader (Next.js, read-only)
- **`apps/mobile`** — Expo / React Native reader (read-only, offline-capable)
- **`apps/admin`** — the **only writer**: single-credential admin for CRUD on the JSON DB

Full design in [`Plan/plan.md`](Plan/plan.md).

## Monorepo layout

```text
apps/
  web/                 Next.js public reader
  admin/               Next.js admin (single credential + TOTP)
  mobile/              Expo reader
packages/
  blocks/              Canonical block schema + Zod validation (the shared contract)
  core/                Supabase clients + content utils (wikilinks, toc, reading-time)
  renderer-web/        React DOM block components (Phase 1)
  renderer-native/     React Native block components (Phase 4)
supabase/
  migrations/          SQL schema, RLS, RPCs, full-text search
```

## Prerequisites

- Node.js >= 20
- pnpm (via corepack): `corepack enable && corepack prepare pnpm@9.15.4 --activate`

## Setup

```bash
pnpm install
cp .env.example .env.local     # fill in Supabase keys when ready
pnpm typecheck
```

## Status

**Phase 0 — monorepo foundation.** See the phased build order in the plan. Phase 0 delivers
the workspace, the shared block schema, core utilities, and the database schema. External
accounts (Supabase, Vercel, Upstash, Expo) are only needed from Phase 1 onward.
