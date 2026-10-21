# Project Overview

## What Nalam Web is

- Nalam Web is a **real e-commerce business application**, not a demo, prototype, or tutorial project. Treat every change as production-bound.
- The product catalog includes: **oils, jaggery, rock salt, rock salt powder, and oil seed cakes**.
- Products can have **multiple variants**, such as volume (e.g., oil bottle sizes) or weight (e.g., jaggery/salt pack sizes). Variants are a first-class domain concept — do not hardcode a single size/price per product when modeling or displaying products.

## Stack (already decided — do not change without an explicit request)

- **Next.js (App Router)** with **React**
- **TypeScript** (strict mode enabled in `tsconfig.json`)
- **Tailwind CSS** for styling
- **ESLint** for linting (`npm run lint`)
- **npm** as the package manager
- **Git** for version control

Project layout: application source lives in `src/`, with `src/app/` as the App Router root. The import alias `@/*` maps to `./src/*`.

## Design goals

1. **Maintainability first** — the codebase must stay easy to understand, review, and safely change as the business grows.
2. **Production readiness** — decisions should hold up for a future production deployment (performance, security, reliability), even while the app is early.
3. **Simplicity over complexity** — prefer the simplest architecture that correctly solves the problem. Do not add layers, patterns, or infrastructure "just in case."

## Scope discipline

- These rules are project guidance, not permission to build anything. Only implement what has been explicitly requested.
- When a request is ambiguous about scope, ask before expanding it.
