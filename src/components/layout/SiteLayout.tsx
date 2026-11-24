import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight, Instagram, Menu, Moon, Send, Sun, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MjlLogo } from "../brand/MjlLogo";
import { SEOHead } from "../seo/SEOHead";

const links = [
  { to: "/", key: "navigation.home", end: true },
  { to: "/services", key: "navigation.services" },
  { to: "/china", key: "navigation.china" },
  { to: "/about", key: "navigation.about" },
  { to: "/contacts", key: "navigation.contacts" }
];

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  // A stable server/client default keeps the initial render hydration-safe.
  return "dark";
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const current = (i18n.resolvedLanguage || "ru").split("-")[0];
  return <div className="language-switcher" aria-label="Select language">
    {(["ru", "en", "zh"] as const).map((language) => {
      const prefix = language === "ru" ? "" : `/${language}`;
      const href = `${prefix}${pathname === "/" ? "/" : pathname}${hash}`;
      return <a key={language} href={href} aria-current={current === language ? "page" : undefined} className={current === language ? "language-active" : undefined}>{language}</a>;
    })}
  </div>;
}

function ThemeSwitcher({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const { i18n } = useTranslation();
  const label = i18n.resolvedLanguage === "zh" ? "切换主题" : i18n.resolvedLanguage === "en" ? "Switch color theme" : "Переключить тему";
  return <button className="theme-switcher" type="button" onClick={onToggle} aria-label={label} title={label}>
    {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
  </button>;
}

function SocialLinks() {
  const { i18n } = useTranslation();
  const telegramUrl = import.meta.env.VITE_TELEGRAM_URL as string | undefined;
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL as string | undefined;
  const soon = i18n.resolvedLanguage === "zh" ? "即将推出" : i18n.resolvedLanguage === "en" ? "Link coming soon" : "Ссылка появится позже";
  return <div className="social-links" aria-label="Social media">
    {telegramUrl ? <a href={telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="Telegram"><Send size={17}/></a> : <span className="social-placeholder" title={soon} aria-label={`Telegram: ${soon}`}><Send size={17}/></span>}
    {instagramUrl ? <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={17}/></a> : <span className="social-placeholder" title={soon} aria-label={`Instagram: ${soon}`}><Instagram size={17}/></span>}
  </div>;
}

export function SiteLayout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    let nextTheme: Theme = "dark";
    try {
      const saved = window.localStorage.getItem("mjl-theme");
      if (saved === "dark" || saved === "light") nextTheme = saved;
      else if (window.matchMedia("(prefers-color-scheme: light)").matches) nextTheme = "light";
    } catch {
      // Storage can be disabled; keep the accessible dark default.
    }
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#f4f7fb" : "#0b1220");
    try {
      window.localStorage.setItem("mjl-theme", theme);
    } catch {
      // Theme still works for the current page when storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");

  return <div className="site-shell">
    <SEOHead />
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" aria-label="mjlFulfillment — home" onClick={() => setMenuOpen(false)} className="brand-link"><MjlLogo /></Link>
        <nav className="desktop-nav" aria-label="Main navigation">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>{t(link.key)}</NavLink>)}</nav>
        <div className="header-actions"><LanguageSwitcher /><ThemeSwitcher theme={theme} onToggle={toggleTheme}/><Link to="/contacts" className="header-cta">{t("common.contact")}<ArrowUpRight size={15}/></Link></div>
        <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X/> : <Menu/>}</button>
      </div>
      {menuOpen && <nav className="mobile-nav mobile-nav-enter" aria-label="Mobile navigation">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"}>{t(link.key)}</NavLink>)}<div className="mobile-nav-bottom"><LanguageSwitcher/><ThemeSwitcher theme={theme} onToggle={toggleTheme}/><Link to="/contacts" className="header-cta" onClick={() => setMenuOpen(false)}>{t("common.contact")}<ArrowUpRight size={15}/></Link></div></nav>}
    </header>
    <div className="page-content"><Outlet /></div>
    <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><Link to="/" aria-label="mjlFulfillment — home"><MjlLogo/></Link><p>{t("footer.tagline")}</p><SocialLinks/></div><div className="footer-links">{links.slice(1).map((link) => <Link key={link.to} to={link.to}>{t(link.key)}</Link>)}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} mjlFulfillment. {t("footer.rights")}</span><span>Wildberries · Ozon · Cross-border logistics</span></div></div></footer>
  </div>;
}
