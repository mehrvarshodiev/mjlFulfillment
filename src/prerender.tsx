import { createInstance } from "i18next";
import { renderToString } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { Route, Routes, StaticRouter } from "react-router-dom";
import ru from "./i18n/locales/ru.json";
import en from "./i18n/locales/en.json";
import zh from "./i18n/locales/zh.json";
import ky from "./i18n/locales/ky.json";
import kk from "./i18n/locales/kk.json";
import uz from "./i18n/locales/uz.json";
import tg from "./i18n/locales/tg.json";
import { authTranslations } from "./i18n/auth-translations";
import { SiteLayout } from "./components/layout/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { ServicesPage } from "./pages/ServicesPage";
import { ChinaSellersPage } from "./pages/ChinaSellersPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactsPage } from "./pages/ContactsPage";
import { LoginPage } from "./pages/LoginPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { RequireAuth } from "./auth/RequireAuth";
import { localizedSeoUrl, origin, pageMeta } from "./components/seo/metadata";

type SupportedLanguage = "ru" | "en" | "zh" | "ky" | "kk" | "uz" | "tg";
const supportedLanguages: SupportedLanguage[] = ["ru", "en", "zh", "ky", "kk", "uz", "tg"];
const resources = {
  ru: { translation: { ...ru, auth: authTranslations.ru } },
  en: { translation: { ...en, auth: authTranslations.en } },
  zh: { translation: { ...zh, auth: authTranslations.zh } },
  ky: { translation: { ...ky, auth: authTranslations.ky } },
  kk: { translation: { ...kk, auth: authTranslations.kk } },
  uz: { translation: { ...uz, auth: authTranslations.uz } },
  tg: { translation: { ...tg, auth: authTranslations.tg } }
};

function detectRoute(pathname: string): { language: SupportedLanguage; routePath: string; basename: string } {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] as SupportedLanguage | undefined;
  const language: SupportedLanguage = first && supportedLanguages.includes(first) ? first : "ru";
  const prefix = language === "ru" ? "" : `/${language}`;
  const routePath = prefix ? (pathname.slice(prefix.length) || "/") : (pathname || "/");
  return {
    language,
    routePath: routePath.startsWith("/") ? routePath : `/${routePath}`,
    basename: prefix || "/"
  };
}

function getHeadElements(language: SupportedLanguage, path: string, title: string, description: string) {
  const canonical = localizedSeoUrl(language, path);
  const alternates = supportedLanguages.map((item) => [
    item === "zh" ? "zh-Hans" : item,
    localizedSeoUrl(item, path)
  ] as [string, string]);
  alternates.push(["x-default", localizedSeoUrl("ru", path)]);
  const locale: Record<SupportedLanguage, string> = {
    ru: "ru_RU", en: "en_US", zh: "zh_CN", ky: "ky_KG", kk: "kk_KZ", uz: "uz_UZ", tg: "tg_TJ"
  };

  return new Set([
    { type: "meta", props: { name: "description", content: description } },
    { type: "meta", props: { name: "robots", content: path === "/login" || path === "/userprofile" ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" } },
    { type: "meta", props: { property: "og:type", content: "website" } },
    { type: "meta", props: { property: "og:site_name", content: "mjlFulfillment" } },
    { type: "meta", props: { property: "og:title", content: title } },
    { type: "meta", props: { property: "og:description", content: description } },
    { type: "meta", props: { property: "og:url", content: canonical } },
    { type: "meta", props: { property: "og:locale", content: locale[language] } },
    { type: "meta", props: { name: "twitter:card", content: "summary" } },
    { type: "meta", props: { name: "twitter:title", content: title } },
    { type: "meta", props: { name: "twitter:description", content: description } },
    { type: "link", props: { rel: "canonical", href: canonical } },
    ...alternates.map(([hreflang, href]) => ({ type: "link", props: { rel: "alternate", hreflang, href } }))
  ]);
}

export async function prerender(data: { url: string }) {
  const requestUrl = new URL(data.url, origin);
  const { language, routePath, basename } = detectRoute(requestUrl.pathname);
  const instance = createInstance();

  await instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "ru",
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

  const app = (
    <I18nextProvider i18n={instance}>
      <StaticRouter basename={basename} location={requestUrl.pathname}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="china" element={<ChinaSellersPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route path="userprofile" element={<UserProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </StaticRouter>
    </I18nextProvider>
  );

  const html = renderToString(app);
  const fallbackMetadata: [string, string] = pageMeta.ru["/"]!;
  const metadata = pageMeta[language][routePath] ?? pageMeta[language]["/"] ?? fallbackMetadata;
  const [title, description] = metadata;

  const organizationSchema = {
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
  };

  const structuredData: Array<{ id: string; data: Record<string, unknown> }> = [
    { id: "mjl-organization-schema", data: organizationSchema }
  ];

  if (routePath === "/services") {
    structuredData.push({
      id: "mjl-faq-schema",
      data: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [1, 2, 3, 4].map((number) => ({
          "@type": "Question",
          name: instance.t(`services.faq.items.${number}.question`),
          acceptedAnswer: {
            "@type": "Answer",
            text: instance.t(`services.faq.items.${number}.answer`)
          }
        }))
      }
    });
  }

  return {
    html,
    head: {
      title,
      lang: language === "zh" ? "zh-Hans" : language,
      elements: getHeadElements(language, routePath, title, description),
      structuredData
    }
  };
}
