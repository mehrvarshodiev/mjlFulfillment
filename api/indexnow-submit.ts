type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  url?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: Record<string, unknown>) => void;
};

const SITE_ORIGIN = "https://mjlfulfillment.vercel.app";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }

  const expectedKey = process.env.INDEXNOW_SUBMIT_KEY;
  let suppliedKey = "";
  try {
    suppliedKey = new URL(req.url ?? "/", SITE_ORIGIN).searchParams.get("key") ?? "";
  } catch {
    return res.status(400).json({ ok: false });
  }
  if (!expectedKey || suppliedKey.length !== expectedKey.length || suppliedKey !== expectedKey) {
    return res.status(404).json({ ok: false });
  }

  try {
    const sitemapResponse = await fetch(`${SITE_ORIGIN}/sitemap.xml`, {
      signal: AbortSignal.timeout(10_000)
    });
    if (!sitemapResponse.ok) return res.status(502).json({ ok: false, code: "sitemap_unavailable" });
    const sitemap = await sitemapResponse.text();
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
      .map((match) => match[1] ?? "")
      .filter((url) => {\n        if (!url) return false;
        try { return new URL(url).origin === SITE_ORIGIN; } catch { return false; }
      });
    const uniqueUrls = [...new Set(urls)].slice(0, 100);
    if (uniqueUrls.length === 0) return res.status(502).json({ ok: false, code: "no_urls_found" });

    const keyValue = process.env.INDEXNOW_KEY;
    if (!keyValue) return res.status(503).json({ ok: false, code: "indexnow_not_configured" });
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "mjlfulfillment.vercel.app", key: keyValue, urlList: uniqueUrls }),
      signal: AbortSignal.timeout(15_000)
    });
    return res.status(200).json({
      ok: response.status === 200 || response.status === 202,
      indexNowStatus: response.status,
      submittedUrlCount: uniqueUrls.length,
      verificationPending: response.status === 202
    });
  } catch {
    return res.status(502).json({ ok: false, code: "indexnow_unavailable" });
  }
}
