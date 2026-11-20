import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
export const supportedLanguages = ["ru","en","zh"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources:{ru:{translation:ru},en:{translation:en},zh:{translation:zh}},
  fallbackLng:"ru",supportedLngs:[...supportedLanguages],load:"languageOnly",
  interpolation:{escapeValue:false},
  detection:{order:["localStorage","navigator"],lookupLocalStorage:"mjl-language",caches:["localStorage"]},
  react:{useSuspense:false}
});
export default i18n;