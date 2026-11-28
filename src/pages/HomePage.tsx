import { ArrowDown, ArrowUpRight, Boxes, Calculator, Check, ClipboardList, FileText, PackageCheck, ScanLine, Truck, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function HomePage() {
  const { t } = useTranslation();
  const services = [
    { icon: PackageCheck, title: t("services.receiving"), detail: t("home.serviceStages.inbound") },
    { icon: ScanLine, title: t("services.labeling"), detail: t("home.serviceStages.preparation") },
    { icon: Boxes, title: t("services.packing"), detail: t("home.serviceStages.packing") },
    { icon: Truck, title: t("services.dispatch"), detail: t("home.serviceStages.delivery") }
  ];
  const process = [
    { icon: FileText, number: "01", key: "request" },
    { icon: Calculator, number: "02", key: "scope" },
    { icon: ClipboardList, number: "03", key: "prepare" },
    { icon: PackageCheck, number: "04", key: "handoff" }
  ];

  return <main>
    <section className="hero-section section-wrap">
      <div className="hero-copy">
        <div className="eyebrow hero-reveal hero-reveal-1"><span className="status-dot"/>{t("home.eyebrow")}</div>
        <h1 className="hero-reveal hero-reveal-2">{t("home.title")}<span className="hero-period">.</span></h1>
        <p className="hero-description hero-reveal hero-reveal-3">{t("home.description")}</p>
        <div className="hero-actions hero-reveal hero-reveal-4"><Link to="/services" className="button-primary">{t("home.primaryCta")}<ArrowUpRight size={17}/></Link><Link to="/contacts" className="button-secondary">{t("home.secondaryCta")}</Link></div>
        <div className="hero-note"><ArrowDown size={15}/><span>{t("home.visual.processLabel")}</span></div>
      </div>
      <div className="hero-visual hero-visual-reveal">
        <div className="visual-glow"/>
        <div className="warehouse-card">
          <div className="warehouse-top"><div className="warehouse-label"><Warehouse size={17}/><span>MJL / LOGISTICS NETWORK</span></div><span className="live-indicator"><i/> {t("home.visual.statusLabel")}</span></div>
          <div className="warehouse-art" role="img" aria-label={t("home.visual.artAlt")}><div className="warehouse-grid"/><div className="warehouse-building"><div className="roof"/><div className="warehouse-door"/><div className="warehouse-windows"><i/><i/><i/><i/></div><div className="warehouse-sign">MJL <span>FULFILLMENT</span></div></div><div className="parcel parcel-one"/><div className="parcel parcel-two"/><div className="route-line"/></div>
          <div className="warehouse-bottom"><div><strong>WB <span>/</span> OZON</strong><small>{t("home.visual.marketplaceReady")}</small></div><div className="warehouse-stat"><b>06</b><small>{t("home.visual.operationStages")}</small></div></div>
        </div>
        <div className="floating-chip chip-top"><PackageCheck size={16}/><span>{t("home.visual.qualityControl")}</span><Check size={14}/></div>
        <div className="floating-chip chip-bottom"><Truck size={16}/><span>{t("home.visual.dispatchWorkflow")}</span></div>
      </div>
      <div className="hero-index">01 <span>—</span> 04</div>
    </section>

    <section className="metrics-strip" aria-label={t("home.proof.ariaLabel")}><div className="section-wrap metrics-grid">
      <div><strong>{t("home.proof.operationsValue")}</strong><small>{t("home.proof.operationsLabel")}</small></div>
      <div><strong>{t("home.proof.modelsValue")}</strong><small>{t("home.proof.modelsLabel")}</small></div>
      <div><strong>{t("home.proof.channelsValue")}</strong><small>{t("home.proof.channelsLabel")}</small></div>
      <div><strong>{t("home.proof.languagesValue")}</strong><small>{t("home.proof.languagesLabel")}</small></div>
    </div></section>

    <section className="services-preview section-wrap">
      <div className="section-heading"><div><span className="section-kicker">WHAT WE DO / 01</span><h2>{t("services.title")}</h2></div><Link to="/services" className="text-link">{t("common.learnMore")}<ArrowUpRight size={16}/></Link></div>
      <div className="service-grid">{services.map(({icon:Icon,title,detail},index)=><article className="service-tile service-tile-reveal" key={detail} style={{ animationDelay: `${index * 70}ms` }}><div className="tile-top"><Icon size={21}/><span>{detail}</span></div><h3>{title}</h3><span className="tile-arrow"><ArrowUpRight size={17}/></span></article>)}</div>
    </section>

    <section className="home-process-section">
      <div className="section-wrap">
        <div className="section-heading home-process-heading">
          <div><span className="section-kicker">{t("home.process.eyebrow")}</span><h2>{t("home.process.title")}</h2><p>{t("home.process.description")}</p></div>
          <Link to="/contacts" className="text-link">{t("home.process.cta")}<ArrowUpRight size={16}/></Link>
        </div>
        <div className="home-process-grid">
          {process.map(({icon:Icon,number,key})=><article className="home-process-card" key={key}>
            <div className="home-process-card-top"><span>{number} / 04</span><Icon size={22} aria-hidden="true"/></div>
            <h3>{t(`home.process.steps.${key}.title`)}</h3>
            <p>{t(`home.process.steps.${key}.description`)}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="china-banner"><div className="section-wrap china-banner-inner"><div><span className="section-kicker">CROSS-BORDER / 02</span><h2>{t("china.title")}</h2><p>{t("china.description")}</p></div><Link to="/china" className="button-light">{t("china.cta")}<ArrowUpRight size={17}/></Link></div></section>
    <section className="closing-cta section-wrap"><div><span className="section-kicker">LET’S MOVE FORWARD / 03</span><h2>{t("contacts.title")}</h2><p>{t("contacts.description")}</p></div><Link to="/contacts" className="button-primary">{t("common.contact")}<ArrowUpRight size={17}/></Link></section>
  </main>;
}
