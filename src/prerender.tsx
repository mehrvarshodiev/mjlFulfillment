import { createInstance } from "i18next";
import { renderToString } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import ru from "./i18n/locales/ru.json";
import en from "./i18n/locales/en.json";
import zh from "./i18n/locales/zh.json";
import { SiteLayout } from "./components/layout/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { ServicesPage } from "./pages/ServicesPage";
import { ChinaSellersPage } from "./pages/ChinaSellersPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactsPage } from "./pages/ContactsPage";
import { localizedSeoUrl, origin, pageMeta } from "./components/seo/SEOHead";

const prerenderRoutes = [
  "/", "/services", "/china", "/about", "/contacts",
  "/en/", "/en/services", "/en/china", "/en/about", "/en/contacts",
  "/zh/", "/zh/services", "/zh/china", "/zh/about", "/zh/contacts"
];

function detectRoute(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const language = first === "en" || first === "zh" ? first : "ru";
  const prefix = language === "ru" ? "" : `/${language}`;
  const routePath = language === "ru"
    ? (pathname || "/")
    : (pathname.slice(prefix.length) || "/");
  return { language, routePath: routePath.startsWith("/") ? routePath : `/${routePath}`, basename: prefix || "/" };
}

function getHeadElements(language: "ru" | "en" | "zh", path: string, title: string, description: string) {
  const canonical = localizedSeoUrl(language, path);
  const alternates: Array<[string, string]> = [
    ["ru", localizedSeoUrl("ru", path)],
    ["en", localizedSeoUrl("en", path)],
    ["zh-Hans", localizedSeoUrl("zh", path)],
    ["x-default", localizedSeoUrl("ru", path)]
  ];
  const locale = language === "zh" ? "zh_CN" : language === "en" ? "en_US" : "ru_RU";

  return new Set([
    { type: "meta", props: { name: "description", content: description } },
    { type: "meta", props: { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" } },
    { type: "meta", props: { property: "og:type", content: "website" } },
    { type: "meta", props: { property: "og:site_name", content: "mjlFulfillment" } },
    { type: "meta", props: { property: "og:title", content: title } },
    { type: "meta", props: { property: "og:description", content: description } },
    { type: "meta", props: { property: "og:url", content: canonical } },
    { type: "meta", props: { property: "og:locale", content: locale } },
    { type: "meta", props: { name: "twitter:card", content: "summary" } },
    { type: "meta", props: { name: "twitter:title", content: title } },
    { type: "meta", props: { name: "twitter:description", content: description } },
    { type: "link", props: { rel: "canonical", href: canonical } },
    ...alternates.map(([hreflang, href]) => ({
      type: "link",
      props: { rel: "alternate", hreflang, href }
    }))
  ]);
}

export async function prerender(data: { url: string }) {
  const requestUrl = new URL(data.url, origin);
  const { language, routePath, basename } = detectRoute(requestUrl.pathname);
  const translations = { ru, en, zh };
  const instance = createInstance();

  await instance.use(initReactI18next).init({
    resources: {
      ru: { translation: translations.ru },
      en: { translation: translations.en },
      zh: { translation: translations.zh }
    },
    lng: language,
    fallbackLng: "ru",
    supportedLngs: ["ru", "en", "zh"],
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
          </Route>
        </Routes>
      </StaticRouter>
    </I18nextProvider>
  );

  const html = renderToString(app);
  const metadata = pageMeta[language][routePath as keyof typeof pageMeta[typeof language]] || pageMeta.ru["/"];
  const [title, description] = metadata;
  const { parseLinks } = await import("vite-prerender-plugin/parse");
  const links = new Set([...parseLinks(html), ...prerenderRoutes]);

  return {
    html,
    links,
    head: {
      title,
      lang: language === "zh" ? "zh-Hans" : language,
      elements: getHeadElements(language, routePath, title, description)
    }
  };
}
