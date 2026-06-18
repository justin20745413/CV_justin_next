# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # start dev server (Next.js, localhost:3000)
npm run build          # production build
npm run start          # run production build
npm run lint            # eslint
npm run format          # prettier --write .
npm run format:check    # prettier --check .
```

There is no test runner configured in this repo yet.

## Architecture

This is a Next.js 16 (App Router) personal portfolio/CV site using React 19, Tailwind v4, and `next-intl` for i18n.

- **i18n routing**: all pages live under `app/[locale]/`, locales are `en-US` and `zh-TW` (default `zh-TW`), configured in `intl/routing.ts`. `middleware.ts` wires `next-intl`'s middleware with the route matcher `['/', '/(zh-TW|en-US)/:path*']`.
- **Message loading**: `intl/request.ts` resolves the active locale and merges JSON message files from `messages/<locale>/{home,banner,about}.json` into a single messages object passed to `NextIntlClientProvider` in `app/[locale]/layout.tsx`. When adding a new message namespace, add the JSON file under both locale folders and import it in `intl/request.ts`.
- **Page/view split**: route files in `app/[locale]/*/page.tsx` are thin and delegate to client components in `app/view/` (e.g. `HomeClient.tsx`, `AboutClient.tsx`), which compose presentational components from `app/components/`.
- **Translation models**: `app/models/*translation.tsx` define typed helpers/shapes for translated content consumed by the corresponding view.
- **API routes**: `app/api/*/route.ts` follow the standard Next.js route handler pattern (see `app/api/contact/route.ts`, which uses `nodemailer` with `EMAIL_USER`/`EMAIL_PASS` env vars to send contact-form emails via Gmail SMTP).
- **Theming**: `app/components/ThemeProvider.tsx` wraps the app inside the locale layout, above `NextIntlClientProvider`.
- **Path alias**: `@/*` maps to the repo root (see `tsconfig.json`).

## Code style

- Prettier config: single quotes, semicolons, 80-char width, 2-space indent, `arrowParens: avoid`, LF line endings (`.prettierrc`).
- ESLint extends `eslint-config-next` (core-web-vitals + typescript) with `eslint-config-prettier`/`eslint-plugin-prettier`, so Prettier violations surface as lint errors.
