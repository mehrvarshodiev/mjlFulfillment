import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Instagram, Menu, Moon, Send, Sun, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MjlLogo } from "../brand/MjlLogo";
import { SEOHead } from "../seo/SEOHead";
import { ScrollExperience } from "./ScrollExperience";

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
  const { pathname, hash } = useLocation();
  const current = (i18n.resolvedLanguage || "ru").split("-")[0];

  return (
    <div className="language-switcher" aria-label="Select language">
      {(["ru", "en", "zh", "ky", "kk", "uz", "tg"] as const).map((language) => {
        const prefix = language === "ru" ? "" : `/${language}`;
        const href = `${prefix}${pathname === "/" ? "/" : pathname}${hash}`;

        return (
          <a
            key={language}
            href={href}
            aria-current={current === language ? "page" : undefined}
            className={current === language ? "language-active" : undefined}
          >
            {language}
          </a>
        );
      })}
    </div>
  );
}

function ThemeSwitcher({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const { i18n } = useTranslation();
  const label =
    i18n.resolvedLanguage === "zh"
      ? "切换主题"
      : i18n.resolvedLanguage === "en"
        ? "Switch color theme"
        : i18n.resolvedLanguage === "uz"
          ? "Rang mavzusini almashtirish"
          : i18n.resolvedLanguage === "kk"
            ? "Түс тақырыбын ауыстыру"
            : i18n.resolvedLanguage === "ky"
              ? "Түс темасын өзгөртүү"
              : i18n.resolvedLanguage === "tg"
                ? "Тағйири намуди ранг"
                : "Переключить тему";

  return (
    <button
      className="theme-switcher"
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}

function SocialLinks() {
  const { i18n } = useTranslation();
  const telegramUrl = import.meta.env.VITE_TELEGRAM_URL as string | undefined;
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL as string | undefined;
  const soon =
    i18n.resolvedLanguage === "zh"
      ? "即将推出"
      : i18n.resolvedLanguage === "en"
        ? "Link coming soon"
        : i18n.resolvedLanguage === "uz"
          ? "Havola tez orada qoʻshiladi"
          : i18n.resolvedLanguage === "kk"
            ? "Сілтеме жақында қосылады"
            : i18n.resolvedLanguage === "ky"
              ? "Шилтеме жакында кошулат"
              : i18n.resolvedLanguage === "tg"
                ? "Пайванд ба зудӣ илова мешавад"
                : "Ссылка появится позже";

  return (
    <div className="social-links" aria-label="Social media">
      {telegramUrl ? (
        <a href={telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <Send size={17} />
        </a>
      ) : (
        <span className="social-placeholder" title={soon} aria-label={`Telegram: ${soon}`}>
          <Send size={17} />
        </span>
      )}
      {instagramUrl ? (
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <Instagram size={17} />
        </a>
      ) : (
        <span className="social-placeholder" title={soon} aria-label={`Instagram: ${soon}`}>
          <Instagram size={17} />
        </span>
      )}
    </div>
  );
}

export function SiteLayout() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [headerVisible, setHeaderVisible] = useState(true);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const closeMenuRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);

  const language = (i18n.resolvedLanguage || "ru").split("-")[0] || "ru";
  const menuCopy: Record<string, { open: string; close: string; eyebrow: string; footnote: string }> = {
    ru: { open: "Открыть меню навигации", close: "Закрыть меню навигации", eyebrow: "НАВИГАЦИЯ ПО САЙТУ", footnote: "Логистика и складской фулфилмент" },
    en: { open: "Open navigation menu", close: "Close navigation menu", eyebrow: "EXPLORE MJL", footnote: "Marketplace logistics & fulfillment" },
    zh: { open: "打开导航菜单", close: "关闭导航菜单", eyebrow: "快速导航", footnote: "物流与仓储履约服务" },
    ky: { open: "Багыттоо менюсун ачуу", close: "Багыттоо менюсун жабуу", eyebrow: "MJL МЕНЕН ТААНЫШУУ", footnote: "Маркетплейстер үчүн логистика жана фулфилмент" },
    kk: { open: "Навигация мәзірін ашу", close: "Навигация мәзірін жабу", eyebrow: "MJL САЙТЫМЕН ТАНЫСУ", footnote: "Маркетплейстерге арналған логистика және фулфилмент" },
    uz: { open: "Navigatsiya menyusini ochish", close: "Navigatsiya menyusini yopish", eyebrow: "MJL BILAN TANISHING", footnote: "Marketpleyslar uchun logistika va fulfilment" },
    tg: { open: "Кушодани менюи навигатсия", close: "Бастани менюи навигатсия", eyebrow: "ШИНОСОӢ БО MJL", footnote: "Логистика ва фулфилмент барои маркетплейсҳо" }
  };
  const copy = menuCopy[language] ?? menuCopy.ru;
  const openMenuLabel = copy.open;
  const closeMenuLabel = copy.close;
  const menuEyebrow = copy.eyebrow;
  const menuFootnote = copy.footnote;

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

  useEffect(() => {
    let previousScrollY = window.scrollY;
    let animationFrame = 0;

    const handleScroll = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - previousScrollY;

        if (menuOpen) {
          setHeaderVisible(true);
        } else if (currentScrollY <= 72) {
          setHeaderVisible(true);
        } else if (Math.abs(scrollDelta) > 6) {
          setHeaderVisible(scrollDelta < 0);
        }

        previousScrollY = currentScrollY;
        animationFrame = 0;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      if (wasMenuOpenRef.current) {
        menuToggleRef.current?.focus({ preventScroll: true });
        wasMenuOpenRef.current = false;
      }
      return;
    }

    wasMenuOpenRef.current = true;
    setHeaderVisible(true);
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => closeMenuRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [menuOpen]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <SEOHead />
      <ScrollExperience />
      <header
        className={[
          "site-header",
          headerVisible ? "site-header--visible" : "site-header--hidden",
          menuOpen ? "site-header--menu-open" : ""
        ].filter(Boolean).join(" ")}
      >
        <div className="header-inner">
          <Link
            to="/"
            aria-label="mjlFulfillment — home"
            onClick={closeMenu}
            className="brand-link"
          >
            <MjlLogo />
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {t(link.key)}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <LanguageSwitcher />
            <ThemeSwitcher theme={theme} onToggle={toggleTheme} />
            <Link to="/contacts" className="header-cta">
              {t("common.contact")}
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <button
            ref={menuToggleRef}
            className="mobile-menu-toggle"
            type="button"
            aria-label={menuOpen ? closeMenuLabel : openMenuLabel}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu-layer">
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label={closeMenuLabel}
            onClick={closeMenu}
          />
          <aside
            id="mobile-navigation"
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label={closeMenuLabel}
          >
            <div className="mobile-menu-top">
              <Link to="/" className="mobile-menu-brand" aria-label="mjlFulfillment — home" onClick={closeMenu}>
                <MjlLogo />
              </Link>
              <button
                ref={closeMenuRef}
                className="mobile-menu-close"
                type="button"
                aria-label={closeMenuLabel}
                onClick={closeMenu}
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            <div className="mobile-menu-caption">
              <span>{menuEyebrow}</span>
              <span className="mobile-menu-caption-line" />
              <span className="mobile-menu-caption-dot" aria-hidden="true" />
            </div>

            <nav className="mobile-menu-links" aria-label="Mobile navigation">
              {links.map((link, index) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    isActive ? "mobile-menu-link mobile-menu-link--active" : "mobile-menu-link"
                  }
                >
                  <span className="mobile-menu-link-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mobile-menu-link-title">{t(link.key)}</span>
                  <ArrowRight className="mobile-menu-link-arrow" size={18} aria-hidden="true" />
                </NavLink>
              ))}
            </nav>

            <div className="mobile-menu-footer">
              <div className="mobile-menu-controls">
                <LanguageSwitcher />
                <ThemeSwitcher theme={theme} onToggle={toggleTheme} />
              </div>
              <Link to="/contacts" className="mobile-menu-cta" onClick={closeMenu}>
                <span>{t("common.contact")}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <span className="mobile-menu-footnote">{menuFootnote}</span>
            </div>
          </aside>
        </div>
      )}

      <div className="page-content page-content--enter" key={pathname}><Outlet /></div>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" aria-label="mjlFulfillment — home"><MjlLogo /></Link>
            <p>{t("footer.tagline")}</p>
            <SocialLinks />
          </div>
          <div className="footer-links">
            {links.slice(1).map((link) => (
              <Link key={link.to} to={link.to}>{t(link.key)}</Link>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} mjlFulfillment. {t("footer.rights")}</span>
            <span>Wildberries · Ozon · Cross-border logistics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
