import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const pageMeta = {
  ru: {
    "/": ["Фулфилмент для Wildberries и Ozon — MJL Fulfillment", "Приёмка, проверка, маркировка, упаковка, хранение и доставка товаров на склады Wildberries и Ozon. Фулфилмент для продавцов из России, СНГ и Китая."],
    "/services": ["Услуги и тарифы фулфилмента — MJL Fulfillment", "Услуги фулфилмента для Wildberries и Ozon: приёмка, проверка качества, маркировка, упаковка, хранение, комплектация и отгрузка."],
    "/china": ["Фулфилмент из Китая в Россию — Wildberries и Ozon | MJL", "Помощь китайским фабрикам, брендам и поставщикам с подготовкой товаров и поставок для Wildberries и Ozon в России."],
    "/about": ["О компании и складской обработке — MJL Fulfillment", "Узнайте о процессах приёмки, проверки, маркировки, упаковки, хранения и подготовки товаров к отгрузке на маркетплейсы."],
    "/contacts": ["Контакты и заявка на фулфилмент — MJL Fulfillment", "Обсудите поставку на Wildberries или Ozon. Оставьте заявку на услуги фулфилмента для вашего бизнеса."]
  },
  en: {
    "/": ["MJL Fulfillment — Marketplace Fulfillment for Wildberries & Ozon", "Receiving, inspection, labeling, packing, storage and dispatch for Wildberries and Ozon sellers across Russia, CIS and China."],
    "/services": ["Fulfillment Services & Pricing — MJL Fulfillment", "Marketplace fulfillment services: receiving, quality checks, labeling, packing, storage, order picking and dispatch for Wildberries and Ozon."],
    "/china": ["China to Russia Fulfillment for Wildberries & Ozon — MJL", "A logistics and fulfillment partner helping Chinese factories, brands and suppliers prepare products for Russian marketplaces."],
    "/about": ["About MJL Fulfillment — Warehouse Operations", "Learn about our receiving, inspection, labeling, packing, storage and marketplace dispatch workflows."],
    "/contacts": ["Contact MJL Fulfillment — Request a Fulfillment Quote", "Tell us about your products and shipment volumes. Request a tailored fulfillment solution for Wildberries and Ozon."]
  },
  zh: {
    "/": ["MJL Fulfillment — Wildberries 与 Ozon 电商履约服务", "为俄罗斯、独联体及中国卖家提供收货、质检、贴标、包装、仓储及电商平台发货服务。"],
    "/services": ["仓储履约服务与费用 — MJL Fulfillment", "提供收货、质量检查、贴标、包装、仓储、订单拣货及 Wildberries、Ozon 平台发货服务。"],
    "/china": ["中国至俄罗斯电商仓储履约 — Wildberries 与 Ozon | MJL", "协助中国工厂、品牌及供应商准备商品并进入俄罗斯 Wildberries 和 Ozon 电商平台。"],
    "/about": ["关于 MJL Fulfillment — 仓储运营", "了解商品收货、检查、贴标、包装、仓储及电商平台发货流程。"],
    "/contacts": ["联系 MJL Fulfillment — 咨询仓储履约服务", "介绍您的商品及货量，获取适合 Wildberries 和 Ozon 业务的履约方案。"]
  }
} as const;

const origin = "https://mjlfulfillment.vercel.app";

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
    const language = (i18n.resolvedLanguage || "ru").split("-")[0] as keyof typeof pageMeta;
    const path = location.pathname === "/" ? "/" : location.pathname.replace(/\/$/, "");
    const metadata = pageMeta[language]?.[path as keyof typeof pageMeta[typeof language]] || pageMeta.ru["/"];
    const [title, description] = metadata;
    const canonical = language === "ru" ? `${origin}${path}` : `${origin}${path}?lang=${language}`;

    document.title = title;
    document.documentElement.lang = language;
    setMeta("description", description);
    setMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setMeta("theme-color", document.documentElement.dataset.theme === "light" ? "#f4f7fb" : "#0b1220");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "mjlFulfillment", "property");
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:locale", language === "zh" ? "zh_CN" : language === "en" ? "en_US" : "ru_RU", "property");
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

    const alternates: Array<[string, string]> = [
      ["ru", `${origin}${path}`],
      ["en", `${origin}${path}?lang=en`],
      ["zh", `${origin}${path}?lang=zh`],
      ["x-default", `${origin}${path}`]
    ];
    document.head.querySelectorAll('link[data-mjl-hreflang="true"]').forEach((element) => element.remove());
    alternates.forEach(([hreflang, href]) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = hreflang;
      link.href = href;
      link.dataset.mjlHreflang = "true";
      document.head.appendChild(link);
    });

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
