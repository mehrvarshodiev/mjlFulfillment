# mjlFulfillment

Multilingual B2B fulfillment platform for Wildberries and Ozon sellers in Russia/CIS and China.

## Stack
React 19, strict TypeScript, Vite, Tailwind CSS v4, React Router, Framer Motion, Lucide React, i18next.

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
