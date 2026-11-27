import { ArrowDown, ArrowUpRight, Boxes, Check, PackageCheck, ScanLine, Truck, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function HomePage() {
  const { t } = useTranslation();
  const services = [
    { icon: PackageCheck, title: t("services.receiving"), detail: "01 / INBOUND" },
    { icon: ScanLine, title: t("services.labeling"), detail: "02 / PREPARATION" },
    { icon: Boxes, title: t("services.packing"), detail: "03 / PACKING" },
    { icon: Truck, title: t("services.dispatch"), detail: "04 / DELIVERY" }
  ];
  return <main>
    <section className="hero-section section-wrap">
      <div className="hero-copy">
        <div className="eyebrow hero-reveal hero-reveal-1"><span className="status-dot"/>{t("home.eyebrow")}</div>
        <h1 className="hero-reveal hero-reveal-2">{t("home.title")}<span className="hero-period">.</span></h1>
        <p className="hero-description hero-reveal hero-reveal-3">{t("home.description")}</p>
        <div className="hero-actions hero-reveal hero-reveal-4"><Link to="/services#calculator" className="button-primary">{t("home.primaryCta")}<ArrowUpRight size={17}/></Link><Link to="/contacts" className="button-secondary">{t("home.secondaryCta")}</Link></div>
        <div className="hero-note"><ArrowDown size={15}/><span>END-TO-END MARKETPLACE OPERATIONS</span></div>
      </div>
      <div className="hero-visual hero-visual-reveal">
        <div className="visual-glow"/>
        <div className="warehouse-card">
          <div className="warehouse-top"><div className="warehouse-label"><Warehouse size={17}/><span>MJ / LOGISTICS NETWORK</span></div><span className="live-indicator"><i/> {t("home.workflowStatus")}</span></div>
          <div className="warehouse-art" aria-hidden="true"><div className="warehouse-grid"/><div className="warehouse-building"><div className="roof"/><div className="warehouse-door"/><div className="warehouse-windows"><i/><i/><i/><i/></div><div className="warehouse-sign">MJL <span>FULFILLMENT</span></div></div><div className="parcel parcel-one"/><div className="parcel parcel-two"/><div className="route-line"/></div>
          <div className="warehouse-bottom"><div><strong>WB <span>/</span> OZON</strong><small>MARKETPLACE READY</small></div><div className="warehouse-stat"><b>01</b><small>LOGISTICS PARTNER</small></div></div>
        </div>
        <div className="floating-chip chip-top"><PackageCheck size={16}/><span>Quality control</span><Check size={14}/></div>
        <div className="floating-chip chip-bottom"><Truck size={16}/><span>Dispatch workflow</span></div>
      </div>
      <div className="hero-index">01 <span>—</span> 04</div>
    </section>
    <section className="metrics-strip"><div className="section-wrap metrics-grid"><div><strong>FBO <span>/</span> FBS</strong><small>{t("home.facts.models")}</small></div><div><strong>06</strong><small>{t("home.facts.operations")}</small></div><div><strong>WB <span>+</span> OZON</strong><small>{t("home.facts.marketplaces")}</small></div><div><strong>RU <span>·</span> CIS <span>·</span> CN</strong><small>{t("home.facts.geography")}</small></div></div></section>
    <section className="services-preview section-wrap">
      <div className="section-heading"><div><span className="section-kicker">WHAT WE DO / 01</span><h2>{t("services.title")}</h2></div><Link to="/services" className="text-link">{t("common.learnMore")}<ArrowUpRight size={16}/></Link></div>
      <div className="service-grid">{services.map(({icon:Icon,title,detail},index)=><article className="service-tile service-tile-reveal" key={detail} style={{ animationDelay: `${index * 70}ms` }}><div className="tile-top"><Icon size={21}/><span>{detail}</span></div><h3>{title}</h3><span className="tile-arrow"><ArrowUpRight size={17}/></span></article>)}</div>
    </section>
    <section className="china-banner"><div className="section-wrap china-banner-inner"><div><span className="section-kicker">CROSS-BORDER / 02</span><h2>{t("china.title")}</h2><p>{t("china.description")}</p></div><Link to="/china" className="button-light">{t("china.cta")}<ArrowUpRight size={17}/></Link></div></section>
    <section className="closing-cta section-wrap"><div><span className="section-kicker">LET’S MOVE FORWARD / 03</span><h2>{t("contacts.title")}</h2><p>{t("contacts.description")}</p></div><Link to="/contacts" className="button-primary">{t("common.contact")}<ArrowUpRight size={17}/></Link></section>
  </main>;
}
