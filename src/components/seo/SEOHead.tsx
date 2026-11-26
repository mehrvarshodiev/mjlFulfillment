import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

type SupportedLanguage = "ru" | "en" | "zh" | "ky" | "kk" | "uz" | "tg";

export const pageMeta: Record<SupportedLanguage, Record<string, [string, string]>> = {
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
  },
  ky: {
    "/": ["Wildberries жана Ozon үчүн фулфилмент — MJL Fulfillment", "Россия, КМШ жана Кытай сатуучулары үчүн товарды кабыл алуу, текшерүү, маркировкалоо, таңгактоо, сактоо жана маркетплейс кампаларына жеткирүү."],
    "/services": ["Фулфилмент кызматтары жана баалары — MJL Fulfillment", "Wildberries жана Ozon үчүн товар кабыл алуу, сапатты текшерүү, маркировкалоо, таңгактоо, сактоо жана жөнөтүү кызматтары."],
    "/china": ["Кытайдан Россияга фулфилмент — Wildberries жана Ozon | MJL", "Кытайдагы заводдорго, бренддерге жана жеткирүүчүлөргө Россиянын маркетплейстери үчүн товарларды даярдоого жардам беребиз."],
    "/about": ["MJL Fulfillment компаниясы жана кампа иштери жөнүндө", "Товарларды кабыл алуу, текшерүү, маркировкалоо, таңгактоо, сактоо жана жөнөтүүгө даярдоо процесстери."],
    "/contacts": ["MJL Fulfillment менен байланыш — фулфилмент боюнча суроо-талап", "Товарыңыз жана көлөмүңүз жөнүндө айтып бериңиз. Wildberries жана Ozon үчүн жеке сунуш алыңыз."]
  },
  kk: {
    "/": ["Wildberries пен Ozon үшін фулфилмент — MJL Fulfillment", "Ресей, ТМД және Қытай сатушыларына тауарды қабылдау, тексеру, таңбалау, қаптау, сақтау және маркетплейс қоймаларына жеткізу."],
    "/services": ["Фулфилмент қызметтері мен бағалары — MJL Fulfillment", "Wildberries пен Ozon үшін тауар қабылдау, сапаны тексеру, таңбалау, қаптау, сақтау және жөнелту қызметтері."],
    "/china": ["Қытайдан Ресейге фулфилмент — Wildberries пен Ozon | MJL", "Қытайдағы зауыттарға, брендтерге және жеткізушілерге Ресей маркетплейстеріне арналған тауарларды дайындауға көмектесеміз."],
    "/about": ["MJL Fulfillment компаниясы және қойма жұмысы туралы", "Тауарды қабылдау, тексеру, таңбалау, қаптау, сақтау және жөнелтуге дайындау үдерістері."],
    "/contacts": ["MJL Fulfillment байланыс — фулфилмент бойынша сұраныс", "Тауарыңыз бен көлеміңіз туралы айтып беріңіз. Wildberries пен Ozon үшін жеке ұсыныс алыңыз."]
  },
  uz: {
    "/": ["Wildberries va Ozon uchun fulfilment — MJL Fulfillment", "Rossiya, MDH va Xitoy sotuvchilari uchun tovarlarni qabul qilish, tekshirish, markirovkalash, qadoqlash, saqlash va marketpleys omborlariga yetkazish."],
    "/services": ["Fulfilment xizmatlari va narxlari — MJL Fulfillment", "Wildberries va Ozon uchun tovar qabul qilish, sifat nazorati, markirovka, qadoqlash, saqlash va jo‘natish xizmatlari."],
    "/china": ["Xitoydan Rossiyaga fulfilment — Wildberries va Ozon | MJL", "Xitoydagi zavodlar, brendlar va yetkazib beruvchilarga Rossiya marketpleyslari uchun mahsulotlarni tayyorlashda yordam beramiz."],
    "/about": ["MJL Fulfillment kompaniyasi va ombor jarayonlari haqida", "Tovarlarni qabul qilish, tekshirish, markirovkalash, qadoqlash, saqlash va jo‘natishga tayyorlash jarayonlari."],
    "/contacts": ["MJL Fulfillment bilan aloqa — fulfilment bo‘yicha so‘rov", "Mahsulotlaringiz va hajmingiz haqida ayting. Wildberries va Ozon uchun individual taklif oling."]
  },
  tg: {
    "/": ["Фулфилмент барои Wildberries ва Ozon — MJL Fulfillment", "Қабул, санҷиш, тамғагузорӣ, бастабандӣ, нигоҳдорӣ ва расонидани мол ба анборҳои Wildberries ва Ozon барои фурӯшандагони Русия, ИДМ ва Чин."],
    "/services": ["Хизматрасониҳои фулфилмент ва нархҳо — MJL Fulfillment", "Қабули мол, назорати сифат, тамғагузорӣ, бастабандӣ, нигоҳдорӣ ва фиристодан барои Wildberries ва Ozon."],
    "/china": ["Фулфилмент аз Чин ба Русия — Wildberries ва Ozon | MJL", "Ба корхонаҳо, брендҳо ва таъминкунандагони Чин дар омода кардани мол барои маркетплейсҳои Русия кӯмак мерасонем."],
    "/about": ["Дар бораи ширкати MJL Fulfillment ва фаъолияти анбор", "Равандҳои қабул, санҷиш, тамғагузорӣ, бастабандӣ, нигоҳдорӣ ва омода кардани мол барои фиристодан."],
    "/contacts": ["Тамос бо MJL Fulfillment — дархост барои фулфилмент", "Дар бораи мол ва ҳаҷми худ маълумот диҳед. Барои Wildberries ва Ozon пешниҳоди инфиродӣ гиред."]
  }
};

export const origin = "https://mjlfulfillment.vercel.app";

export function localizedSeoUrl(language: SupportedLanguage, path: string): string {
  const prefix = language === "ru" ? "" : `/${language}`;
  const normalizedPath = path === "/" ? "/" : path;
  return `${origin}${prefix}${normalizedPath}`;
}

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
    const metadata = pageMeta[language]?.[path] ?? pageMeta[language]["/"] ?? fallbackMetadata;
    const [title, description] = metadata;
    const canonical = localizedSeoUrl(language, path);
    const locale: Record<SupportedLanguage, string> = {
      ru: "ru_RU", en: "en_US", zh: "zh_CN", ky: "ky_KG", kk: "kk_KZ", uz: "uz_UZ", tg: "tg_TJ"
    };

    document.title = title;
    document.documentElement.lang = language === "zh" ? "zh-Hans" : language;
    setMeta("description", description);
    setMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
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
