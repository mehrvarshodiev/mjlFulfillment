import {
  ApiRequest,
  ApiResponse,
  clean,
  createDatabase,
  ensureSchema,
  escapeHtml,
  insertLead,
  isValidPhone,
  leadNumber,
  markNotification,
  telegramCall
} from "./_lib";

type LeadPayload = {
  name?: unknown;
  phone?: unknown;
  company?: unknown;
  country?: unknown;
  productType?: unknown;
  volume?: unknown;
  marketplace?: unknown;
  telegram?: unknown;
  website?: unknown;
};

const recentRequests = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function isAllowedOrigin(req: ApiRequest): boolean {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !origin) return true;
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  if (typeof host !== "string" || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.split(",")[0].trim().toLowerCase();
  } catch {
    return false;
  }
}

function rateLimited(req: ApiRequest): boolean {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : "unknown").trim();
  const now = Date.now();
  const active = (recentRequests.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (active.length >= MAX_REQUESTS) {
    recentRequests.set(ip, active);
    return true;
  }
  active.push(now);
  recentRequests.set(ip, active);
  return false;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, code: "method_not_allowed" });
  }
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ ok: false, code: "origin_not_allowed" });
  }
  const contentLength = Number(req.headers["content-length"] ?? 0);
  if (contentLength > 12_000) {
    return res.status(413).json({ ok: false, code: "payload_too_large" });
  }
  if (rateLimited(req)) {
    return res.status(429).json({ ok: false, code: "rate_limited" });
  }

  const payload = (req.body && typeof req.body === "object" ? req.body : {}) as LeadPayload;
  if (clean(payload.website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const lead = {
    name: clean(payload.name, 100),
    phone: clean(payload.phone, 40),
    company: clean(payload.company, 120),
    country: clean(payload.country, 80),
    productType: clean(payload.productType, 120),
    volume: clean(payload.volume, 80),
    marketplace: clean(payload.marketplace, 80),
    telegram: clean(payload.telegram, 80)
  };

  if (!lead.name || !lead.phone || !lead.country || !lead.productType || !lead.volume || !isValidPhone(lead.phone)) {
    return res.status(400).json({ ok: false, code: "invalid_fields" });
  }

  let sql: ReturnType<typeof createDatabase>;
  let leadId: string;
  try {
    sql = createDatabase();
    await ensureSchema(sql);
    leadId = await insertLead(sql, lead);
  } catch {
    return res.status(503).json({ ok: false, code: "database_unavailable" });
  }

  let notification = "pending";
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (process.env.TELEGRAM_BOT_TOKEN && chatId) {
    const lines = [
      "✨ <b>НОВАЯ ЗАЯВКА · MJL FULFILLMENT</b>",
      "",
      `<b>Номер:</b> ${leadNumber(leadId)}`,
      `<b>Статус:</b> 🆕 Новая`,
      "",
      `<b>Имя:</b> ${escapeHtml(lead.name)}`,
      `<b>Телефон:</b> ${escapeHtml(lead.phone)}`,
      `<b>Компания:</b> ${escapeHtml(lead.company || "Не указана")}`,
      `<b>Страна:</b> ${escapeHtml(lead.country)}`,
      `<b>Тип товара:</b> ${escapeHtml(lead.productType)}`,
      `<b>Объём:</b> ${escapeHtml(lead.volume)}`,
      `<b>Маркетплейс:</b> ${escapeHtml(lead.marketplace || "Не указан")}`,
      `<b>Telegram:</b> ${escapeHtml(lead.telegram || "Не указан")}`,
      "",
      "<i>Заявка сохранена в CRM.</i>"
    ];
    try {
      const sent = await telegramCall<{ message_id: number }>("sendMessage", {
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [{ text: "👁 Открыть заявку", callback_data: `lead:${leadId}:open` }],
            [{ text: "🟡 Взять в работу", callback_data: `lead:${leadId}:status:in_progress` }]
          ]
        }
      });
      await markNotification(sql, leadId, "sent", sent.message_id);
      notification = "sent";
    } catch {
      try {
        await markNotification(sql, leadId, "failed");
      } catch {
        // The lead itself is already stored; notification state can be reconciled later.
      }
    }
  } else {
    try {
      await markNotification(sql, leadId, "failed");
    } catch {
      // Do not discard a successfully saved lead if notification metadata cannot be updated.
    }
  }

  return res.status(200).json({
    ok: true,
    leadId: leadNumber(leadId),
    notification
  });
}
