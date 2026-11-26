import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import ky from "./locales/ky.json";
import kk from "./locales/kk.json";
import uz from "./locales/uz.json";
import tg from "./locales/tg.json";

export const supportedLanguages = ["ru", "en", "zh", "ky", "kk", "uz", "tg"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

function resolveInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "ru";
  const prefix = window.location.pathname.split("/").filter(Boolean)[0];
  if (supportedLanguages.includes(prefix as SupportedLanguage)) return prefix as SupportedLanguage;
  const legacyQuery = new URLSearchParams(window.location.search).get("lang");
  return supportedLanguages.includes(legacyQuery as SupportedLanguage)
    ? legacyQuery as SupportedLanguage
    : "ru";
}

const resources = {
  ru: { translation: ru },
  en: { translation: en },
  zh: { translation: zh },
  ky: { translation: ky },
  kk: { translation: kk },
  uz: { translation: uz },
  tg: { translation: tg }
};

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveInitialLanguage(),
  fallbackLng: "ru",
  supportedLngs: [...supportedLanguages],
  load: "languageOnly",
  interpolation: { escapeValue: false },
  react: { useSuspense: false }
});

export default i18n;
