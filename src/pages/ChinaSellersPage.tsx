import { ArrowRight, ArrowUpRight, Boxes, CheckCircle2, ClipboardCheck, Globe2, Languages, PackageCheck, ShieldCheck, Truck, Warehouse } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const steps = [
  { icon: Boxes, number: "01", key: "consolidation" },
  { icon: ClipboardCheck, number: "02", key: "preparation" },
  { icon: ShieldCheck, number: "03", key: "compliance" },
  { icon: Truck, number: "04", key: "delivery" },
];

export function ChinaSellersPage() {
  const { t } = useTranslation();
  const benefits = [
    { icon: Languages, key: "bilingual" },
    { icon: PackageCheck, key: "marketplaceReady" },
    { icon: Globe2, key: "crossBorder" },
    { icon: CheckCircle2, key: "visibility" },
  ];

  return (
    <main className="china-page">
      <section className="china-hero section-wrap">
        <div className="china-hero-copy">
          <span className="section-kicker">{t("china.eyebrow")}</span>
          <h1>{t("china.title")}</h1>
          <p>{t("china.description")}</p>
          <div className="china-hero-actions">
            <Link className="button-primary" to="/contacts?source=china">{t("china.cta")}<ArrowUpRight size={17}/></Link>
            <a className="button-secondary" href="#china-process">{t("china.processLink")}<ArrowRight size={16}/></a>
          </div>
          <div className="china-trust-row"><span><Languages size={15}/>{t("china.languageSupport")}</span><span><PackageCheck size={15}/>{t("china.marketplaceSupport")}</span></div>
        </div>
        <div className="china-visual" aria-label={t("china.visualAlt")}>
          <div className="china-visual-glow"/>
          <div className="china-route-label route-cn"><i/> CHINA / SUPPLIER</div>
          <div className="china-route-label route-ru"><i/> RUSSIA / MARKETPLACE</div>
          <div className="china-route-map"><div className="route-path"/><div className="route-node node-cn"><Globe2 size={23}/></div><div className="route-node node-ru"><Warehouse size={23}/></div><div className="route-parcel"><PackageCheck size={30}/></div></div>
          <div className="china-visual-footer"><span>CN</span><b>→</b><span>RU</span><small>ONE CONNECTED WORKFLOW</small></div>
        </div>
      </section>

      <section className="china-benefits section-wrap">
        <div className="section-heading"><div><span className="section-kicker">{t("china.whyEyebrow")}</span><h2>{t("china.whyTitle")}</h2></div><p>{t("china.whyDescription")}</p></div>
        <div className="china-benefit-grid">
          {benefits.map(({icon:Icon,key},index)=><article className="china-benefit-card" key={key}><span className="china-benefit-icon"><Icon size={22}/></span><span className="china-card-index">0{index+1}</span><h3>{t(`china.benefits.${key}.title`)}</h3><p>{t(`china.benefits.${key}.description`)}</p></article>)}
        </div>
      </section>

      <section className="china-process" id="china-process">
        <div className="section-wrap">
          <div className="section-heading"><div><span className="section-kicker">{t("china.processEyebrow")}</span><h2>{t("china.processTitle")}</h2></div><p>{t("china.processDescription")}</p></div>
          <div className="china-process-grid">
            {steps.map(({icon:Icon,number,key},index)=><article className="china-process-card" key={key}><div className="process-card-top"><span>{number} / 04</span><Icon size={23}/></div><h3>{t(`china.steps.${key}.title`)}</h3><p>{t(`china.steps.${key}.description`)}</p>{index!==steps.length-1&&<span className="process-connector"><ArrowRight size={16}/></span>}</article>)}
          </div>
        </div>
      </section>

      <section className="china-marketplaces section-wrap">
        <div className="marketplace-copy"><span className="section-kicker">{t("china.marketplaceEyebrow")}</span><h2>{t("china.marketplaceTitle")}</h2><p>{t("china.marketplaceDescription")}</p><Link className="text-link" to="/services">{t("common.learnMore")}<ArrowUpRight size={16}/></Link></div>
        <div className="marketplace-panels"><article><span className="marketplace-monogram">WB</span><div><h3>Wildberries</h3><p>{t("china.wildberries")}</p></div><ArrowUpRight size={18}/></article><article><span className="marketplace-monogram ozon">O</span><div><h3>Ozon</h3><p>{t("china.ozon")}</p></div><ArrowUpRight size={18}/></article></div>
      </section>

      <section className="china-cta"><div className="section-wrap china-cta-inner"><div><span className="section-kicker">{t("china.ctaEyebrow")}</span><h2>{t("china.ctaTitle")}</h2><p>{t("china.ctaDescription")}</p></div><Link to="/contacts?source=china" className="button-light">{t("china.cta")}<ArrowUpRight size={17}/></Link></div></section>
    </main>
  );
}
