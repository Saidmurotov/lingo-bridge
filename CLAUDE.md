# CLAUDE.md

Guidance for Claude Code when working in the **Lingo Bridge** repository.

## Project in one line

A digital platform for a university language-center spin-off ("Lingo Bridge" / «Til ko'prigi») offering three services: **document translation**, **quick text translation**, and **AI-generated learning materials**. UI language is **Uzbek**; code and comments are **English**.

Read `docs/01-PRD.md` for scope and `docs/06-ROADMAP.md` for the build order before starting a new area.

## Monorepo layout

- `apps/web` — React 18 + TypeScript + Vite + Tailwind (frontend)
- `apps/api` — Node 20 + Fastify + TypeScript + Prisma (backend)
- `services/doc-worker` — Python 3.12 + FastAPI (OCR + format-preserving translation)
- `packages/shared` — shared TypeScript types imported by both `web` and `api`
- `infra` — docker-compose, Caddyfile
- `prototype/lingo-bridge.html` — the approved UI reference; match its look & flows

## Golden rules (do not break)

1. **Never expose the Anthropic API key to the frontend.** All AI calls go through `apps/api` or `services/doc-worker`. The web app calls our own backend, never `api.anthropic.com` directly.
2. **Never log secrets or full document contents.** Redact in logs.
3. **All user input is validated with Zod** (api) before it touches the DB or the AI.
4. **File access is authorized per-user.** A user can only read their own jobs/files. Translators/admins have explicit role checks.
5. **DB changes go through Prisma migrations** — never edit the DB by hand. Run `prisma migrate dev` and commit the migration.
6. **Keep the design tokens** from `docs/05-DESIGN-SYSTEM.md`. Don't invent new colors/fonts.

## Conventions

- **TypeScript**: `strict: true`. No `any` unless justified with a comment. Prefer explicit return types on exported functions.
- **Naming**: `camelCase` for vars/functions, `PascalCase` for types/components, `snake_case` for DB columns (Prisma maps them), `kebab-case` for files in `web`.
- **API shape**: JSON only. Success → `{ data: ... }`. Error → `{ error: { code, message } }`. See `docs/04-API.md`.
- **Errors**: throw typed errors in api; a global error handler maps them to HTTP codes. Don't send stack traces to clients.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). Small, focused commits.
- **Tests**: co-locate as `*.test.ts`. At minimum, cover auth, the AI service wrappers, and job state transitions.

## UI copy rules

- All user-facing strings are **Uzbek (Latin)**. Keep them in a single place per app for future i18n (UZ/EN/RU is a roadmap item — don't hardcode strings scattered across components).
- Technical/log messages stay English.
- Match wording already used in the prototype (e.g. buttons: "Kirish", "Tarjima qilish", "Material yaratish", "Yuklab olish"; statuses: "Tarjima qilinmoqda", "Tayyor").

## Running things

```bash
pnpm dev                              # web + api together
pnpm --filter api prisma migrate dev  # apply/create migrations
pnpm --filter api db:seed             # demo data
pnpm --filter web test                # frontend tests
pnpm lint && pnpm typecheck           # before every commit
# doc-worker:
cd services/doc-worker && uvicorn app.main:app --reload --port 8000
```

## AI usage pattern (backend)

- Model: `claude-sonnet-4-6` (configurable via env `ANTHROPIC_MODEL`).
- Wrap all Anthropic calls in one module (`apps/api/src/lib/ai.ts`). Never call the SDK from route handlers directly.
- For **quick translate** and **materials**: synchronous request/response.
- For **document translation**: enqueue a job; the Python worker does the heavy lifting and calls Anthropic itself.
- Always set `max_tokens`, handle rate limits with retry+backoff, and validate the model output shape before returning.

## Domain glossary (Uzbek → meaning)

| Uzbek | Meaning in code |
|---|---|
| Fan | subject |
| Mavzu | topic |
| Tarjima | translation |
| Hujjat | document |
| Tezkor tarjima | quick translation |
| Daraja | CEFR level (A1–C2) |
| Notarial tasdiq | notarized/certified translation |
| Tarjimon | translator (role) |
| Mijoz | client (role) |
| Buyurtma | order/job |

## When unsure

- Prefer the simplest thing that satisfies `docs/01-PRD.md`.
- If a task spans multiple modules, do it phase-by-phase per `docs/06-ROADMAP.md`.
- Don't add new dependencies without a clear reason; check if `shared` already has what you need.
