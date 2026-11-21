import { ArrowUpRight, ClipboardList, Eye, MapPin, PackageCheck, ShieldCheck, Warehouse, Workflow } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const capabilities = [
  { icon: Warehouse, key: "warehouse" },
  { icon: ShieldCheck, key: "security" },
  { icon: ClipboardList, key: "wms" },
  { icon: Workflow, key: "sla" },
];

const flow = [
  { icon: PackageCheck, key: "receiving" },
  { icon: Eye, key: "inspection" },
  { icon: ClipboardList, key: "processing" },
  { icon: Warehouse, key: "storage" },
];

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <main className="about-page">
      <section className="about-hero section-wrap">
        <div className="about-hero-copy"><span className="section-kicker">{t("about.eyebrow")}</span><h1>{t("about.title")}</h1><p>{t("about.description")}</p><Link to="/contacts" className="button-primary">{t("common.contact")}<ArrowUpRight size={17}/></Link></div>
        <div className="about-hero-visual"><div className="about-warehouse-graphic"><div className="about-warehouse-roof"/><div className="about-warehouse-building"><div className="about-warehouse-sign">MJL <span>FULFILLMENT</span></div><div className="about-warehouse-bays"><i/><i/><i/></div></div><div className="about-box box-a"/><div className="about-box box-b"/><div className="about-box box-c"/></div><div className="about-visual-caption"><span><i/> {t("about.visualLabel")}</span><small>{t("about.visualNote")}</small></div></div>
      </section>

      <section className="about-principles section-wrap">
        <div className="section-heading"><div><span className="section-kicker">{t("about.capabilitiesEyebrow")}</span><h2>{t("about.capabilitiesTitle")}</h2></div><p>{t("about.capabilitiesDescription")}</p></div>
        <div className="about-capability-grid">{capabilities.map(({icon:Icon,key},index)=><article className="about-capability-card" key={key}><div className="about-capability-top"><Icon size={22}/><span>0{index+1}</span></div><h3>{t(`about.capabilities.${key}.title`)}</h3><p>{t(`about.capabilities.${key}.description`)}</p></article>)}</div>
      </section>

      <section className="about-flow"><div className="section-wrap"><div className="section-heading"><div><span className="section-kicker">{t("about.flowEyebrow")}</span><h2>{t("about.flowTitle")}</h2></div><p>{t("about.flowDescription")}</p></div><div className="about-flow-grid">{flow.map(({icon:Icon,key},index)=><article className="about-flow-step" key={key}><span className="about-flow-number">0{index+1}</span><span className="about-flow-icon"><Icon size={22}/></span><h3>{t(`about.flow.${key}.title`)}</h3><p>{t(`about.flow.${key}.description`)}</p></article>)}</div></div></section>

      <section className="about-location section-wrap"><div className="location-symbol"><MapPin size={25}/></div><div><span className="section-kicker">{t("about.locationEyebrow")}</span><h2>{t("about.locationTitle")}</h2><p>{t("about.locationDescription")}</p></div><div className="location-note"><strong>{t("about.location")}</strong><small>{t("about.locationNote")}</small></div></section>
      <section className="about-cta section-wrap"><div><span className="section-kicker">{t("about.ctaEyebrow")}</span><h2>{t("about.ctaTitle")}</h2><p>{t("about.ctaDescription")}</p></div><Link to="/contacts" className="button-primary">{t("common.contact")}<ArrowUpRight size={17}/></Link></section>
    </main>
  );
}
