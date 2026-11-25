import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const REVEAL_SELECTOR = [
  "main > section:not(.hero-section)",
  "main .service-tile",
  "main .china-benefit-card",
  "main .china-process-card",
  "main .about-capability-card",
  "main .about-flow-step",
  "main .contacts-form-card",
  "main .contacts-bottom > article",
  "main .marketplace-panels > article",
].join(", ");

export function ScrollExperience() {
  const { pathname, hash } = useLocation();
  const { t, i18n } = useTranslation();
  const [showFloatingActions, setShowFloatingActions] = useState(false);

  useEffect(() => {
    let frame = 0;
    let floatingActionsVisible = false;

    const updateScrollProgress = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        const documentElement = document.documentElement;
        const maxScroll = documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

        documentElement.style.setProperty(
          "--scroll-progress",
          String(Math.min(1, Math.max(0, progress))),
        );

        const shouldShowActions = window.scrollY > 420;
        if (shouldShowActions !== floatingActionsVisible) {
          floatingActionsVisible = shouldShowActions;
          setShowFloatingActions(shouldShowActions);
        }

        frame = 0;
      });
    };

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--scroll-progress");
    };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const root = document.querySelector<HTMLElement>(".page-content");
    if (!root) return;

    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    const registerRevealTargets = () => {
      root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.setAttribute("data-scroll-reveal", "");
        element.style.setProperty("--reveal-delay", `${(index % 4) * 65}ms`);
        observer.observe(element);
      });
    };

    registerRevealTargets();

    const mutations = new MutationObserver(registerRevealTargets);
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  const language = (i18n.resolvedLanguage || "ru").split("-")[0];
  const backToTopLabel =
    language === "zh" ? "返回顶部" : language === "en" ? "Back to top" : "Наверх";

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <span />
      </div>

      {showFloatingActions && (
        <div className="scroll-floating-actions">
          <Link className="scroll-contact-link" to="/contacts">
            {t("common.contact")}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            className="scroll-top-button"
            type="button"
            onClick={scrollToTop}
            aria-label={backToTopLabel}
            title={backToTopLabel}
          >
            <ArrowUp size={19} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
