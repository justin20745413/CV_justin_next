# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend

```bash
npm run dev           # start dev server (Next.js, localhost:3000)
npm run build          # production build
npm run start          # run production build
npm run lint            # eslint
npm run format          # prettier --write .
npm run format:check    # prettier --check .
```

There is no test runner configured for the frontend yet.

### Backend (`backend/`, Go auth service)

```bash
cd backend
cp .env.example .env   # first time only; adjust DATABASE_URL etc. for local Postgres
go run ./cmd/server     # start the auth server, default http://localhost:8080
go build ./...          # compile check
go test ./...           # run tests (needs TEST_DATABASE_URL's database to exist)
go vet ./...             # static checks
```

`go run ./cmd/server` runs GORM `AutoMigrate` on startup (no separate migration step). `ALLOWED_ORIGIN` in `backend/.env` must match the frontend's actual origin or CORS will block auth requests. See `docs/auth-database.md` for schema/rules and the root `README.md` for the full local setup (Postgres, DBeaver connection info).

## Architecture

This is a Next.js 16 (App Router) personal portfolio/CV site using React 19, Tailwind v4, and `next-intl` for i18n.

- **i18n routing**: all pages live under `app/[locale]/`, locales are `en-US` and `zh-TW` (default `zh-TW`), configured in `intl/routing.ts`. `middleware.ts` wires `next-intl`'s middleware with the route matcher `['/', '/(zh-TW|en-US)/:path*']`.
- **Message loading**: `intl/request.ts` resolves the active locale and merges JSON message files from `messages/<locale>/{home,banner,about}.json` into a single messages object passed to `NextIntlClientProvider` in `app/[locale]/layout.tsx`. When adding a new message namespace, add the JSON file under both locale folders and import it in `intl/request.ts`.
- **Page/view split**: route files in `app/[locale]/*/page.tsx` are thin and delegate to client components in `app/view/` (e.g. `HomeClient.tsx`, `AboutClient.tsx`), which compose presentational components from `app/components/`.
- **Translation models**: `app/models/*translation.tsx` define typed helpers/shapes for translated content consumed by the corresponding view.
- **API routes**: `app/api/*/route.ts` follow the standard Next.js route handler pattern (see `app/api/contact/route.ts`, which uses `nodemailer` with `EMAIL_USER`/`EMAIL_PASS` env vars to send contact-form emails via Gmail SMTP).
- **Theming**: `app/components/ThemeProvider.tsx` wraps the app inside the locale layout, above `NextIntlClientProvider`.
- **Path alias**: `@/*` maps to the repo root (see `tsconfig.json`).
- **Auth**: `backend/` is a separate Go (Gin + GORM) service providing register/login/refresh/logout/me under `/api/auth/*`, backed by PostgreSQL. The frontend talks to it via `app/contexts/AuthContext.tsx`, wired into `app/[locale]/layout.tsx`; UI lives in `app/components/auth/` and `app/components/layout/Nav.tsx`. See `docs/auth-database.md` for the database schema (tables, columns, validation/rotation rules) and API rules.

## Code style

- Prettier config: single quotes, semicolons, 80-char width, 2-space indent, `arrowParens: avoid`, LF line endings (`.prettierrc`).
- ESLint extends `eslint-config-next` (core-web-vitals + typescript) with `eslint-config-prettier`/`eslint-plugin-prettier`, so Prettier violations surface as lint errors.
