import {
  type ApiRequest,
  type ApiResponse,
  createDatabase,
  ensureSchema,
  telegramCall
} from "../telegram-crm";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }

  const setupKey = process.env.TELEGRAM_SETUP_KEY;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!setupKey || !webhookSecret) {
    return res.status(503).json({ ok: false, code: "setup_not_configured" });
  }

  let suppliedKey = "";
  try {
    suppliedKey = new URL(req.url ?? "/", "https://mjlfulfillment.vercel.app")
      .searchParams.get("key") ?? "";
  } catch {
    return res.status(400).json({ ok: false });
  }
  if (suppliedKey.length !== setupKey.length || suppliedKey !== setupKey) {
    return res.status(404).json({ ok: false });
  }

  try {
    const sql = createDatabase();
    await ensureSchema(sql);
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || "mjlfulfillment.vercel.app";
    const webhookUrl = `https://${baseUrl}/api/telegram-webhook`;
    await telegramCall("setWebhook", {
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ["message", "callback_query"],
      max_connections: 10
    });
    await telegramCall("setMyCommands", {
      commands: [
        { command: "start", description: "Открыть главное меню CRM" },
        { command: "leads", description: "Посмотреть все заявки" },
        { command: "new", description: "Посмотреть новые заявки" },
        { command: "status", description: "Статистика заявок" },
        { command: "help", description: "Справка по боту" }
      ]
    });
    return res.status(200).json({ ok: true, database: "ready", webhook: "configured" });
  } catch {
    return res.status(502).json({ ok: false, code: "setup_failed" });
  }
}
