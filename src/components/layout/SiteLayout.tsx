import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MjlLogo } from "../brand/MjlLogo";

const links = [
  { to: "/", key: "navigation.home", end: true },
  { to: "/services", key: "navigation.services" },
  { to: "/china", key: "navigation.china" },
  { to: "/about", key: "navigation.about" },
  { to: "/contacts", key: "navigation.contacts" }
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return <div className="language-switcher" aria-label="Select language">
    {(["ru", "en", "zh"] as const).map((language) => <button key={language} type="button" onClick={() => void i18n.changeLanguage(language)} aria-pressed={i18n.resolvedLanguage === language}>{language}</button>)}
  </div>;
}

export function SiteLayout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const telegramUrl = import.meta.env.VITE_TELEGRAM_URL as string | undefined;
  return <div className="site-shell">
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" aria-label="mjlFulfillment — home" onClick={() => setMenuOpen(false)} className="brand-link"><MjlLogo /></Link>
        <nav className="desktop-nav" aria-label="Main navigation">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>{t(link.key)}</NavLink>)}</nav>
        <div className="header-actions"><LanguageSwitcher /><Link to="/contacts" className="header-cta">{t("common.contact")}<ArrowUpRight size={15}/></Link></div>
        <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X/> : <Menu/>}</button>
      </div>
      <AnimatePresence>{menuOpen && <motion.nav className="mobile-nav" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: .2 }} aria-label="Mobile navigation">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"}>{t(link.key)}</NavLink>)}<div className="mobile-nav-bottom"><LanguageSwitcher/><Link to="/contacts" className="header-cta" onClick={() => setMenuOpen(false)}>{t("common.contact")}<ArrowUpRight size={15}/></Link></div></motion.nav>}</AnimatePresence>
    </header>
    <div className="page-content"><Outlet /></div>
    <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><Link to="/" aria-label="mjlFulfillment — home"><MjlLogo/></Link><p>{t("footer.tagline")}</p></div><div className="footer-links">{links.slice(1).map((link) => <Link key={link.to} to={link.to}>{t(link.key)}</Link>)}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} mjlFulfillment. {t("footer.rights")}</span><span>Wildberries · Ozon · Cross-border logistics</span></div></div></footer>
    {telegramUrl && <a className="telegram-float" href={telegramUrl} target="_blank" rel="noreferrer" aria-label={t("common.telegram")}>↗</a>}
  </div>;
}
