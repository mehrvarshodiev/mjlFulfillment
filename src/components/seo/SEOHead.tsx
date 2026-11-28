import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { localizedSeoUrl, origin, pageMeta, type SupportedLanguage } from "./metadata";

function setMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function SEOHead() {
  const location = useLocation();
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const language = ((i18n.resolvedLanguage || "ru").split("-")[0] as SupportedLanguage);
    const path = location.pathname === "/" ? "/" : location.pathname.replace(/\/$/, "");
    const fallbackMetadata: [string, string] = pageMeta.ru["/"]!;
    const isPrivateRoute = path === "/login" || path === "/userprofile";
    const metadata: [string, string] = path === "/login"
      ? [t("auth.login.title") + " | MJL Fulfillment", t("auth.login.description")]
      : path === "/userprofile"
        ? [t("auth.profile.title") + " | MJL Fulfillment", t("auth.profile.description")]
        : pageMeta[language]?.[path] ?? pageMeta[language]["/"] ?? fallbackMetadata;
    const [title, description] = metadata;
    const canonical = localizedSeoUrl(language, path);
    const locale: Record<SupportedLanguage, string> = {
      ru: "ru_RU", en: "en_US", zh: "zh_CN", ky: "ky_KG", kk: "kk_KZ", uz: "uz_UZ", tg: "tg_TJ"
    };

    document.title = title;
    document.documentElement.lang = language === "zh" ? "zh-Hans" : language;
    setMeta("description", description);
    setMeta("robots", isPrivateRoute ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setMeta("theme-color", document.documentElement.dataset.theme === "light" ? "#f4f7fb" : "#0b1220");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "mjlFulfillment", "property");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:locale", locale[language], "property");
    setMeta("twitter:card", "summary", "name");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const supported: SupportedLanguage[] = ["ru", "en", "zh", "ky", "kk", "uz", "tg"];
    const alternates: Array<[string, string]> = [
      ...supported.map((item) => [item === "zh" ? "zh-Hans" : item, localizedSeoUrl(item, path)] as [string, string]),
      ["x-default", localizedSeoUrl("ru", path)]
    ];
    const existingAlternates = new Map<string, HTMLLinkElement>();
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((link) => {
      if (existingAlternates.has(link.hreflang)) {
        link.remove();
      } else {
        existingAlternates.set(link.hreflang, link);
      }
    });

    alternates.forEach(([hreflang, href]) => {
      const link = existingAlternates.get(hreflang) ?? document.createElement("link");
      existingAlternates.delete(hreflang);
      link.rel = "alternate";
      link.hreflang = hreflang;
      link.href = href;
      link.dataset.mjlHreflang = "true";
      if (!link.isConnected) document.head.appendChild(link);
    });
    existingAlternates.forEach((link) => link.remove());

    let schema = document.getElementById("mjl-organization-schema") as HTMLScriptElement | null;
    if (!schema) {
      schema = document.createElement("script");
      schema.id = "mjl-organization-schema";
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${origin}#organization`,
      name: "mjlFulfillment",
      url: origin,
      description,
      knowsAbout: ["Fulfillment", "Warehouse operations", "Wildberries", "Ozon", "Marketplace logistics", "Cross-border logistics"],
      areaServed: ["Russia", "Commonwealth of Independent States", "China"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Marketplace fulfillment services",
        itemListElement: ["Receiving and inspection", "Labeling and packing", "Storage", "Order picking", "Marketplace dispatch"].map((name) => ({
          "@type": "Service",
          name,
          provider: { "@id": `${origin}#organization` }
        }))
      }
    });
    if (path === "/services") {
      let faqSchema = document.getElementById("mjl-faq-schema") as HTMLScriptElement | null;
      if (!faqSchema) {
        faqSchema = document.createElement("script");
        faqSchema.id = "mjl-faq-schema";
        faqSchema.type = "application/ld+json";
        document.head.appendChild(faqSchema);
      }
      faqSchema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [1, 2, 3, 4].map((number) => ({
          "@type": "Question",
          name: t(`services.faq.items.${number}.question`),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`services.faq.items.${number}.answer`)
          }
        }))
      });
    } else {
      document.getElementById("mjl-faq-schema")?.remove();
    }
  }, [location.pathname, i18n.resolvedLanguage, t]);

  return null;
}
