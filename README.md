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

## Client authentication and account portal

The website uses **Better Auth** with the existing Neon PostgreSQL database. The sign-in page is available at `/login`; the protected client portal is `/userprofile`. Authentication runs in Vercel serverless functions and uses HttpOnly session cookies. The customer profile API validates the session for every request and never trusts a user ID supplied by the browser.

### Configure environment variables

Copy `.env.example` to `.env.local` for local development. Add the same variables to Vercel → Project → Settings → Environment Variables (Production and Preview as appropriate):

- `DATABASE_URL` — the existing Neon PostgreSQL connection string.
- `BETTER_AUTH_SECRET` — a unique random secret of at least 32 characters. Generate one with `openssl rand -base64 32`.
- `BETTER_AUTH_URL` — `https://mjlfulfillment.vercel.app` in Production; use `http://localhost:5173` locally. For Preview, set the exact Preview origin or omit it and use Vercel's deployment URL.
- `BETTER_AUTH_TRUSTED_ORIGINS` — optional comma-separated extra origins for trusted preview domains.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — Google OAuth credentials.
- `YANDEX_CLIENT_ID` and `YANDEX_CLIENT_SECRET` — Yandex ID OAuth credentials.
- `RESEND_API_KEY` and `AUTH_FROM_EMAIL` — Resend API key and a sender address on a verified domain, used to deliver one-time email sign-in links.

**Never expose these values as `VITE_*` variables.** Keep OAuth secrets, database URLs, Resend keys and the Better Auth secret server-only.

### OAuth callback URLs

Register these exact callback URLs in the OAuth provider consoles:

- Google: `https://mjlfulfillment.vercel.app/api/auth/callback/google`
- Yandex ID: `https://mjlfulfillment.vercel.app/api/auth/oauth2/callback/yandex`

For Google, add `https://mjlfulfillment.vercel.app` as an authorized JavaScript origin. For Yandex ID, enable the `login:info` and `login:email` scopes. Add each Preview URL separately if OAuth is also required on Preview deployments.

### Initialize authentication tables

After installing dependencies and setting `DATABASE_URL` and `BETTER_AUTH_SECRET`, run the Better Auth migration from the repository root:

```bash
npm install
npx auth@latest migrate --yes --config ./src/server/auth.ts
```

This creates Better Auth's user, session, account and verification tables in Neon. The customer profile table (`mjl_customer_profiles`) is created idempotently by the authenticated profile API on first use. Do not remove or rename the existing CRM tables.

After adding or changing Vercel environment variables and completing the database migration, redeploy the application. The OAuth buttons work after their corresponding provider credentials are configured. Email sign-in requires a verified Resend sender.

### Authentication behavior

- Google OAuth and Yandex ID OAuth create or sign in a customer account.
- Email sign-in uses a single-use Magic Link that expires after 10 minutes; no password is stored or required.
- The frontend route guard redirects visitors without a valid session to `/login`; the profile API independently validates the session before reading or writing customer data.
- Profile fields include contact name, company, optional INN, phone, Telegram username, marketplaces and FBO/FBS model.
- Requests and shipment history are currently a UI placeholder. A future CRM/shipment API can populate that section without changing authentication.
- Account profile and sign-out controls appear in the desktop header and mobile navigation.
- Login and profile labels are localized in RU, EN, ZH, KY, KK, UZ and TG.
