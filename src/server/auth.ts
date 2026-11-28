import { Pool } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { genericOAuth, magicLink, yandex } from "better-auth/plugins";

const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!databaseUrl) throw new Error("DATABASE_URL is required for authentication.");
if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be set to a random value of at least 32 characters.");
}

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const deploymentHost = process.env.VERCEL_URL;
const baseURL =
  (process.env.VERCEL_ENV === "preview" && deploymentHost ? "https://" + deploymentHost : undefined) ||
  process.env.BETTER_AUTH_URL ||
  (productionHost ? "https://" + productionHost : undefined) ||
  "http://localhost:3000";

const trustedOrigins = [
  baseURL,
  "https://mjlfulfillment.vercel.app",
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
];

const database = new Pool({
  connectionString: databaseUrl,
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000
});

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const yandexConfigured = Boolean(process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET);

async function sendMagicLink(email: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Magic-link delivery is not configured. Set RESEND_API_KEY and AUTH_FROM_EMAIL.");
  }

  const safeUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Вход в личный кабинет MJL Fulfillment",
      html: [
        "<div style=\"font-family:Arial,sans-serif;background:#0b1220;color:#eaf1fb;padding:36px 20px\">",
        "<div style=\"max-width:520px;margin:auto;padding:32px;border:1px solid #263750;border-radius:20px;background:#111e31\">",
        "<p style=\"color:#77aaff;font-weight:700;letter-spacing:2px\">MJL FULFILLMENT</p>",
        "<h1 style=\"font-size:26px\">Вход в личный кабинет</h1>",
        "<p style=\"color:#a7b6ca;line-height:1.7\">Нажмите кнопку ниже, чтобы безопасно войти в клиентский портал MJL.</p>",
        "<a href=\"" + safeUrl + "\" style=\"display:inline-block;padding:14px 22px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700\">Войти в личный кабинет</a>",
        "<p style=\"margin-top:28px;color:#7f91aa;font-size:12px;line-height:1.6\">Ссылка одноразовая и действует 10 минут. Если вы не запрашивали вход, просто проигнорируйте это письмо.</p>",
        "</div></div>"
      ].join(""),
      text: "Вход в личный кабинет MJL Fulfillment\n\nОткройте ссылку для входа (действует 10 минут):\n" + url + "\n\nЕсли вы не запрашивали вход, проигнорируйте это письмо."
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error("Email delivery failed: " + response.status + " " + details.slice(0, 300));
  }
}

const plugins = [
  magicLink({
    expiresIn: 10 * 60,
    storeToken: "hashed",
    sendMagicLink: async ({ email, url }) => sendMagicLink(email, url)
  }),
  ...(yandexConfigured
    ? [
        genericOAuth({
          config: [
            yandex({
              clientId: process.env.YANDEX_CLIENT_ID!,
              clientSecret: process.env.YANDEX_CLIENT_SECRET!,
              scopes: ["login:info", "login:email"]
            })
          ]
        })
      ]
    : [])
];

export const auth = betterAuth({
  appName: "MJL Fulfillment",
  baseURL,
  basePath: "/api/auth",
  secret: authSecret,
  trustedOrigins,
  database,
  emailAndPassword: { enabled: false },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        }
      }
    : {},
  plugins,
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 8
  }
});
