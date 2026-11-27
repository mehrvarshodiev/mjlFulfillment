# mjlFulfillment

Multilingual B2B fulfillment platform for Wildberries and Ozon sellers in Russia/CIS and China.

## Stack
React 19, strict TypeScript, Vite, Tailwind CSS v4, React Router, Lucide React, i18next, Neon PostgreSQL.

## Setup
```bash
npm install
npm run dev
```

## Checks
```bash
npm run typecheck
npm run build
npm run lint
```

## Localization
Dictionaries: `src/i18n/locales`. Language preference persists as `mjl-language`; Russian is the fallback.

## Vercel
Build command: `npm run build`. Output directory: `dist`. Never expose server-side secrets in `VITE_*` variables.

## Lead CRM
Website requests are saved in Neon PostgreSQL before notification delivery. The private Telegram CRM bot supports new/all lead queues, lead details, status changes, internal notes, and lead statistics.

Required server-only variables:
- `DATABASE_URL` (provided by the Neon Vercel Marketplace integration)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_SETUP_KEY` (temporary key used once to register the Telegram webhook)

The first production request to `/api/telegram-setup?key=...` creates the CRM tables and configures the Telegram webhook and command menu. Remove `TELEGRAM_SETUP_KEY` after setup. The webhook accepts updates only with Telegram's secret header and only from the configured private administrator chat.

Database tables are initialized idempotently by the server API: `mjl_leads`, `mjl_lead_events`, `mjl_bot_sessions`, and `mjl_telegram_updates`.

## Telegram username verification on the contact form

The Telegram field is optional. When provided, the visitor must verify that exact public username through Telegram Login (OpenID Connect) before the lead is accepted. The server validates Telegram's signed ID token and stores a short-lived verification ticket in an HttpOnly cookie; the ticket is never exposed to frontend JavaScript.

Configure the existing MJL CRM bot in `@BotFather` → select the bot → **Login Widget**:
- Allowed website origin: `https://mjlfulfillment.vercel.app`
- Allowed redirect URI: `https://mjlfulfillment.vercel.app/api/telegram-auth`
- Keep the default `RS256` signing algorithm.

Add these server-only Vercel Production environment variables:
- `TELEGRAM_LOGIN_CLIENT_ID`
- `TELEGRAM_LOGIN_CLIENT_SECRET` (Sensitive)
- `TELEGRAM_LOGIN_REDIRECT_URI=https://mjlfulfillment.vercel.app/api/telegram-auth`

Never expose the client secret in a `VITE_*` variable. Redeploy after adding the variables. Preview URLs require their own Allowed URL entries and matching environment configuration; the production redirect must not be reused with a different host.
