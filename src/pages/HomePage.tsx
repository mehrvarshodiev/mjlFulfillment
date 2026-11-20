import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Boxes, Check, PackageCheck, ScanLine, Truck, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const reveal = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } };
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
        <motion.div className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><span className="status-dot"/>{t("home.eyebrow")}</motion.div>
        <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>{t("home.title")}<span className="hero-period">.</span></motion.h1>
        <motion.p className="hero-description" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }}>{t("home.description")}</motion.p>
        <motion.div className="hero-actions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}><Link to="/services" className="button-primary">{t("home.primaryCta")}<ArrowUpRight size={17}/></Link><Link to="/contacts" className="button-secondary">{t("home.secondaryCta")}</Link></motion.div>
        <div className="hero-note"><ArrowDown size={15}/><span>END-TO-END MARKETPLACE OPERATIONS</span></div>
      </div>
      <motion.div className="hero-visual" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .15 }}>
        <div className="visual-glow"/>
        <div className="warehouse-card">
          <div className="warehouse-top"><div className="warehouse-label"><Warehouse size={17}/><span>MJ / LOGISTICS NETWORK</span></div><span className="live-indicator"><i/> LIVE OPERATIONS</span></div>
          <div className="warehouse-art" aria-hidden="true"><div className="warehouse-grid"/><div className="warehouse-building"><div className="roof"/><div className="warehouse-door"/><div className="warehouse-windows"><i/><i/><i/><i/></div><div className="warehouse-sign">MJL <span>FULFILLMENT</span></div></div><div className="parcel parcel-one"/><div className="parcel parcel-two"/><div className="route-line"/></div>
          <div className="warehouse-bottom"><div><strong>WB <span>/</span> OZON</strong><small>MARKETPLACE READY</small></div><div className="warehouse-stat"><b>01</b><small>LOGISTICS PARTNER</small></div></div>
        </div>
        <div className="floating-chip chip-top"><PackageCheck size={16}/><span>Quality control</span><Check size={14}/></div>
        <div className="floating-chip chip-bottom"><Truck size={16}/><span>Dispatch workflow</span></div>
      </motion.div>
      <div className="hero-index">01 <span>—</span> 04</div>
    </section>
    <section className="metrics-strip"><div className="section-wrap metrics-grid"><div><strong>FBO <span>/</span> FBS</strong><small>FULFILLMENT MODELS</small></div><div><strong>RU <span>·</span> CIS <span>·</span> CN</strong><small>SELLER GEOGRAPHY</small></div><div><strong>WB <span>+</span> OZON</strong><small>MARKETPLACE ECOSYSTEM</small></div><div><strong>360°</strong><small>SUPPLY CHAIN SUPPORT</small></div></div></section>
    <section className="services-preview section-wrap">
      <div className="section-heading"><div><span className="section-kicker">WHAT WE DO / 01</span><h2>{t("services.title")}</h2></div><Link to="/services" className="text-link">{t("common.learnMore")}<ArrowUpRight size={16}/></Link></div>
      <div className="service-grid">{services.map(({icon:Icon,title,detail},index)=><motion.article className="service-tile" key={detail} variants={reveal} initial="hidden" whileInView="visible" viewport={{once:true,amount:.2}} transition={{delay:index*.07}}><div className="tile-top"><Icon size={21}/><span>{detail}</span></div><h3>{title}</h3><span className="tile-arrow"><ArrowUpRight size={17}/></span></motion.article>)}</div>
    </section>
    <section className="china-banner"><div className="section-wrap china-banner-inner"><div><span className="section-kicker">CROSS-BORDER / 02</span><h2>{t("china.title")}</h2><p>{t("china.description")}</p></div><Link to="/china" className="button-light">{t("china.cta")}<ArrowUpRight size={17}/></Link></div></section>
    <section className="closing-cta section-wrap"><div><span className="section-kicker">LET’S MOVE FORWARD / 03</span><h2>{t("contacts.title")}</h2><p>{t("contacts.description")}</p></div><Link to="/contacts" className="button-primary">{t("common.contact")}<ArrowUpRight size={17}/></Link></section>
  </main>;
}
