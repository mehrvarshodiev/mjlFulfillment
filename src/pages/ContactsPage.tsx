import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { calculateEstimate } from "../features/calculator/calculateEstimate";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Globe2,
  LoaderCircle,
  MessageCircle,
  PackageCheck,
  Send,
  ShieldCheck,
  Truck,
  X
} from "lucide-react";

type LeadApiResult = {
  ok?: boolean;
  code?: string;
  leadId?: string;
  notification?: string;
};

type FormState = {
  name: string;
  phone: string;
  company: string;
  country: string;
  productType: string;
  volume: string;
  marketplace: string;
  telegram: string;
  website: string;
};

type QuoteSummary = {
  model: "FBO" | "FBS";
  marketplace: "both" | "wildberries" | "ozon";
  units: number;
  packaging: "standard" | "protective" | "custom";
  marking: boolean;
  storageDays: number;
  estimate: number;
};

type SavedForm = {
  form: FormState;
  consent: boolean;
  requestContext?: string;
  quoteSummary?: QuoteSummary | null;
  sourceContext?: "china" | null;
};

type TelegramVerification = "idle" | "loading" | "verified" | "invalid" | "error" | "cancelled" | "mismatch";

const FORM_STORAGE_KEY = "mjl-contact-form-v1";
const TELEGRAM_USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

function normalizeTelegramUsername(value: string): string | null {
  const username = value.trim().replace(/^@/, "");
  return TELEGRAM_USERNAME_PATTERN.test(username) ? username.toLowerCase() : null;
}

function getLeadErrorKey(code: string | null): string {
  switch (code) {
    case "telegram_not_configured": return "contacts.errorNotConfigured";
    case "database_unavailable": return "contacts.errorDatabase";
    case "rate_limited": return "contacts.errorRateLimited";
    case "invalid_fields": return "contacts.errorInvalid";
    case "invalid_telegram_username": return "contacts.telegramInvalid";
    case "telegram_not_verified": return "contacts.telegramNotVerified";
    case "timeout":
    case "network":
    case "request_failed": return "contacts.errorTemporary";
    default: return "contacts.error";
  }
}

const initialForm: FormState = {
  name: "",
  phone: "",
  company: "",
  country: "",
  productType: "",
  volume: "",
  marketplace: "both",
  telegram: "",
  website: ""
};

export function ContactsPage() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<FormState>(initialForm);
  const [consent, setConsent] = useState(false);
  const [requestContext, setRequestContext] = useState("");
  const [quoteSummary, setQuoteSummary] = useState<QuoteSummary | null>(null);
  const [sourceContext, setSourceContext] = useState<"china" | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [telegramAvailable, setTelegramAvailable] = useState<boolean | null>(null);
  const [telegramVerification, setTelegramVerification] = useState<TelegramVerification>("idle");
  const [verifiedUsername, setVerifiedUsername] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [leadId, setLeadId] = useState("");
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const successModalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/telegram-auth?action=config", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as { available?: boolean };
        if (active) setTelegramAvailable(response.ok && result.available === true);
      })
      .catch(() => {
        if (active) setTelegramAvailable(false);
      });

    const params = new URLSearchParams(window.location.search);
    const verificationResult = params.get("telegramVerification");
    if (verificationResult) {
      try {
        const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as SavedForm;
          if (parsed.form && typeof parsed.form === "object") setForm({ ...initialForm, ...parsed.form });
          if (typeof parsed.consent === "boolean") setConsent(parsed.consent);
          if (typeof parsed.requestContext === "string") setRequestContext(parsed.requestContext);
          if (parsed.quoteSummary) setQuoteSummary(parsed.quoteSummary);
          if (parsed.sourceContext === "china") setSourceContext("china");
        }
      } catch {
        // Keep the form usable even when session storage is unavailable or malformed.
      }

      if (verificationResult === "success") {
        const username = normalizeTelegramUsername(params.get("telegramUsername") ?? "");
        setVerifiedUsername(username ?? "");
        setTelegramVerification(username ? "verified" : "error");
      } else if (verificationResult === "mismatch") {
        setTelegramVerification("mismatch");
      } else if (verificationResult === "cancelled") {
        setTelegramVerification("cancelled");
      } else {
        setTelegramVerification("error");
      }

      try {
        sessionStorage.removeItem(FORM_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup errors.
      }

      params.delete("telegramVerification");
      params.delete("telegramUsername");
      const query = params.toString();
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + (query ? "?" + query : "") + window.location.hash
      );
    } else {
      const source = params.get("source");
      if (source === "calculator") {
        const units = Number(params.get("units"));
        const storageDays = Number(params.get("storageDays"));
        const model = params.get("model");
        const marketplace = params.get("marketplace");
        const packaging = params.get("packaging");
        const markingValue = params.get("marking");
        const marking = markingValue === "1";
        const valid = Number.isInteger(units) && units >= 10 && units <= 5000
          && Number.isInteger(storageDays) && storageDays >= 0 && storageDays <= 60
          && (model === "FBO" || model === "FBS")
          && (marketplace === "both" || marketplace === "wildberries" || marketplace === "ozon")
          && (packaging === "standard" || packaging === "protective" || packaging === "custom")
          && (markingValue === "0" || markingValue === "1");

        if (valid) {
          const quote: QuoteSummary = {
            model,
            marketplace,
            units,
            packaging,
            marking,
            storageDays,
            estimate: calculateEstimate({ units, model, packaging, marking, storageDays }).total
          };
          const locale = i18n.resolvedLanguage === "zh" ? "zh-CN"
            : i18n.resolvedLanguage === "en" ? "en-US" : "ru-RU";
          const formattedUnits = new Intl.NumberFormat(locale).format(units);
          setForm((current) => ({
            ...current,
            volume: formattedUnits + " " + t("contacts.unitsPerMonth"),
            marketplace
          }));
          setQuoteSummary(quote);
          setRequestContext([
            "source=calculator",
            "model=" + model,
            "marketplace=" + marketplace,
            "units_per_month=" + units,
            "packaging=" + packaging,
            "marking=" + marking,
            "storage_days=" + storageDays,
            "indicative_demo_estimate_rub=" + quote.estimate,
            "pricing_status=demonstration_rates_not_public_offer"
          ].join("; "));
        }
      } else if (source === "china") {
        setSourceContext("china");
        setRequestContext("source=china; inquiry=China-to-Russia marketplace shipment");
      } else if (source === "about" || source === "home") {
        setRequestContext("source=" + source + "; inquiry=general fulfillment request");
      }

      ["source", "marketplace", "units", "model", "packaging", "marking", "storageDays"].forEach((key) => params.delete(key));
      const query = params.toString();
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + (query ? "?" + query : "") + window.location.hash
      );
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!showSuccessModal) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => modalCloseRef.current?.focus());
    const handleModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSuccessModal(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = successModalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener("keydown", handleModalKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleModalKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [showSuccessModal]);

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status === "error" || status === "success") setStatus("idle");
    setErrorCode(null);

    if (field === "telegram") {
      setVerifiedUsername("");
      setTelegramVerification("idle");
    }
  };

  function beginTelegramVerification() {
    const username = normalizeTelegramUsername(form.telegram);
    if (!form.telegram.trim()) {
      setTelegramVerification("invalid");
      return;
    }
    if (!username) {
      setTelegramVerification("invalid");
      return;
    }
    if (telegramAvailable !== true) {
      setTelegramVerification("error");
      return;
    }

    try {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({ form, consent } satisfies SavedForm));
    } catch {
      setTelegramVerification("error");
      return;
    }

    setTelegramVerification("loading");
    const params = new URLSearchParams({
      username,
      returnTo: window.location.pathname
    });
    window.location.assign(`/api/telegram-auth?${params.toString()}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setErrorCode(null);

    const telegramUsername = normalizeTelegramUsername(form.telegram);
    if (form.telegram.trim() && !telegramUsername) {
      setTelegramVerification("invalid");
      return;
    }
    if (telegramUsername && verifiedUsername !== telegramUsername) {
      setErrorCode("telegram_not_verified");
      setStatus("error");
      setTelegramVerification("idle");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: AbortSignal.timeout(12_000)
      });
      const result = await response.json().catch(() => ({})) as LeadApiResult;

      if (!response.ok || !result.ok) {
        setErrorCode(result.code || "request_failed");
        if (result.code === "telegram_not_verified") {
          setVerifiedUsername("");
          setTelegramVerification("idle");
        }
        setStatus("error");
        return;
      }

      setLeadId(result.leadId ?? "");
      setStatus("success");
      setShowSuccessModal(true);
      setForm(initialForm);
      setConsent(false);
      setVerifiedUsername("");
      setTelegramVerification("idle");
      try {
        sessionStorage.removeItem(FORM_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup errors.
      }
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
      setErrorCode(isTimeout ? "timeout" : "network");
      setStatus("error");
    }
  }

  return <main className="contacts-page">
    <section className="contacts-hero section-wrap">
      <div className="contacts-copy">
        <span className="section-kicker">{t("contacts.eyebrow")}</span>
        <h1>{t("contacts.title")}</h1>
        <p>{t("contacts.description")}</p>
        <div className="contacts-assurances">
          <span><Clock3 size={16}/>{t("contacts.reply")}</span>
          <span><ShieldCheck size={16}/>{t("contacts.confidential")}</span>
        </div>
        <div className="contacts-direct">
          <div className="contacts-direct-icon"><MessageCircle size={20}/></div>
          <div><small>{t("contacts.directLabel")}</small><strong>{t("contacts.directTitle")}</strong><p>{t("contacts.directDescription")}</p></div>
        </div>
      </div>

      <div className="contacts-form-card">
        <div className="contacts-form-heading">
          <span>{t("contacts.formEyebrow")}</span>
          <h2>{t("contacts.formTitle")}</h2>
          <p>{t("contacts.formDescription")}</p>
        </div>

        <form onSubmit={handleSubmit} aria-busy={status === "sending"}>
          <div className="contacts-field-grid">
            <label>
              <span>{t("contacts.name")}<span className="contacts-required-mark" aria-hidden="true"> *</span></span>
              <input required autoComplete="name" maxLength={100} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder={t("contacts.namePlaceholder")}/>
            </label>
            <label>
              <span>{t("contacts.phone")}<span className="contacts-required-mark" aria-hidden="true"> *</span></span>
              <input required type="tel" autoComplete="tel" minLength={7} maxLength={40} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder={t("contacts.phonePlaceholder")}/>
            </label>
            <label>
              <span>{t("contacts.company")}<span className="contacts-required-mark" aria-hidden="true"> *</span></span>
              <input required autoComplete="organization" maxLength={120} value={form.company} onChange={(e) => update("company", e.target.value)} placeholder={t("contacts.companyPlaceholder")}/>
            </label>
            <label>
              <span>{t("contacts.country")}<span className="contacts-required-mark" aria-hidden="true"> *</span></span>
              <input required autoComplete="country-name" maxLength={80} value={form.country} onChange={(e) => update("country", e.target.value)} placeholder={t("contacts.countryPlaceholder")}/>
            </label>
            <label>
              <span>{t("contacts.productType")}<span className="contacts-required-mark" aria-hidden="true"> *</span></span>
              <input required maxLength={120} value={form.productType} onChange={(e) => update("productType", e.target.value)} placeholder={t("contacts.productPlaceholder")}/>
            </label>
            <label>
              <span>{t("contacts.volume")}<span className="contacts-required-mark" aria-hidden="true"> *</span></span>
              <input required maxLength={80} value={form.volume} onChange={(e) => update("volume", e.target.value)} placeholder={t("contacts.volumePlaceholder")}/>
            </label>
            <label>
              <span>{t("contacts.marketplace")}<span className="contacts-required-mark" aria-hidden="true"> *</span></span>
              <select required value={form.marketplace} onChange={(e) => update("marketplace", e.target.value)}>
                <option value="both">{t("contacts.marketplaceBoth")}</option>
                <option value="wildberries">Wildberries</option>
                <option value="ozon">Ozon</option>
                <option value="other">{t("contacts.marketplaceOther")}</option>
              </select>
            </label>
            <div className="contacts-telegram-field">
              <label htmlFor="contacts-telegram-input">
                <span className="contacts-telegram-label">
                  {t("contacts.telegram")}
                  <small>{t("contacts.optional")}</small>
                </span>
                <input
                  id="contacts-telegram-input"
                  autoComplete="off"
                  maxLength={80}
                  value={form.telegram}
                  onChange={(e) => update("telegram", e.target.value)}
                  placeholder="@username"
                  aria-describedby="contacts-telegram-help"
                  aria-invalid={telegramVerification === "invalid" || telegramVerification === "mismatch" || telegramVerification === "error"}
                />
              </label>
              <p className="contacts-telegram-help" id="contacts-telegram-help">{t("contacts.telegramHint")}</p>
              {telegramVerification === "verified" ? (
                <p className="contacts-telegram-status is-verified" id="contacts-telegram-status" role="status">
                  <BadgeCheck size={15}/>{t("contacts.telegramVerified")}
                </p>
              ) : telegramVerification !== "idle" ? (
                <p className={`contacts-telegram-status ${telegramVerification === "invalid" || telegramVerification === "error" || telegramVerification === "mismatch" ? "is-error" : ""}`} id="contacts-telegram-status" role="status">
                  {telegramVerification === "invalid" ? t("contacts.telegramInvalid")
                    : telegramVerification === "mismatch" ? t("contacts.telegramMismatch")
                    : telegramVerification === "cancelled" ? t("contacts.telegramCancelled")
                    : telegramVerification === "error" ? t("contacts.telegramFailed")
                    : t("contacts.telegramChecking")}
                </p>
              ) : telegramAvailable === false ? (
                <p className="contacts-telegram-status" id="contacts-telegram-status">{t("contacts.telegramUnavailable")}</p>
              ) : null}
              {telegramAvailable === true && telegramVerification !== "verified" && (
                <button
                  className="contacts-telegram-verify"
                  type="button"
                  onClick={beginTelegramVerification}
                  disabled={telegramVerification === "loading" || status === "sending"}
                >
                  {telegramVerification === "loading" ? <LoaderCircle className="contacts-submit-spinner" size={15}/> : <ShieldCheck size={15}/>}
                  {t("contacts.telegramVerify")}
                </button>
              )}
            </div>
          </div>

          <label className="contacts-honeypot" aria-hidden="true">
            Website
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)}/>
          </label>

          <label className="contacts-consent">
            <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)}/>
            <span>{t("contacts.privacy")}</span>
          </label>

          <button className="button-primary contacts-submit" type="submit" disabled={status === "sending"}>
            {status === "sending" ? t("contacts.sending") : t("contacts.submit")}
            {status === "sending" ? <LoaderCircle className="contacts-submit-spinner" size={16}/> : <Send size={16}/>}
          </button>

          {status === "error" && (
            <p className="contacts-feedback error" role="alert">
              {errorCode === "telegram_not_verified" ? t("contacts.telegramNotVerified") : t(getLeadErrorKey(errorCode), { defaultValue: t("contacts.error") })}
            </p>
          )}
        </form>
      </div>
    </section>

    <section className="contacts-bottom section-wrap">
      <article><span><PackageCheck size={19}/></span><h3>{t("contacts.stepOneTitle")}</h3><p>{t("contacts.stepOneDescription")}</p></article>
      <article><span><Truck size={19}/></span><h3>{t("contacts.stepTwoTitle")}</h3><p>{t("contacts.stepTwoDescription")}</p></article>
      <article><span><Globe2 size={19}/></span><h3>{t("contacts.stepThreeTitle")}</h3><p>{t("contacts.stepThreeDescription")}</p></article>
    </section>

    {showSuccessModal && createPortal(
      <div
        className="contacts-success-overlay"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowSuccessModal(false);
        }}
      >
        <section
          ref={successModalRef}
          className="contacts-success-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contacts-success-title"
          aria-describedby="contacts-success-description"
        >
          <button
            ref={modalCloseRef}
            className="contacts-success-close"
            type="button"
            aria-label={t("contacts.successClose")}
            onClick={() => setShowSuccessModal(false)}
          >
            <X size={18}/>
          </button>

          <div className="contacts-success-icon" aria-hidden="true">
            <CheckCircle2 size={34} strokeWidth={2.2}/>
          </div>
          <span className="contacts-success-eyebrow">MJL FULFILLMENT</span>
          <h2 id="contacts-success-title">{t("contacts.successTitle")}</h2>
          <p id="contacts-success-description">{t("contacts.successDescription")}</p>

          {leadId && (
            <div className="contacts-success-reference">
              <span>{t("contacts.successReference")}</span>
              <strong>{leadId}</strong>
            </div>
          )}

          <button
            className="button-primary contacts-success-action"
            type="button"
            onClick={() => setShowSuccessModal(false)}
          >
            {t("contacts.successClose")}
          </button>
        </section>
      </div>,
      document.body
    )}
  </main>;
}
