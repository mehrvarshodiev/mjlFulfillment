import {
  createHash,
  createHmac,
  createPublicKey,
  randomBytes,
  timingSafeEqual,
  verify as verifySignature
} from "node:crypto";

type AuthRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  url?: string;
};

type AuthResponse = {
  status: (code: number) => AuthResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: Record<string, unknown>) => void;
  end: () => void;
};

type AuthSession = {
  state: string;
  nonce: string;
  verifier: string;
  username: string;
  returnTo: string;
  createdAt: number;
};

type TelegramClaims = {
  iss?: string;
  aud?: string | string[];
  azp?: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  sub?: string;
  id?: string | number;
  preferred_username?: string;
};

type Jwk = {
  kid?: string;
  alg?: string;
  kty?: string;
  use?: string;
  [key: string]: unknown;
};

type TokenResponse = {
  id_token?: string;
  error?: string;
};

const COOKIE_NAME = "mjl_telegram_login";
const SESSION_TTL_SECONDS = 15 * 60;
const PROOF_TTL_SECONDS = 5 * 60;
const TELEGRAM_AUTH_URL = "https://oauth.telegram.org/auth";
const TELEGRAM_TOKEN_URL = "https://oauth.telegram.org/token";
const TELEGRAM_JWKS_URL = "https://oauth.telegram.org/.well-known/jwks.json";
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

let jwksCache: { keys: Jwk[]; expiresAt: number } | null = null;

function headerValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function requestOrigin(req: AuthRequest): string {
  const host = headerValue(req.headers["x-forwarded-host"] ?? req.headers.host)
    .split(",")[0]?.trim();
  const protocol = headerValue(req.headers["x-forwarded-proto"]).split(",")[0]?.trim() || "https";
  if (!host) return "";
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return "";
  }
}

function requestUrl(req: AuthRequest): URL {
  const origin = requestOrigin(req) || "https://mjlfulfillment.vercel.app";
  return new URL(req.url ?? "/", origin);
}

function config() {
  const clientId = process.env.TELEGRAM_LOGIN_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.TELEGRAM_LOGIN_CLIENT_SECRET?.trim() ?? "";
  const redirectUri = process.env.TELEGRAM_LOGIN_REDIRECT_URI?.trim() ?? "";
  if (!clientId || !clientSecret || !redirectUri) return null;
  try {
    const redirect = new URL(redirectUri);
    if (redirect.protocol !== "https:" || redirect.pathname !== "/api/telegram-auth") return null;
    return { clientId, clientSecret, redirectUri: redirect.toString(), redirectOrigin: redirect.origin };
  } catch {
    return null;
  }
}

function normalizeUsername(value: string): string | null {
  const username = value.trim().replace(/^@/, "");
  return USERNAME_PATTERN.test(username) ? username.toLowerCase() : null;
}

function hmac(value: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(value).digest();
}

function safeEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function createCookie(session: AuthSession, secret: string): string {
  const payload = encodeJson(session);
  const signature = hmac(payload, secret).toString("base64url");
  return `${COOKIE_NAME}=${payload}.${signature}; Max-Age=${SESSION_TTL_SECONDS}; Path=/api/telegram-auth; HttpOnly; Secure; SameSite=Lax`;
}

function clearCookie(): string {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/api/telegram-auth; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(req: AuthRequest, secret: string): AuthSession | null {
  const cookies = headerValue(req.headers.cookie);
  const encoded = cookies.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!encoded) return null;

  const [payload, signature] = encoded.split(".");
  if (!payload || !signature) return null;
  const actual = Buffer.from(signature, "base64url");
  if (!safeEqual(hmac(payload, secret), actual)) return null;

  const session = decodeJson<AuthSession>(payload);
  if (!session || Date.now() - session.createdAt > SESSION_TTL_SECONDS * 1000) return null;
  return session;
}

function safeReturnPath(value: string | null): string {
  const candidate = value ?? "/contacts";
  return /^\/(?:en\/|zh\/|ky\/|kk\/|uz\/|tg\/)?contacts\/?$/.test(candidate)
    ? candidate
    : "/contacts";
}

function redirect(res: AuthResponse, destination: string, cookie?: string): void {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (cookie) res.setHeader("Set-Cookie", cookie);
  res.setHeader("Location", destination);
  res.status(302).end();
}

function returnToForm(
  res: AuthResponse,
  origin: string,
  returnTo: string,
  result: string,
  extra: Record<string, string> = {}
): void {
  const destination = new URL(returnTo, origin);
  destination.searchParams.set("telegramVerification", result);
  for (const [key, value] of Object.entries(extra)) {
    destination.searchParams.set(key, value);
  }
  redirect(res, destination.toString(), clearCookie());
}

async function getJwks(): Promise<Jwk[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(TELEGRAM_JWKS_URL, {
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Telegram signing keys are unavailable");
  const data = await response.json() as { keys?: Jwk[] };
  if (!Array.isArray(data.keys) || data.keys.length === 0) {
    throw new Error("Telegram signing keys are invalid");
  }
  jwksCache = { keys: data.keys, expiresAt: Date.now() + 60 * 60 * 1000 };
  return data.keys;
}

async function verifyIdToken(
  token: string,
  expectedNonce: string,
  clientId: string
): Promise<TelegramClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const header = decodeJson<{ alg?: string; kid?: string }>(parts[0]!);
  const claims = decodeJson<TelegramClaims>(parts[1]!);
  if (!header || header.alg !== "RS256" || !header.kid || !claims) return null;

  const keys = await getJwks();
  const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) return null;

  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const validSignature = verifySignature(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    publicKey,
    Buffer.from(parts[2]!, "base64url")
  );
  if (!validSignature) return null;

  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const now = Math.floor(Date.now() / 1000);
  if (
    claims.iss !== "https://oauth.telegram.org" ||
    !audience.includes(clientId) ||
    (audience.length > 1 && claims.azp !== clientId) ||
    typeof claims.exp !== "number" ||
    claims.exp <= now ||
    typeof claims.iat !== "number" ||
    claims.iat > now + 60 ||
    claims.nonce !== expectedNonce ||
    !claims.sub
  ) {
    return null;
  }
  return claims;
}

export function verifyTelegramProof(value: unknown, expectedUsername: string): boolean {
  const secret = process.env.TELEGRAM_LOGIN_CLIENT_SECRET?.trim();
  if (!secret || typeof value !== "string") return false;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const actual = Buffer.from(signature, "base64url");
  if (!safeEqual(hmac(payload, secret), actual)) return false;

  const ticket = decodeJson<{ username?: string; exp?: number }>(payload);
  return Boolean(
    ticket &&
    ticket.username === expectedUsername.toLowerCase() &&
    typeof ticket.exp === "number" &&
    ticket.exp > Math.floor(Date.now() / 1000) &&
    ticket.exp <= Math.floor(Date.now() / 1000) + PROOF_TTL_SECONDS + 30
  );
}

export default async function handler(req: AuthRequest, res: AuthResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, code: "method_not_allowed" });
  }

  const url = requestUrl(req);
  const settings = config();
  const action = url.searchParams.get("action");

  if (action === "config") {
    return res.status(200).json({
      configured: Boolean(settings),
      available: Boolean(settings && requestOrigin(req) === settings.redirectOrigin)
    });
  }

  if (!settings) {
    return res.status(503).json({ ok: false, code: "telegram_login_not_configured" });
  }

  if (requestOrigin(req) !== settings.redirectOrigin) {
    return res.status(409).json({ ok: false, code: "telegram_login_wrong_domain" });
  }

  const callbackRequest = url.searchParams.has("code") || url.searchParams.has("error");
  if (!callbackRequest) {
    const username = normalizeUsername(url.searchParams.get("username") ?? "");
    const returnTo = safeReturnPath(url.searchParams.get("returnTo"));
    if (!username) {
      return res.status(400).json({ ok: false, code: "invalid_telegram_username" });
    }

    const session: AuthSession = {
      state: randomBytes(32).toString("base64url"),
      nonce: randomBytes(32).toString("base64url"),
      verifier: randomBytes(48).toString("base64url"),
      username,
      returnTo,
      createdAt: Date.now()
    };
    const challenge = createHash("sha256").update(session.verifier).digest("base64url");
    const authorization = new URL(TELEGRAM_AUTH_URL);
    authorization.searchParams.set("client_id", settings.clientId);
    authorization.searchParams.set("redirect_uri", settings.redirectUri);
    authorization.searchParams.set("response_type", "code");
    authorization.searchParams.set("scope", "openid profile");
    authorization.searchParams.set("state", session.state);
    authorization.searchParams.set("nonce", session.nonce);
    authorization.searchParams.set("code_challenge", challenge);
    authorization.searchParams.set("code_challenge_method", "S256");

    return redirect(res, authorization.toString(), createCookie(session, settings.clientSecret));
  }

  const session = readCookie(req, settings.clientSecret);
  const state = url.searchParams.get("state") ?? "";
  if (!session || !state || state !== session.state) {
    res.setHeader("Set-Cookie", clearCookie());
    return res.status(400).json({ ok: false, code: "telegram_login_invalid_state" });
  }

  if (url.searchParams.has("error")) {
    return returnToForm(res, settings.redirectOrigin, session.returnTo, "cancelled");
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return returnToForm(res, settings.redirectOrigin, session.returnTo, "failed");
  }

  try {
    const basicAuth = Buffer.from(`${settings.clientId}:${settings.clientSecret}`).toString("base64");
    const tokenResponse = await fetch(TELEGRAM_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: settings.redirectUri,
        client_id: settings.clientId,
        code_verifier: session.verifier
      }).toString(),
      signal: AbortSignal.timeout(10_000)
    });
    const tokenData = await tokenResponse.json() as TokenResponse;
    if (!tokenResponse.ok || !tokenData.id_token) {
      return returnToForm(res, settings.redirectOrigin, session.returnTo, "failed");
    }

    const claims = await verifyIdToken(tokenData.id_token, session.nonce, settings.clientId);
    const verifiedUsername = normalizeUsername(claims?.preferred_username ?? "");
    if (!claims || !verifiedUsername) {
      return returnToForm(res, settings.redirectOrigin, session.returnTo, "failed");
    }
    if (verifiedUsername !== session.username) {
      return returnToForm(res, settings.redirectOrigin, session.returnTo, "mismatch");
    }

    const ticket = encodeJson({
      username: verifiedUsername,
      exp: Math.floor(Date.now() / 1000) + PROOF_TTL_SECONDS
    });
    const proof = `${ticket}.${hmac(ticket, settings.clientSecret).toString("base64url")}`;
    return returnToForm(res, settings.redirectOrigin, session.returnTo, "success", {
      telegramUsername: verifiedUsername,
      telegramProof: proof
    });
  } catch {
    return returnToForm(res, settings.redirectOrigin, session.returnTo, "failed");
  }
}
