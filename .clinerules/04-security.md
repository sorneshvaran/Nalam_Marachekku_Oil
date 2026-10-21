# Security Rules

## Secrets and configuration

- **Never hardcode secrets** — no API keys, passwords, tokens, database credentials, or any other credentials in source code, comments, tests, or docs.
- **Never commit secrets.** Use environment variables in `.env*` files for all secrets and environment-specific configuration, and keep those files out of git (they are covered by `.gitignore`).
- Access secrets via `process.env` in **server-side code only**. Never place a server secret in a `NEXT_PUBLIC_` variable — anything prefixed `NEXT_PUBLIC_` ships to the browser and must be treated as public.
- If a secret is ever committed by mistake, treat it as compromised: rotate it, do not just delete the line.

## Trust boundaries

- **Treat all client input as untrusted** — form submissions, URL and search params, route params, cookies, and request bodies must be validated (and sanitized where applicable) on the server before use.
- **Validate data before every database operation.** Validation lives at the trust boundary, not just in the UI.
- **Never rely on client-side checks for authorization.** Client-side checks exist for user experience only; they can always be bypassed.

## Authentication vs. authorization

- **Authentication** determines *who the user is*; **authorization** determines *what they are allowed to do*. Both are enforced **server-side**.
- Check authorization on **every protected operation** (each Server Action, Route Handler, or data-access call), not once at page load — users may not be able to see a page but can still invoke its actions directly.
- **Admin operations must be protected server-side on every code path.** Hiding admin UI from non-admins is not protection.

## Data exposure

- **Do not expose sensitive information in responses or logs.** Return only the fields the client actually needs (e.g., never leak internal IDs, emails, hashes, order internals, or stack traces to the browser).
- Error messages shown to users must be **generic**; keep detailed diagnostics in server-side logs, and avoid logging personal data or secrets even there.
