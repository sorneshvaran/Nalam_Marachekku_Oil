# Coding Standards

## TypeScript

- **Strict TypeScript is the baseline.** `strict: true` is enabled in `tsconfig.json`; all code must type-check cleanly (`npx tsc --noEmit`).
- **Avoid `any`.** If it is truly unavoidable, add a short comment documenting the reason. For untrusted or untyped input, prefer `unknown` plus narrowing.
- Use the `@/*` path alias (maps to `./src/*`) instead of deep relative imports where it improves readability.

## Style and readability

- **Prefer clear, readable code over clever code.** If a one-liner needs an explanation, write the obvious version instead.
- **Use meaningful names** — no cryptic abbreviations or single letters outside trivial loops. Booleans should read like predicates (`isInStock`, `hasVariants`, `canCheckOut`).
- Match the formatting and conventions already present in the file and codebase. ESLint (`eslint-config-next`) is the source of truth; `npm run lint` must pass.
- Use **Tailwind CSS** utility classes for styling, consistent with the existing setup.

## Quality rules

- **Reuse before creating.** Check `src/` for existing utilities and components before writing a new one; extend rather than duplicate.
- **Validate external input** (form data, URL/search params, route params, request payloads) at the boundary before it is used.
- **Handle all UI states** — every asynchronous or data-driven view must cover loading, error, and empty states, not just the happy path.
- **Never silently swallow errors.** No empty `catch {}` blocks; either handle the error meaningfully, log it with context and show a safe message, or rethrow.
- **Avoid premature optimization** — write the straightforward correct version first; optimize only with evidence of a real problem.
- **Touch only what the task requires.** Do not modify unrelated files, reformat untouched code, or sneak in drive-by changes while implementing a feature.
