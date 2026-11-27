import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUpRight, Check, ClipboardCheck, Package, ScanSearch, ShieldCheck, Truck, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import type { FulfillmentModel, PackagingType } from "../data/pricing";
import { calculateEstimate } from "../features/calculator/calculateEstimate";

const services = [
  { key: "receiving", icon: Package, number: "01" },
  { key: "inspection", icon: ScanSearch, number: "02" },
  { key: "labeling", icon: ClipboardCheck, number: "03" },
  { key: "packing", icon: ShieldCheck, number: "04" },
  { key: "storage", icon: Warehouse, number: "05" },
  { key: "dispatch", icon: Truck, number: "06" },
];


export function ServicesPage() {
  const { t, i18n } = useTranslation();
  const [marketplace, setMarketplace] = useState("both");
  const [model, setModel] = useState<FulfillmentModel>("FBO");
  const [units, setUnits] = useState(500);
  const [packaging, setPackaging] = useState<PackagingType>("standard");
  const [marking, setMarking] = useState(false);
  const [storageDays, setStorageDays] = useState(7);

  const estimate = useMemo(
    () => calculateEstimate({ units, packaging, marking, storageDays, model }),
    [units, packaging, marking, storageDays, model]
  );

  const locale = i18n.resolvedLanguage === "zh" ? "zh-CN" : i18n.resolvedLanguage === "en" ? "en-US" : "ru-RU";
  const numberFormatters = useMemo(
    () => ({
      money: new Intl.NumberFormat(locale, { style: "currency", currency: "RUB", maximumFractionDigits: 0 }),
      count: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    }),
    [locale]
  );
  const formatMoney = (value: number) => numberFormatters.money.format(value);
  const formatCount = (value: number) => numberFormatters.count.format(value);
  const selectedMarketplace = t(`services.calculator.marketplaces.${marketplace}`);
  const quoteHref = useMemo(() => {
    const params = new URLSearchParams({
      quote: "1",
      marketplace,
      model,
      units: String(units),
      packaging,
      marking: marking ? "1" : "0",
      storageDays: String(storageDays)
    });
    return `/contacts?${params.toString()}`;
  }, [marketplace, model, units, packaging, marking, storageDays]);

  return (
    <main className="services-page">
      <section className="services-hero section-wrap">
        <div className="services-hero-copy">
          <span className="section-kicker">{t("services.eyebrow")}</span>
          <h1>{t("services.title")}</h1>
          <p>{t("services.description")}</p>
          <a className="button-primary" href="#calculator">{t("common.calculate")} <ArrowDown size={17}/></a>
        </div>
        <div className="services-hero-aside">
          <span className="services-orbit"><Package size={34}/></span>
          <strong>FBO <i>×</i> FBS</strong>
          <span>{t("services.heroNote")}</span>
        </div>
      </section>

      <section className="services-catalog section-wrap">
        <div className="section-heading">
          <div><span className="section-kicker">{t("services.catalogEyebrow")}</span><h2>{t("services.catalogTitle")}</h2></div>
          <p>{t("services.catalogDescription")}</p>
        </div>
        <div className="service-detail-grid">
          {services.map(({ key, icon: Icon, number }) => (
            <article className="service-detail-card" key={key}>
              <div className="service-detail-top"><span>{number} / 06</span><Icon size={22}/></div>
              <h3>{t(`services.${key}`)}</h3>
              <p>{t(`services.details.${key}`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fulfillment-models">
        <div className="section-wrap">
          <div className="section-heading">
            <div><span className="section-kicker">{t("services.modelsEyebrow")}</span><h2>{t("services.modelsTitle")}</h2></div>
          </div>
          <div className="model-grid">
            <article className="model-card"><span className="model-code">FBO / 01</span><h3>{t("services.fbo")}</h3><p>{t("services.modelDetails.fbo")}</p><ul><li><Check size={15}/>{t("services.modelPoints.inbound")}</li><li><Check size={15}/>{t("services.modelPoints.preparation")}</li><li><Check size={15}/>{t("services.modelPoints.dispatch")}</li></ul></article>
            <article className="model-card model-card-accent"><span className="model-code">FBS / 02</span><h3>{t("services.fbs")}</h3><p>{t("services.modelDetails.fbs")}</p><ul><li><Check size={15}/>{t("services.modelPoints.storage")}</li><li><Check size={15}/>{t("services.modelPoints.picking")}</li><li><Check size={15}/>{t("services.modelPoints.dispatch")}</li></ul></article>
          </div>
        </div>
      </section>

      <section className="calculator-section section-wrap" id="calculator">
        <div className="calculator-heading"><span className="section-kicker">{t("services.calculator.eyebrow")}</span><h2>{t("services.calculator.title")}</h2><p>{t("services.calculator.intro")}</p></div>
        <div className="calculator-layout">
          <div className="calculator-form">
            <div className="calculator-field"><label>{t("services.calculator.marketplace")}</label><div className="choice-grid three" role="group" aria-label={t("services.calculator.marketplace")}>
              {["wb", "ozon", "both"].map(value => <button type="button" key={value} className={marketplace === value ? "choice-button selected" : "choice-button"} aria-pressed={marketplace === value} onClick={() => setMarketplace(value)}>{t(`services.calculator.marketplaces.${value}`)}</button>)}
            </div></div>
            <div className="calculator-field"><label>{t("services.calculator.model")}</label><div className="choice-grid two" role="group" aria-label={t("services.calculator.model")}>
              {(["FBO", "FBS"] as const).map(value => <button type="button" key={value} className={model === value ? "choice-button selected" : "choice-button"} aria-pressed={model === value} onClick={() => setModel(value)}><strong>{value}</strong><small>{t(`services.calculator.models.${value.toLowerCase()}`)}</small></button>)}
            </div></div>
            <div className="calculator-field"><div className="field-label-row"><label htmlFor="units">{t("services.calculator.items")}</label><output>{formatCount(units)}</output></div><input id="units" className="calculator-range" type="range" min="10" max="5000" step="10" value={units} onChange={event => setUnits(Number(event.target.value))}/><div className="range-ends"><span>10</span><span>5 000</span></div></div>
            <div className="calculator-field"><label htmlFor="packaging">{t("services.calculator.packaging")}</label><select id="packaging" value={packaging} onChange={event => setPackaging(event.target.value as PackagingType)}><option value="standard">{t("services.calculator.standard")}</option><option value="protective">{t("services.calculator.protective")}</option><option value="custom">{t("services.calculator.custom")}</option></select></div>
            <div className="calculator-field"><div className="field-label-row"><label htmlFor="storage">{t("services.calculator.storageDays")}</label><output>{storageDays} {t("services.calculator.days")}</output></div><input id="storage" className="calculator-range" type="range" min="0" max="60" value={storageDays} onChange={event => setStorageDays(Number(event.target.value))}/><div className="range-ends"><span>0</span><span>60 {t("services.calculator.days")}</span></div></div>
            <label className="marking-toggle"><input type="checkbox" checked={marking} onChange={event => setMarking(event.target.checked)}/><span className="custom-check"><Check size={13}/></span><span>{t("services.calculator.marking")}<small>{t("services.calculator.markingHint")}</small></span></label>
          </div>
          <aside className="calculator-result">
            <div className="result-top"><span>{t("services.calculator.estimateLabel")}</span><span className="result-live"><i/> {t("services.calculator.live")}</span></div>
            <div className="result-total">{formatMoney(estimate.total)}</div>
            <p className="result-caption">{t("services.calculator.resultCaption", { count: formatCount(units), marketplace: selectedMarketplace })}</p>
            <div className="result-divider"/>
            <div className="result-breakdown-title">{t("services.calculator.breakdown")}</div>
            <div className="result-lines">{estimate.lines.map(line => <div className="result-line" key={line.key}><span>{t(line.key)}</span><strong>{formatMoney(line.amount)}</strong></div>)}</div>
            <div className="result-total-line"><span>{t("services.calculator.total")}</span><strong>{formatMoney(estimate.total)}</strong></div>
            <p className="calculator-disclaimer">{t("services.calculator.disclaimer")}</p>
            <Link to={quoteHref} className="button-primary calculator-cta">{t("services.calculator.requestQuote")} <ArrowUpRight size={17}/></Link>
          </aside>
        </div>
      </section>

      <section className="services-faq section-wrap" aria-labelledby="services-faq-title">
        <div className="services-faq-heading">
          <span className="section-kicker">{t("services.faq.eyebrow", { defaultValue: "FAQ / FULFILLMENT" })}</span>
          <h2 id="services-faq-title">{t("services.faq.title")}</h2>
          <p>{t("services.faq.intro")}</p>
        </div>
        <div className="services-faq-list">
          {[1, 2, 3, 4].map((number) => (
            <details className="services-faq-item" key={number}>
              <summary>{t(`services.faq.items.${number}.question`)}<ArrowDown size={17}/></summary>
              <p>{t(`services.faq.items.${number}.answer`)}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
