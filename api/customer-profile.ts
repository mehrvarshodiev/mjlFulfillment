import { neon } from "@neondatabase/serverless";
import type { IncomingMessage, ServerResponse } from "node:http";
import { auth } from "../src/server/auth.js";

type ApiRequest = IncomingMessage & { body?: unknown };
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};
type FulfillmentModel = "FBO" | "FBS";
type Marketplace = "wildberries" | "ozon";
type CustomerProfile = {
  contactName: string;
  companyName: string;
  inn: string;
  phone: string;
  telegram: string;
  marketplaces: Marketplace[];
  fulfillmentModel: FulfillmentModel;
};

function requestHeaders(req: ApiRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }
  return headers;
}

function isSameOrigin(req: ApiRequest): boolean {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !origin) return req.method === "GET";

  const forwardedHost = req.headers["x-forwarded-host"];
  const host = (typeof forwardedHost === "string" ? forwardedHost : req.headers.host)
    ?.split(",")[0]?.trim().toLowerCase();
  if (!host) return false;

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = (typeof forwardedProto === "string" ? forwardedProto.split(",")[0]?.trim() : "")
    || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  try {
    return new URL(origin).origin === new URL(protocol + "://" + host).origin;
  } catch {
    return false;
  }
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function parseBody(body: unknown): Record<string, unknown> {
  if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  if (typeof body === "string") {
    try {
      const parsed: unknown = JSON.parse(body);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeMarketplaces(value: unknown): Marketplace[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is Marketplace =>
    item === "wildberries" || item === "ozon"
  ))];
}

function toProfile(row: Record<string, unknown>): CustomerProfile {
  let marketplaces: unknown = row.marketplaces;
  if (typeof marketplaces === "string") {
    try { marketplaces = JSON.parse(marketplaces); } catch { marketplaces = []; }
  }
  return {
    contactName: String(row.contact_name ?? ""),
    companyName: String(row.company_name ?? ""),
    inn: String(row.inn ?? ""),
    phone: String(row.phone ?? ""),
    telegram: String(row.telegram ?? ""),
    marketplaces: normalizeMarketplaces(marketplaces),
    fulfillmentModel: row.fulfillment_model === "FBS" ? "FBS" : "FBO"
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Vary", "Cookie, Origin");

  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ ok: false, code: "method_not_allowed" });
  }
  if (!isSameOrigin(req)) return res.status(403).json({ ok: false, code: "origin_not_allowed" });

  let session;
  try {
    session = await auth.api.getSession({ headers: requestHeaders(req) });
  } catch {
    return res.status(503).json({ ok: false, code: "authentication_unavailable" });
  }
  if (!session) return res.status(401).json({ ok: false, code: "unauthorized" });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ ok: false, code: "database_unavailable" });

  try {
    const sql = neon(databaseUrl);
    await sql`CREATE TABLE IF NOT EXISTS mjl_customer_profiles (
      user_id TEXT PRIMARY KEY,
      contact_name VARCHAR(160) NOT NULL DEFAULT '',
      company_name VARCHAR(180) NOT NULL DEFAULT '',
      inn VARCHAR(12),
      phone VARCHAR(40) NOT NULL DEFAULT '',
      telegram VARCHAR(40) NOT NULL DEFAULT '',
      marketplaces JSONB NOT NULL DEFAULT '[]'::jsonb,
      fulfillment_model VARCHAR(3) NOT NULL DEFAULT 'FBO',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    if (req.method === "GET") {
      await sql`INSERT INTO mjl_customer_profiles (user_id, contact_name)
        VALUES (${session.user.id}, ${session.user.name || ""})
        ON CONFLICT (user_id) DO NOTHING`;
      const rows = await sql`SELECT contact_name, company_name, inn, phone, telegram, marketplaces, fulfillment_model
        FROM mjl_customer_profiles WHERE user_id = ${session.user.id} LIMIT 1`;
      if (!rows[0]) return res.status(404).json({ ok: false, code: "profile_not_found" });
      return res.status(200).json({ ok: true, profile: toProfile(rows[0] as Record<string, unknown>) });
    }

    const body = parseBody(req.body);
    const marketplaces = normalizeMarketplaces(body.marketplaces);
    const fulfillmentModel = body.fulfillmentModel === "FBO" || body.fulfillmentModel === "FBS"
      ? body.fulfillmentModel
      : null;
    const profile: CustomerProfile = {
      contactName: clean(body.contactName, 160),
      companyName: clean(body.companyName, 180),
      inn: clean(body.inn, 12).replace(/\D/g, ""),
      phone: clean(body.phone, 40),
      telegram: clean(body.telegram, 40).replace(/^@/, ""),
      marketplaces,
      fulfillmentModel: fulfillmentModel ?? "FBO"
    };

    if (
      !profile.contactName ||
      !profile.companyName ||
      !profile.phone ||
      profile.phone.replace(/\D/g, "").length < 7 ||
      (profile.inn && !/^(?:\d{10}|\d{12})$/.test(profile.inn)) ||
      (profile.telegram && !/^[A-Za-z0-9_]{5,32}$/.test(profile.telegram)) ||
      marketplaces.length === 0 ||
      !fulfillmentModel
    ) {
      return res.status(400).json({ ok: false, code: "invalid_profile" });
    }

    const rows = await sql`INSERT INTO mjl_customer_profiles
      (user_id, contact_name, company_name, inn, phone, telegram, marketplaces, fulfillment_model, updated_at)
      VALUES (${session.user.id}, ${profile.contactName}, ${profile.companyName}, ${profile.inn || null},
        ${profile.phone}, ${profile.telegram}, ${JSON.stringify(profile.marketplaces)}::jsonb,
        ${profile.fulfillmentModel}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        contact_name = EXCLUDED.contact_name,
        company_name = EXCLUDED.company_name,
        inn = EXCLUDED.inn,
        phone = EXCLUDED.phone,
        telegram = EXCLUDED.telegram,
        marketplaces = EXCLUDED.marketplaces,
        fulfillment_model = EXCLUDED.fulfillment_model,
        updated_at = NOW()
      RETURNING contact_name, company_name, inn, phone, telegram, marketplaces, fulfillment_model`;

    return res.status(200).json({
      ok: true,
      profile: toProfile(rows[0] as Record<string, unknown>)
    });
  } catch {
    return res.status(503).json({ ok: false, code: "profile_service_unavailable" });
  }
}
