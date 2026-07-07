# Engineering Notes — Config-Driven Knowledge Base — Plan

## Goal

A **config-driven notes / knowledge-base** for engineering topics. Every note's content is
stored as structured JSON (typed blocks) in a database and rendered into rich, cross-linked
pages: text, code snippets, **Mermaid diagrams (rendered diagram + source shown together)**,
math, images, callouts, tables, and more.

The system has **three surfaces**:

1. **Public web reader** — fast, SEO-friendly Next.js site (read-only).
2. **Mobile app** — Expo / React Native reader for iOS + Android (read-only, offline-capable).
3. **Admin site** — a **separate**, highly-locked-down web app (no mobile) that is the **only
   writer**: create / edit / delete notes (CRUD on the JSON DB).

Notes are organized in a **browsable topic tree**, connected with **wiki-style links,
backlinks, and transclusion**, and treated as **living/evergreen documents**. Content can be
arbitrarily large.

**Best of both worlds:** **Notion's clean, block-based editing** fused with **Obsidian's
linked-knowledge model** (wiki-links, backlinks, transclusion, graph) — all on a portable
config/JSON backbone shared by every surface.

### How this differs from a blog

| Blog | Engineering Notes |
| --- | --- |
| Chronological feed, "latest posts" | Hierarchical topic tree, browse by subject |
| A post is finished and dated | A note is evergreen, "last updated", always editable |
| Flat list + tags | Nested topics → subtopics → notes, plus tags |
| Standalone articles | Cross-linked with `[[wiki-links]]` + backlinks + transclusion |
| Reading feed | Reference / second brain / digital garden |

**Look & feel:** **minimal docs** aesthetic (Nextra / GitBook) — sidebar-driven, dense,
technical. **Sans-serif** typography (e.g. Inter) with monospace for code, **dark mode
default** (light toggle, system-aware), fast keyboard nav.

---

## System Architecture

```text
                       ┌──────────────────────────┐
                       │   Supabase (PostgreSQL)   │   single source of truth
                       │   notes / topics / links  │   JSONB blocks + Storage
                       └──────────────────────────┘
                     read (anon) ▲     ▲     ▲ write (service role, server-only)
             ┌───────────────────┘     │     └───────────────────┐
     ┌───────────────┐        ┌────────────────┐        ┌────────────────────┐
     │  Public Web   │        │   Mobile App   │        │    Admin Site       │
     │  (Next.js)    │        │  (Expo / RN)   │        │   (Next.js, sep.)   │
     │  read-only    │        │  read-only     │        │  ONLY writer        │
     │  Vercel       │        │  iOS + Android │        │  single credential  │
     └───────────────┘        └────────────────┘        └────────────────────┘
```

- **Public web** and **mobile** are read-only consumers using the Supabase **anon key**;
  Row Level Security allows reading only published/evergreen notes.
- **Admin site** is the sole writer. It holds the Supabase **service-role key server-side**
  and is gated by a **single credential** (see *Admin Site & Authentication*).
- All three share one **block schema** and content utilities via a monorepo, so the same
  JSON renders consistently on web and mobile.

---

## Why Vercel (web + admin) and Expo (mobile), not GitHub Pages

GitHub Pages serves only static files — it cannot securely proxy a database, protect a
service-role key, or run auth. Vercel gives serverless routes (credentials stay server-side)
plus ISR for static-fast, live-data pages. The mobile app ships through **Expo Application
Services (EAS)** to the App Store / Play Store.

---

## Tech Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Monorepo | **pnpm workspaces + Turborepo** | Share block schema + utils across web/admin/mobile |
| Web framework | **Next.js 15** (App Router) | Server Components, ISR, streaming; native on Vercel |
| Mobile | **Expo (React Native) + expo-router** | One codebase → iOS + Android, OTA updates, EAS builds |
| Database | **Supabase** (PostgreSQL) | JSONB, Row Level Security, Storage, free tier |
| Media storage | **Supabase Storage** | Signed URLs, CDN-backed |
| Block editor (admin) | **BlockNote** (ProseMirror) | Notion-style slash-command editor; stores JSON blocks natively |
| Code highlighting | **Shiki** | Server-side, zero client bundle, 200+ languages |
| Diagrams | **Mermaid.js** | Rendered diagram **and** source shown together |
| Math / LaTeX | **KaTeX** | Fast, server-renderable typesetting |
| Styling (web) | **Tailwind CSS v4** | Utility-first, strong dark mode |
| Admin auth | **Custom single-credential** | argon2id hash + signed httpOnly cookie; creds from GitHub Secrets |
| Search | **Postgres FTS** + **⌘K palette** | `tsvector` server search + instant client fuzzy search |
| Social preview | **@vercel/og (Satori)** | Per-note Open Graph images at the edge |
| Rate limiting | **@upstash/ratelimit + Redis** | Brute-force protection on admin login + RPCs |
| Markdown | **remark / rehype** (GFM + footnotes + directives) | Rich, sanitized text blocks with `:::note` directives |
| Analytics | **Vercel Analytics** | Privacy-friendly, no cookie banner |
| Comments | **Giscus** | GitHub Discussions-backed, opt-in per note (web) |
| CI/CD | **GitHub Actions** | Secrets in GitHub; deploy web/admin → Vercel, mobile → EAS |
| Deployment | **Vercel** (web + admin) · **EAS** (mobile) | First-class Next.js + managed mobile builds |

---

## Repository Structure (monorepo)

```text
repo/
├── apps/
│   ├── web/                    # Public reader (Next.js, Vercel) — read-only
│   ├── admin/                  # Admin CRUD (Next.js, Vercel, single credential) — only writer
│   └── mobile/                 # Expo React Native reader (iOS + Android) — read-only
├── packages/
│   ├── blocks/                 # Canonical block schema + Zod types (shared contract)
│   ├── core/                   # Supabase clients, content utils (wikilinks, transclude, toc)
│   ├── renderer-web/           # React DOM block components (used by web + admin preview)
│   └── renderer-native/        # React Native block components (used by mobile)
├── turbo.json
└── pnpm-workspace.yaml
```

**Key idea:** `packages/blocks` is the single **contract**. Two renderers consume it —
`renderer-web` (DOM) and `renderer-native` (RN) — so one JSON note renders on every surface
without duplicating the schema.

---

## Information Architecture

Three navigation layers (the heart of a notes site):

1. **Topic tree** — categories → subcategories → notes, as a collapsible **sidebar** (web)
   / **drawer** (mobile). Primary navigation.
2. **Wiki-links + backlinks + transclusion** — notes reference each other with `[[slug]]`;
   parsed on save into `note_links` for **backlinks**, **unlinked mentions**, and a **graph**.
3. **In-note Table of Contents** — auto-built from headings, sticky, scroll-spy.

Plus **breadcrumbs**, **tags** (nested `#db/indexing`), and **search**.

### Example topic structure (engineering)

```text
Engineering Notes
├── System Design            (fundamentals, building blocks, case studies)
├── Data Structures & Algorithms
├── Databases                (indexing, transactions, SQL vs NoSQL)
├── Distributed Systems      (consensus, replication, partitioning)
├── Networking               (TCP/IP, HTTP, TLS, DNS)
├── Operating Systems        (processes, memory, scheduling)
├── Concurrency & Parallelism
├── DevOps & Infrastructure  (Docker, K8s, CI/CD, observability)
├── Languages & Runtimes
└── Snippets & Cheatsheets
```

---

## Best of Both Worlds — Obsidian × Notion

The goal is **Notion's editing experience** on top of **Obsidian's linked-knowledge model**,
backed by our config/DB engine. Our storage is already a Notion-style block document (an
array of typed JSON blocks) and we already have Obsidian-style `[[links]]`, so this is a
natural fit rather than a bolt-on.

| Capability | Obsidian | Notion | This system |
| --- | --- | --- | --- |
| Block-based content | — | ✓ | ✓ (typed JSON blocks) |
| Slash-command editor | — | ✓ | ✓ (BlockNote, admin) |
| Drag-to-reorder / nest blocks | — | ✓ | ✓ |
| `[[wiki-links]]` + autocomplete | ✓ | partial | ✓ |
| Backlinks ("Referenced by") | ✓ | ✓ | ✓ |
| Unlinked mentions | ✓ | — | ✓ |
| Hover-preview popovers | ✓ | ✓ | ✓ (web) |
| Transclusion / embed (`![[...]]`) | ✓ | ✓ (synced) | ✓ |
| Graph view (global + local) | ✓ | — | ✓ |
| Nested tags (`#db/indexing`) | ✓ | — | ✓ |
| Databases / collection views | — | ✓ | ✓ (table / board / gallery / list) |
| Page icon + cover image | partial | ✓ | ✓ |
| Nested pages | folders | ✓ | ✓ (topic tree + child notes) |

### Notion-style editing (admin)

- **Block editor with slash commands** — type `/` to insert any block (`/code`, `/mermaid`,
  `/callout`, `/math`, `/table`, `/toggle`, `/columns`…). Powered by **BlockNote**.
- **Drag handles** to reorder / nest; **inline toolbar** on selection; **page icon + cover**.
- **Multi-column layouts** and **toggles** as blocks; clean, minimal writing canvas.
- **Storage stays renderer-agnostic** — canonical `blocks` JSON is **our own schema**
  (portable, hand-editable). A thin adapter maps it to/from BlockNote on load/save, with
  custom BlockNote blocks backing `mermaid`, `math`, `callout`, `collection`, `embed-note`.
- **JSON / Monaco power mode** — toggle to raw JSON on the same note for bulk edits + import.

### Obsidian-style linking & knowledge graph

- **`[[wiki-link]]` autocomplete** — type `[[` to search by title/alias; **aliases** via
  `[[slug|Display]]` and a note-level `aliases` list.
- **Backlinks** ("Referenced by"), **unlinked mentions**, and **outgoing links** panels.
- **Hover previews** on internal links (web).
- **Transclusion / embeds** — `![[note]]` embeds a whole note, `![[note#heading]]` a section,
  `![[note^blockId]]` a single block. Same idea as Notion's synced blocks: one source, many
  placements.
- **Graph view** — global + **local graph** (current note's neighbors).
- **Nested tags** (`#databases/indexing`) that behave as filterable links.

### Notion-style databases (collections)

Every note carries structured metadata (topic, tags, status, `updated_at`, custom
**properties** in `metadata`), so we can offer **collection views** — live, filtered queries
over notes rendered as **table**, **board/kanban** (group by status), **gallery** (cover
cards), or **list**. A `collection` block embeds a view inline in any note (Notion's linked
database), e.g. *"all notes tagged `#distributed-systems`, grouped by status."*

---

## Database Schema

### `notes` table

```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
slug           text UNIQUE NOT NULL          -- globally unique, used in URL
aliases        text[]                        -- alt names for [[links]] + unlinked mentions
title          text NOT NULL
summary        text                          -- short description / excerpt
icon           text                          -- emoji / icon (Notion-style)
cover_image    text                          -- banner image (Notion-style)
topic_id       uuid REFERENCES topics(id)    -- where it lives in the tree
parent_note_id uuid REFERENCES notes(id)     -- nested pages (note within a note)
tags           text[]
status         text DEFAULT 'draft'          -- 'draft' | 'scheduled' | 'published' | 'evergreen'
publish_at     timestamptz                   -- scheduled publish time (cron flips to published)
sort_order     int DEFAULT 0
blocks         jsonb NOT NULL DEFAULT '[]'   -- the note content (typed blocks)
metadata       jsonb DEFAULT '{}'            -- custom typed properties (collection fields)
reading_time   int DEFAULT 0
view_count     int DEFAULT 0
preview_token  uuid DEFAULT gen_random_uuid()-- share unpublished drafts
search_tsv     tsvector                      -- generated full-text index
created_at     timestamptz DEFAULT now()
updated_at     timestamptz DEFAULT now()     -- shown as "Last updated"
```

### `topics` table (hierarchical tree)

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
slug        text UNIQUE NOT NULL
name        text NOT NULL
description text
icon        text
cover_image text
parent_id   uuid REFERENCES topics(id)       -- self-reference builds the tree
sort_order  int DEFAULT 0
```

### `note_links` table (backlinks / mentions / graph)

```sql
source_note_id uuid REFERENCES notes(id) ON DELETE CASCADE
target_note_id uuid REFERENCES notes(id) ON DELETE CASCADE
link_kind      text DEFAULT 'link'           -- 'link' | 'embed' (transclusion)
PRIMARY KEY (source_note_id, target_note_id, link_kind)
```

Populated on every save: parse `[[slug]]` and `![[slug]]` tokens out of the blocks, resolve
to note ids (by slug **or** alias), and upsert the edges. Backlinks = rows where
`target_note_id = current`. **Unlinked mentions** are computed separately by matching a
note's title/aliases across other notes that don't already link it.

### Supporting tables

```sql
-- note_revisions: full version history (confirmed) — one snapshot per save
note_revisions ( id uuid PK, note_id uuid FK, title text, blocks jsonb, created_at timestamptz )

-- reactions: per-note emoji counters, incremented via a rate-limited RPC
reactions ( note_id uuid FK, emoji text, count int, PRIMARY KEY (note_id, emoji) )

-- authors (optional): only if multi-author is wanted; single-author by default
```

---

## Block Types (`blocks` JSONB)

`BlockRenderer` maps `block.type` → a component (one per renderer: web + native).

```jsonc
// Rich text (markdown subset) with inline [[wiki-links]] and [^footnotes]
{ "type": "text", "content": "Markdown with a [[databases/indexing]] link." }

{ "type": "heading", "level": 2, "content": "Section title" }            // feeds the TOC
{ "type": "code", "language": "typescript", "filename": "app.ts", "highlight": [3,7], "content": "..." }
{ "type": "mermaid", "content": "graph TD\n  A --> B", "title": "Flow", "layout": "tabs" }
{ "type": "math", "content": "O(n \\log n)", "display": true }
{ "type": "image", "src": "https://...", "alt": "...", "caption": "optional" }
{ "type": "callout", "variant": "info|warning|error|tip|note", "title": "...", "content": "..." }
{ "type": "quote", "content": "The quote", "cite": "Author, Source" }
{ "type": "list", "ordered": false, "items": ["a", "b"] }
{ "type": "todo", "items": [{ "text": "Do X", "checked": false }] }
{ "type": "table", "headers": ["A","B"], "rows": [["a1","b1"]] }
{ "type": "divider" }

// Layout & nesting (Notion-style)
{ "type": "columns", "columns": [{ "blocks": [] }, { "blocks": [] }] }
{ "type": "tabs", "tabs": [{ "label": "npm", "blocks": [] }] }
{ "type": "details", "summary": "More", "blocks": [] }

// Transclusion — embed another note / heading / block (Obsidian ![[...]], Notion synced)
{ "type": "embed-note", "target": "databases/indexing", "anchor": "some-heading|^blockId" }

// Collection — live, filtered view over notes (Notion linked database)
{ "type": "collection", "view": "table|board|gallery|list",
  "filter": { "tag": "distributed-systems" }, "groupBy": "status", "sort": "-updated_at" }

// Media & embeds
{ "type": "video", "src": "...", "poster": "...", "caption": "..." }
{ "type": "gallery", "images": [{ "src": "...", "alt": "..." }] }
{ "type": "file", "src": "...", "name": "spec.pdf", "size": "1.2 MB" }
{ "type": "embed", "provider": "youtube", "url": "https://youtu.be/..." }

{ "type": "toc" }                                    // auto-built from headings if omitted
```

> **Renderer contract:** unknown block types render nothing (fail-safe) and log a warning,
> so old notes never break as the schema grows. Each block may carry an optional `id`, used
> for deep-linking **and as the anchor for block-level transclusion** (`![[note^id]]`); each
> is wrapped in an **error boundary** so one malformed block can't blank the whole note.

---

## Mermaid Block — diagram **and** source together

Every Mermaid block shows the **rendered diagram** *and* its **source code**.

```jsonc
{
  "type": "mermaid",
  "content": "graph TD\n  A[Client] --> B[API]\n  B --> C[(Database)]",
  "title": "Request flow",     // optional caption
  "layout": "tabs",            // "tabs" (default) | "stacked" | "split"
  "defaultTab": "diagram"      // which tab opens first when layout = "tabs"
}
```

- **`tabs` (default):** compact `[ Diagram | Source ]` toggle, opens on `defaultTab`. Source
  tab is a syntax-highlighted code block (Shiki, `mermaid` grammar) with a copy button.
- **`stacked`:** diagram on top, source directly below — **both visible at once**.
- **`split`:** side-by-side on wide screens; auto-stacks on mobile.
- Diagram renders client-side (lazy), **theme-aware**, **fail-safe** (shows source + error if
  it can't parse). On **mobile**, Mermaid renders inside a WebView with the same tabs UI.

```text
layout: "tabs" (default)                     switch to the Source tab →
┌─────────────────────────────────────┐    ┌─────────────────────────────────────┐
│  [ Diagram ]   Source                │    │   Diagram   [ Source ]        [copy] │
├─────────────────────────────────────┤    ├─────────────────────────────────────┤
│         [ rendered diagram ]         │    │  graph TD                            │
│                                      │    │    A[Client] --> B[API]              │
├─────────────────────────────────────┤    │    B --> C[(Database)]               │
│  Fig 1. Request flow  (caption)      │    └─────────────────────────────────────┘
└─────────────────────────────────────┘
```

---

## Admin Site & Authentication

A **separate** web app (`apps/admin`, no mobile) — the **only** thing that can write to the
DB. Highly locked down, **exactly one credential**, sourced from **GitHub Secrets**.

### Single-credential model

- **No user table, no signup, no OAuth** — exactly one identity, defined by environment
  variables sourced from GitHub Secrets. Rotating the login = change the secret + redeploy.
- Secrets (never in the repo, never shipped to the client):
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD_HASH` — **argon2id** hash of the password, generated once locally; the
    plaintext password is never stored anywhere (repo, DB, or secret).
  - `SESSION_SECRET` — long random string that signs/encrypts the session cookie.
  - `ADMIN_TOTP_SECRET` — **required**; enables TOTP 2FA (authenticator app).
  - `SUPABASE_SERVICE_ROLE_KEY` — server-only; used only after a verified session.

### Login flow

1. `POST /login` (HTTPS only) with username + password + **TOTP code**.
2. Server compares username in constant time, verifies the password with
   `argon2.verify(hash, password)`, then verifies the TOTP code.
3. On success → issue a **signed, encrypted, httpOnly, Secure, SameSite=Strict** session
   cookie (**1-hour TTL, sliding renewal**). On failure → generic error + rate-limit hit.
4. **Middleware** guards every admin route and server action; no valid session → `/login`.

### Hardening ("highly authenticated")

- **Brute-force protection** — Upstash rate limit per IP with exponential backoff / lockout.
- **Three outer gates** (all enabled): **TOTP 2FA**, an **IP allowlist**, and Vercel
  **deployment protection (SSO)** — layered in front of the app's own single credential.
- **CSRF tokens** on all mutations; strict **security headers** (CSP, HSTS, no-sniff).
- Admin app is **`noindex`** and never linked publicly (on `*.vercel.app` for now, custom
  domain later). Writes use the service-role key **only** inside session-verified server actions.

### GitHub Secrets → runtime env

Store `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` (+ `ADMIN_TOTP_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY`) as **GitHub Actions secrets**. The deploy workflow injects them
into the admin app's Vercel environment; at runtime they're read from `process.env`. They
never touch the repo or any client bundle. **A GitHub Actions workflow is the chosen deploy
path** — it reads these secrets, deploys web + admin to Vercel, and builds mobile via EAS.

### Admin capabilities (CRUD on the JSON DB)

- Create / edit / delete notes; set status `draft → published → evergreen`.
- Manage the topic tree (drag to reorder / nest).
- **Upload images/files** (drag-and-drop) to Supabase Storage; CDN URLs auto-filled into blocks.
- **Notion-style block editor** (BlockNote) + **JSON power mode** on the same note.
- On save: recompute `reading_time`, rebuild `note_links` from `[[links]]` / `![[embeds]]`,
  refresh unlinked mentions, snapshot a revision, trigger on-demand ISR revalidation of web.

---

## Security Model

### Row Level Security (Supabase)

```sql
-- Public web + mobile read only published/evergreen
CREATE POLICY "public_read" ON notes
  FOR SELECT USING (status IN ('published', 'evergreen'));

-- No public writes at all; writes happen server-side in admin via service role
CREATE POLICY "no_public_write" ON notes
  FOR ALL TO anon USING (false) WITH CHECK (false);
```

`topics` / `note_links` are world-readable; writes only via the admin server.

### Credential & key handling

- **Anon key** ships to web + mobile (safe; RLS enforces access).
- **Service-role key** lives only on the admin server, used only after session verification.
- Admin credentials live only in secrets/env — never in DB, repo, or client.

### Content safety

- User-authored markdown rendered through a **sanitizer** (no raw HTML injection).
- **Mermaid** rendered with `securityLevel: 'strict'` (no click-binds / script exec).
- Image/media `src` validated against allowed domains (`remotePatterns`).
- `[[wiki-links]]` resolve against known slugs/aliases only — unresolved links render as
  plain text, never arbitrary URLs.

### Rate limiting

- Upstash rate limit on **admin login** (brute force) and public view-count / reaction RPCs.

---

## Handling Large Content

| Problem | Solution |
| --- | --- |
| Very long note (100+ blocks) | Web: stream with `<Suspense>`. Mobile: virtualized list (FlashList) |
| Heavy blocks (Mermaid, KaTeX, embeds) | Lazy-loaded / WebView on mobile, with skeletons |
| Many notes in a topic | Cursor-based pagination (keyset on `updated_at`) — no OFFSET |
| Large images | `next/image` (web) / `expo-image` (mobile), CDN + blur placeholders |
| Code blocks | Shiki server-side → static HTML (web); precomputed HTML shipped to mobile |
| Offline (full sync) | Download all notes to a local store (expo-sqlite / MMKV); background sync on reconnect |
| ISR staleness | On-demand revalidation webhook from admin on save/publish |

---

## Feature Enhancements

### Navigation & discovery

- Sidebar/drawer **topic tree**, **breadcrumbs**, **tag index**, "Recently updated"/"Popular".
- **Backlinks**, **unlinked mentions**, **outgoing links**; **hover previews** + **transclusion**.
- **Graph view** (global + local); **⌘K command palette**; **full-text search** with excerpts.

### Reader experience

- Auto **Table of Contents** + scroll-spy + reading progress; **reading time**, "Last updated".
- **Copy-on-code** + line highlighting; **heading anchors**; **image lightbox**; back-to-top.
- **Export** — download note as **Markdown** + **print/PDF** (web); **bookmarks** + **share** (mobile).

### Authoring (admin)

- **Notion-style block editor** (slash commands, drag/nest, icon + cover) + **JSON power mode**.
- **Collections** (table/board/gallery/list) with filters & sorts; **revision history**.
- **Scheduled publishing** — set `publish_at`; a Vercel Cron flips status + revalidates.
- **Draft preview links** (`?token=…`); **reusable / synced blocks** (transclusion).

### Platform & SEO

- **SEO metadata** + **JSON-LD** + **dynamic OG images**; `sitemap.xml`, `robots.txt`, feeds.
- **Dark/light/system theme** (no flash), **Vercel Analytics**, per-block error boundaries.
- **Engagement:** Giscus comments, **emoji reactions** (rate-limited RPC), view counter.
- **Automated backups** — scheduled JSON export of all content to Storage (restore trail).
- **a11y** (enforced alt text, focus states, skip-to-content); optional **PWA/offline** (web).

### Mobile-specific

- **Full offline sync** — all notes downloaded to a local store; background sync on reconnect.
- **Bookmarks / reading list**, **in-app search**, **share + deep links** / universal links.
- **Push notifications** on newly published notes (Expo push; triggered by admin publish).
- **OTA updates** via EAS Update.

---

## Deployment

### Public web (`apps/web`) — Vercel (`*.vercel.app` to start)

- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `REVALIDATE_SECRET`.
- Add allowed media domains to `next.config.ts` `remotePatterns`. Custom domain later.

### Admin (`apps/admin`) — Vercel (separate project; `*.vercel.app` for now)

- Env (from GitHub Secrets): `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`,
  `ADMIN_TOTP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
  `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REVALIDATE_SECRET`.
- Enable **Vercel deployment protection (SSO)** + **IP allowlist**; `noindex`. Custom domain later.

### Mobile (`apps/mobile`) — EAS

- Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- `eas build` → distribute via **TestFlight (iOS)** / **internal track (Android)** first;
  public store submission later. `eas update` for OTA.

### Shared

- Enable Supabase RLS on all tables; seed the **sample topic tree + demo notes**.
- **GitHub Actions** is the CI/CD: run checks, deploy web + admin to Vercel, build mobile via
  EAS — all reading from **GitHub Secrets**.
- **Vercel Cron** jobs: publish scheduled notes (`publish_at`) and run the **automated JSON
  backup** to Storage on a cadence.
- Wire up **Vercel Analytics** (web) and **Giscus** comments (web).

---

## Phased Build Order

### Phase 0 — Monorepo foundation

- [ ] pnpm + Turborepo; `apps/web`, `apps/admin`, `apps/mobile`, `packages/*` scaffolds
- [ ] `packages/blocks` — block schema + Zod validation (the shared contract)
- [ ] `packages/core` — Supabase clients + content utils
- [ ] Supabase: `notes`, `topics`, `note_links` tables + RLS

### Phase 1 — Public web reader

- [ ] `renderer-web` blocks (text w/ **GFM + footnotes + directives**, heading, code, image, callout, quote, list, table)
- [ ] **MermaidBlock — diagram + source together** (tabs default; stacked/split available)
- [ ] Sidebar topic tree + breadcrumbs; note page (nested `/notes/[...slug]`) with ISR; **dark theme + toggle**

### Phase 2 — Admin site + auth + editor

- [ ] **Single-credential auth** (argon2 hash + **TOTP** + 1h signed cookie), middleware guard, rate limiting
- [ ] **IP allowlist + Vercel deployment protection (SSO)** as outer gates
- [ ] Notes/topics CRUD; topic tree manager; **media upload** to Supabase Storage
- [ ] **BlockNote editor** (slash, drag, icon/cover) + JSON power mode
- [ ] Save pipeline: reading time, link/embed parsing, **full revision history**, revalidation

### Phase 3 — Knowledge-base layer (Obsidian)

- [ ] `[[links]]` autocomplete + backlinks, **unlinked mentions**, **outgoing links**
- [ ] **Hover previews** + **transclusion** `![[note#heading^block]]`; **graph view** (global + local)
- [ ] Math (KaTeX), columns, to-do, tabs, details, gallery, video, file blocks
- [ ] Auto TOC + scroll-spy; anchors; **⌘K palette** + **full-text search** (content) + nested tags

### Phase 4 — Mobile app (iOS + Android)

- [ ] Expo scaffold + `renderer-native` block components
- [ ] Topic tree drawer, note screen, **in-app search**; Mermaid/code/math via WebView
- [ ] **Full offline sync** + background sync; **bookmarks**; **share / deep links**
- [ ] **Push notifications** (Expo push on publish); EAS build → **TestFlight + Android internal track**

### Phase 5 — Collections, engagement, performance, SEO

- [ ] **Collection views** (table/board/gallery/list) + custom note properties
- [ ] Streaming/virtualization; cursor pagination; SEO + JSON-LD + OG images; feeds
- [ ] **Comments (Giscus)**, **emoji reactions**, view counter, **Vercel Analytics**
- [ ] **Scheduled publishing** (Vercel Cron); **Markdown + PDF export**; draft preview links
- [ ] **Automated JSON backups** to Storage (Vercel Cron)

### Phase 6 — Optional extras

- [ ] PWA/offline (web); multi-author

---

## Decisions (all confirmed)

### Architecture

- **Three surfaces:** public web (Next.js) + mobile (Expo) read-only; a **separate admin
  site** (Next.js) is the sole writer.
- **Monorepo** (pnpm + Turborepo): one **block schema**, two **renderers** (web + native).
- **Editing:** Notion-style **BlockNote** + **JSON power mode**; canonical storage is our own
  portable block schema via an adapter.

### Content & rendering

- **Markdown:** GFM + **footnotes** + **directives** (`:::note`) in text blocks.
- **Math:** KaTeX (inline + block).
- **Mermaid:** `tabs` default (diagram + source); `stacked` / `split` per-block.
- **Theme:** dark default + light toggle, system-aware, no flash.
- **Seed:** sample topic tree + demo notes (Mermaid / code / table / math).

### Structure & linking

- **URLs:** nested paths (`/notes/databases/indexing`), canonical + redirects on rename.
- **Topics:** each note has a **single home topic**; appears elsewhere via links/embeds.
- **Wiki-links:** `[[slug]]`, `[[slug|Display]]`, + note-level **aliases**.
- **Graph:** global + local. **Search:** full-text over titles + tags + summary + block
  content; **⌘K palette** (Phase 3).

### Admin & security

- **Auth:** single credential from **GitHub Secrets** — **argon2id hash** + **TOTP 2FA** +
  signed httpOnly cookie, **1-hour sliding** session, rate-limited. No user DB, no signup.
- **Outer gates:** **IP allowlist** + Vercel **deployment protection (SSO)**.
- **Domain:** admin on `*.vercel.app` for now (custom later); `noindex`.
- **Media:** drag-drop upload to Supabase Storage. **Revisions:** full history (diff + restore).

### Mobile

- **Full offline sync** (all notes downloaded) + background sync.
- **Features:** bookmarks, push notifications, share / deep links, in-app search.
- **Platforms:** iOS + Android together; **TestFlight + Android internal track** first,
  public stores later.

### Platform

- **Web domain:** `*.vercel.app` to start (custom later).
- **CI/CD:** **GitHub Actions** → Vercel (web/admin) + EAS (mobile); secrets from GitHub.
- **Analytics:** Vercel Analytics. **Comments:** Giscus (web). **Reactions:** emoji (rate-limited).
- **Publishing:** scheduled via Vercel Cron. **Export:** Markdown + PDF per note.
- **Backups:** automated scheduled JSON export of all content to Storage.
- **Style:** minimal docs (Nextra / GitBook); **sans-serif** (Inter) + mono for code.

---

## Inputs Needed at Build Time

These are the only things I'll need from you as we build (no blockers to starting Phase 0):

1. **Admin credentials** — pick a username + password; I'll give you a one-liner to generate
   the **argon2id hash**, which you store as `ADMIN_PASSWORD_HASH` (with `ADMIN_USERNAME`) in
   GitHub Secrets. Enroll `ADMIN_TOTP_SECRET` in your authenticator app.
2. **IP allowlist** — the static IP(s) you'll administer from.
3. **Accounts** — Supabase, Vercel, Upstash (Redis), Expo/EAS. Apple Developer + Google Play
   only when you decide to go public.
4. **Branding** — site name, logo, accent color (neutral defaults until provided).
