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
