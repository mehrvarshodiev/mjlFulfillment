import { neon } from "@neondatabase/serverless";

export type LeadInput = {
  name: string;
  phone: string;
  company: string;
  country: string;
  productType: string;
  volume: string;
  marketplace: string;
  telegram: string;
  requestContext: string;
};

export type LeadRecord = {
  id: string;
  name: string;
  phone: string;
  company: string;
  country: string;
  product_type: string;
  volume: string;
  marketplace: string;
  telegram: string;
  request_context: string;
  status: LeadStatus;
  notes: string;
  notification_status: string;
  created_at: string | Date;
  updated_at: string | Date;
};

export type LeadStatus = "new" | "in_progress" | "waiting" | "completed" | "rejected";
export type LeadFilter = LeadStatus | "all";
export type SqlClient = ReturnType<typeof neon>;

export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  url?: string;
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: Record<string, unknown>) => void;
};

let schemaReady: Promise<void> | null = null;

export function createDatabase(): SqlClient {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("Database connection is not configured");
  return neon(connectionString);
}

export async function ensureSchema(sql: SqlClient): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS mjl_leads (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL,
        product_type TEXT NOT NULL,
        volume TEXT NOT NULL,
        marketplace TEXT NOT NULL DEFAULT '',
        telegram TEXT NOT NULL DEFAULT '',
        request_context TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'new'
          CHECK (status IN ('new', 'in_progress', 'waiting', 'completed', 'rejected')),
        notes TEXT NOT NULL DEFAULT '',
        notification_status TEXT NOT NULL DEFAULT 'pending',
        telegram_message_id BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`ALTER TABLE mjl_leads ADD COLUMN IF NOT EXISTS request_context TEXT NOT NULL DEFAULT ''`;
      await sql`CREATE INDEX IF NOT EXISTS mjl_leads_status_created_idx
        ON mjl_leads (status, created_at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS mjl_lead_events (
        id BIGSERIAL PRIMARY KEY,
        lead_id BIGINT NOT NULL REFERENCES mjl_leads(id) ON DELETE CASCADE,
        actor_telegram_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS mjl_lead_events_lead_idx
        ON mjl_lead_events (lead_id, created_at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS mjl_bot_sessions (
        telegram_user_id TEXT PRIMARY KEY,
        note_lead_id BIGINT REFERENCES mjl_leads(id) ON DELETE CASCADE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS mjl_telegram_updates (
        update_id BIGINT PRIMARY KEY,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 18;
}

export async function insertLead(sql: SqlClient, lead: LeadInput): Promise<string> {
  const rows = await sql`INSERT INTO mjl_leads
    (name, phone, company, country, product_type, volume, marketplace, telegram, request_context)
    VALUES
    (${lead.name}, ${lead.phone}, ${lead.company}, ${lead.country},
     ${lead.productType}, ${lead.volume}, ${lead.marketplace}, ${lead.telegram}, ${lead.requestContext})
    RETURNING id::text AS id`;
  const id = rows[0]?.id;
  if (!id) throw new Error("Lead insert returned no id");
  await sql`INSERT INTO mjl_lead_events (lead_id, actor_telegram_id, event_type, new_value)
    VALUES (${id}, 'website', 'created', 'new')`;
  return String(id);
}

export async function getLead(sql: SqlClient, id: string): Promise<LeadRecord | null> {
  const rows = await sql`SELECT id::text AS id, name, phone, company, country,
    product_type, volume, marketplace, telegram, request_context, status, notes, notification_status,
    created_at, updated_at
    FROM mjl_leads WHERE id = ${id} LIMIT 1`;
  return (rows[0] as LeadRecord | undefined) ?? null;
}

export async function markNotification(
  sql: SqlClient,
  id: string,
  status: "sent" | "failed",
  messageId?: number
): Promise<void> {
  if (typeof messageId === "number") {
    await sql`UPDATE mjl_leads SET notification_status = ${status},
      telegram_message_id = ${messageId}, updated_at = NOW() WHERE id = ${id}`;
  } else {
    await sql`UPDATE mjl_leads SET notification_status = ${status},
      updated_at = NOW() WHERE id = ${id}`;
  }
}

export async function listLeads(
  sql: SqlClient,
  filter: LeadFilter,
  limit = 6,
  offset = 0
): Promise<{ items: LeadRecord[]; total: number }> {
  const safeLimit = Math.min(10, Math.max(1, limit));
  const safeOffset = Math.max(0, offset);
  const items = filter === "all"
    ? await sql`SELECT id::text AS id, name, phone, company, country, product_type,
        volume, marketplace, telegram, request_context, status, notes, notification_status, created_at, updated_at
        FROM mjl_leads ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`
    : await sql`SELECT id::text AS id, name, phone, company, country, product_type,
        volume, marketplace, telegram, status, notes, notification_status, created_at, updated_at
        FROM mjl_leads WHERE status = ${filter}
        ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  const counts = filter === "all"
    ? await sql`SELECT COUNT(*)::int AS total FROM mjl_leads`
    : await sql`SELECT COUNT(*)::int AS total FROM mjl_leads WHERE status = ${filter}`;
  return {
    items: items as unknown as LeadRecord[],
    total: Number(counts[0]?.total ?? 0)
  };
}

export async function updateLeadStatus(
  sql: SqlClient,
  id: string,
  nextStatus: LeadStatus,
  actorId: string
): Promise<LeadRecord | null> {
  const current = await getLead(sql, id);
  if (!current) return null;
  if (current.status !== nextStatus) {
    await sql`UPDATE mjl_leads SET status = ${nextStatus}, updated_at = NOW() WHERE id = ${id}`;
    await sql`INSERT INTO mjl_lead_events
      (lead_id, actor_telegram_id, event_type, old_value, new_value)
      VALUES (${id}, ${actorId}, 'status_changed', ${current.status}, ${nextStatus})`;
  }
  return getLead(sql, id);
}

export async function setNoteSession(sql: SqlClient, userId: string, leadId: string): Promise<void> {
  await sql`INSERT INTO mjl_bot_sessions (telegram_user_id, note_lead_id, updated_at)
    VALUES (${userId}, ${leadId}, NOW())
    ON CONFLICT (telegram_user_id) DO UPDATE
    SET note_lead_id = EXCLUDED.note_lead_id, updated_at = NOW()`;
}

export async function getNoteSession(sql: SqlClient, userId: string): Promise<string | null> {
  const rows = await sql`SELECT note_lead_id::text AS lead_id
    FROM mjl_bot_sessions WHERE telegram_user_id = ${userId} LIMIT 1`;
  return rows[0]?.lead_id ? String(rows[0].lead_id) : null;
}

export async function clearNoteSession(sql: SqlClient, userId: string): Promise<void> {
  await sql`DELETE FROM mjl_bot_sessions WHERE telegram_user_id = ${userId}`;
}

export async function appendLeadNote(
  sql: SqlClient,
  leadId: string,
  note: string,
  actorId: string
): Promise<LeadRecord | null> {
  await sql`UPDATE mjl_leads
    SET notes = CASE WHEN notes = '' THEN ${note} ELSE notes || E'\\n' || ${note} END,
        updated_at = NOW()
    WHERE id = ${leadId}`;
  await sql`INSERT INTO mjl_lead_events
    (lead_id, actor_telegram_id, event_type, new_value)
    VALUES (${leadId}, ${actorId}, 'note_added', ${note})`;
  return getLead(sql, leadId);
}

export async function getLeadStats(sql: SqlClient): Promise<Record<LeadStatus, number> & { total: number }> {
  const rows = (await sql`SELECT status, COUNT(*)::int AS count FROM mjl_leads GROUP BY status`) as unknown as Array<{ status: string; count: number | string }>;
  const result: Record<LeadStatus, number> & { total: number } = {
    new: 0, in_progress: 0, waiting: 0, completed: 0, rejected: 0, total: 0
  };
  for (const row of rows) {
    const status = String(row.status) as LeadStatus;
    if (["new", "in_progress", "waiting", "completed", "rejected"].includes(status)) {
      result[status] = Number(row.count);
      result.total += Number(row.count);
    }
  }
  return result;
}

export async function hasProcessedUpdate(sql: SqlClient, updateId: number): Promise<boolean> {
  const rows = (await sql`SELECT 1 FROM mjl_telegram_updates WHERE update_id = ${updateId} LIMIT 1`) as unknown as Array<Record<string, unknown>>;
  return rows.length > 0;
}

export async function markUpdateProcessed(sql: SqlClient, updateId: number): Promise<void> {
  await sql`INSERT INTO mjl_telegram_updates (update_id) VALUES (${updateId})
    ON CONFLICT (update_id) DO NOTHING`;
}

export async function telegramCall<T = Record<string, unknown>>(
  method: string,
  payload: Record<string, unknown>
): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram bot is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000)
  });
  const data = await response.json() as { ok?: boolean; result?: T };
  if (!response.ok || data.ok !== true) throw new Error("Telegram API request failed");
  return data.result as T;
}

export function leadNumber(id: string): string {
  return `MJL-${id.padStart(5, "0")}`;
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "🆕 Новая",
  in_progress: "🟡 В работе",
  waiting: "⏳ Ожидает ответа",
  completed: "✅ Завершена",
  rejected: "⛔ Отклонена"
};

export function formatDate(value: string | Date): string {
  const date = new Date(value instanceof Date ? value.getTime() : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow"
  }).format(date);
}
