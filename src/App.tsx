import { useTranslation } from "react-i18next";
import { ArrowUpRight, Boxes, Languages } from "lucide-react";
import { MjlLogo } from "./components/brand/MjlLogo";
export default function App() {
  const { t, i18n } = useTranslation();
  const languages = ["ru", "en", "zh"] as const;
  return <main className="min-h-screen bg-slate-950 text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <MjlLogo />
      <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
        <Languages className="ml-3 h-4 w-4 text-slate-400"/>
        {languages.map(language => <button key={language} type="button" onClick={() => void i18n.changeLanguage(language)} aria-pressed={i18n.resolvedLanguage === language} className={`rounded-full px-3 py-2 text-xs font-semibold uppercase transition ${i18n.resolvedLanguage === language ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"}`}>{language}</button>)}
      </nav>
    </header>
    <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
      <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-200"><span className="h-2 w-2 rounded-full bg-blue-400"/>{t("home.eyebrow")}</div>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.06] tracking-tight md:text-7xl">{t("home.title")}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">{t("home.description")}</p>
        <div className="mt-9 flex flex-wrap gap-3"><a href="/services" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 font-semibold transition hover:bg-blue-500">{t("home.primaryCta")} <ArrowUpRight className="h-4 w-4"/></a><a href="/contacts" className="rounded-full border border-white/15 px-6 py-3.5 font-semibold hover:bg-white/10">{t("home.secondaryCta")}</a></div>
      </div>
      <div className="glass-panel relative overflow-hidden rounded-[2rem] p-8"><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"/><div className="relative">
        <div className="mb-10 flex items-center justify-between"><div className="flex items-center gap-3"><Boxes className="h-5 w-5 text-blue-400"/><span className="font-semibold">mjl Logistics Network</span></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Operational</span></div>
        <div className="grid grid-cols-2 gap-4"><div className="metric-card"><strong>99.9%</strong><span>{t("home.metrics.sla")}</span></div><div className="metric-card"><strong>24h</strong><span>{t("home.metrics.dispatch")}</span></div><div className="metric-card col-span-2"><strong>WB <span className="text-fuchsia-400">/</span> Ozon</strong><span>{t("home.metrics.marketplaces")}</span></div></div>
      </div></div>
    </section>
  </main>;
}