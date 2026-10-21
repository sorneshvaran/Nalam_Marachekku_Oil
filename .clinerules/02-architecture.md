# Architecture Rules

## Rendering model (Next.js App Router)

- Use the **Next.js App Router** (`src/app/`) for all routing, layouts, and pages.
- **Prefer Server Components by default.** Add a Client Component (`"use client"`) only when interactivity genuinely requires it (state, event handlers, browser APIs, effects).
- When a Client Component is needed, push the client boundary **as far down the tree as practical** so most of the page stays server-rendered.
- This repository uses a recent Next.js version whose APIs and conventions may differ from older training data. `AGENTS.md` (do not modify it) points to version-specific docs in `node_modules/next/dist/docs/` — consult them before using or assuming any Next.js API, and heed deprecation notices. Note that `next.config.ts` enables `cacheComponents` and `partialPrefetching`; do not modify config files unless explicitly asked.

## Separation of concerns

Keep these four concerns separated; do not let them bleed into each other:

1. **UI / presentation** — components and pages.
2. **Business logic** — domain rules (pricing, variants, cart rules, order rules).
3. **Data access** — all database reads/writes in one place.
4. **Validation** — input validation schemas/guards used at trust boundaries.

Conventions to follow as code is introduced (add structure when real code needs it — do not create empty scaffolding):

- `src/app/` — routes, layouts, loading/error UI.
- `src/components/` — reusable UI components.
- `src/lib/` (or similar) — business logic, data access, validation utilities.

## Hard rules

- **Database access must not be scattered throughout presentation components.** Pages and components call a data-access layer; they never embed ad-hoc queries.
- **Authentication and authorization are handled server-side** (Server Components, Server Actions, or Route Handlers). Client code may hide UI, but it is never the enforcement point.
- **Do not create a separate backend service** unless a concrete requirement appears. The App Router server side is the backend.
- **Avoid unnecessary abstraction** — no interfaces, factories, or "layers" with a single hypothetical consumer. Introduce an abstraction only when a second real use case exists.
- **Reuse over duplication** — build reusable components instead of copying UI; before creating something new, check whether an existing component or utility already covers it.
- **Keep components and functions focused and reasonably small.** If a piece of logic can be named and reused, extract it rather than growing a large file.
