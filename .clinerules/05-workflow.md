# Workflow Rules

## Before changing code

- For any **non-trivial change**, first inspect the existing relevant code and configuration, then **explain the intended approach** before implementing it.
- When uncertain about current Next.js APIs or conventions, **consult the version-specific documentation referenced by `AGENTS.md`** (`node_modules/next/dist/docs/`). Do not rely on memory of older Next.js versions — this project uses a version with breaking changes, and `AGENTS.md` itself must never be modified.

## Making changes

- **Make the smallest change that correctly solves the requested problem.** No more, no less.
- **Do not rewrite, reformat, or "improve" unrelated code**, and do not modify unrelated files while implementing a feature.
- **Preserve existing working functionality** when adding new features — a new feature that breaks an old one is a regression, not progress.
- **Keep changes easy to review and revert**: one concern per change, no mixed refactors, no bundled drive-by edits.

## Dependencies

- **Do not install a dependency when the existing stack can reasonably solve the problem.** The current stack (Next.js, React, TypeScript, Tailwind CSS) covers most needs.
- **Before introducing any new library, explain why it is necessary** — what it solves, why existing tools cannot, and what it costs (bundle size, maintenance, lock-in) — and get agreement first.
- Do not modify `package.json`, `next.config.ts`, or `tsconfig.json` without first explaining why the change is necessary and what it affects. Do not make unrelated configuration changes.

## After changing code

- **Run the appropriate checks after meaningful code changes**, from the project root:
  - `npm run lint` — ESLint must pass.
  - `npx tsc --noEmit` — TypeScript must type-check cleanly.
  - `npm run build` — run the production build when changes touch routing, data fetching, or anything config-adjacent.
- **Investigate and fix errors instead of suppressing them.** No stray `// @ts-ignore`, no disabling ESLint rules, no empty `catch` blocks just to make checks pass. If a suppression is genuinely unavoidable, document the reason in a comment.
- **Never claim a feature works without testing it.** Run the checks above and, where applicable, verify behavior in the running app (`npm run dev`). Report honestly what was and was not verified.
