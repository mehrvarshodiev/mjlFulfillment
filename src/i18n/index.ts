import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export const supportedLanguages = ["ru", "en", "zh"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

function resolveInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "ru";
  const prefix = window.location.pathname.split("/").filter(Boolean)[0];
  if (prefix === "en" || prefix === "zh") return prefix;
  const legacyQuery = new URLSearchParams(window.location.search).get("lang");
  return legacyQuery === "en" || legacyQuery === "zh" ? legacyQuery : "ru";
}

void i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, en: { translation: en }, zh: { translation: zh } },
  lng: resolveInitialLanguage(),
  fallbackLng: "ru",
  supportedLngs: [...supportedLanguages],
  load: "languageOnly",
  interpolation: { escapeValue: false },
  react: { useSuspense: false }
});

export default i18n;
