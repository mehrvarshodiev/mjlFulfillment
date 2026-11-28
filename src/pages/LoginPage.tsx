import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation } from "react-router-dom";
import { authClient } from "../auth/auth-client";
import { MjlLogo } from "../components/brand/MjlLogo";

type LoginLocationState = { from?: string };

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const language = (i18n.resolvedLanguage || "ru").split("-")[0];
  const profilePath = language !== "ru" && ["en", "zh", "ky", "kk", "uz", "tg"].includes(language) ? `/${language}/userprofile` : "/userprofile";
  const localizedLoginPath = language !== "ru" && ["en", "zh", "ky", "kk", "uz", "tg"].includes(language) ? `/${language}/login` : "/login";
  const providerError = new URLSearchParams(location.search).has("error");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "yandex" | "email" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  if (!sessionPending && session) return <Navigate to={state?.from || profilePath} replace />;

  async function signInWithGoogle() {
    setError("");
    setBusy("google");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: profilePath,
        errorCallbackURL: localizedLoginPath
      });
      if (result.error) setError(
        result.error.code === "PROVIDER_NOT_FOUND"
          ? t("auth.login.providerUnavailable")
          : t("auth.login.error")
      );
    } catch {
      setError(t("auth.login.providerUnavailable"));
    } finally {
      setBusy(null);
    }
  }

  async function signInWithYandex() {
    setError("");
    setBusy("yandex");
    try {
      const result = await authClient.signIn.oauth2({
        providerId: "yandex",
        callbackURL: profilePath,
        errorCallbackURL: localizedLoginPath,
        newUserCallbackURL: profilePath
      });
      if (result.error) setError(t("auth.login.error"));
    } catch {
      setError(t("auth.login.providerUnavailable"));
    } finally {
      setBusy(null);
    }
  }

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setValidationError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setValidationError(t("auth.login.emailRequired"));
      return;
    }
    setBusy("email");
    try {
      const result = await authClient.signIn.magicLink({
        email: normalizedEmail,
        callbackURL: profilePath,
        newUserCallbackURL: profilePath,
        errorCallbackURL: localizedLoginPath
      });
      if (result.error) {
        setError(t("auth.login.error"));
      } else {
        setSent(true);
      }
    } catch {
      setError(t("auth.login.error"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page-glow" aria-hidden="true" />
      <div className="auth-page-top">
        <Link to="/" className="auth-back-link"><ArrowLeft size={16} />{t("auth.login.back")}</Link>
        <Link to="/" className="auth-brand" aria-label="MJL Fulfillment — home"><MjlLogo /></Link>
      </div>
      <section className="auth-card">
        <div className="auth-card-visual" aria-hidden="true">
          <div className="auth-orbit auth-orbit--one" />
          <div className="auth-orbit auth-orbit--two" />
          <div className="auth-visual-mark">MJL<span>.</span></div>
          <div className="auth-visual-caption">FULFILLMENT / CLIENT PORTAL</div>
          <div className="auth-visual-stats">
            <span><i />{t("auth.profile.receiving")}</span>
            <span><i />{t("auth.profile.labeling")}</span>
            <span><i />{t("auth.profile.dispatch")}</span>
          </div>
        </div>
        <div className="auth-card-content">
          <span className="auth-eyebrow">{t("auth.login.eyebrow")}</span>
          <h1>{t("auth.login.title")}</h1>
          <p className="auth-intro">{t("auth.login.description")}</p>

          {sent ? (
            <div className="auth-success-state" role="status">
              <span className="auth-success-icon"><CheckCircle2 size={26} /></span>
              <h2>{t("auth.login.sentTitle")}</h2>
              <p>{t("auth.login.sentDescription")}</p>
              <strong className="auth-sent-email">{email.trim()}</strong>
              <button className="auth-text-button" type="button" onClick={() => setSent(false)}>{t("auth.login.sendAgain")}</button>
            </div>
          ) : (
            <>
              <div className="auth-social-buttons">
                <button className="auth-social-button" type="button" onClick={signInWithGoogle} disabled={busy !== null}>
                  {busy === "google" ? <LoaderCircle className="auth-spinner-icon" size={18} /> : <span className="auth-google-mark">G</span>}
                  {t("auth.login.google")}
                </button>
                <button className="auth-social-button" type="button" onClick={signInWithYandex} disabled={busy !== null}>
                  {busy === "yandex" ? <LoaderCircle className="auth-spinner-icon" size={18} /> : <span className="auth-yandex-mark">Я</span>}
                  {t("auth.login.yandex")}
                </button>
              </div>

              <div className="auth-divider"><span>{t("auth.login.divider")}</span></div>

              <form className="auth-email-form" onSubmit={sendMagicLink}>
                <label htmlFor="auth-email">{t("auth.login.emailLabel")}</label>
                <div className={validationError ? "auth-input-wrap has-error" : "auth-input-wrap"}>
                  <Mail size={17} aria-hidden="true" />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setValidationError(""); }}
                    placeholder={t("auth.login.emailPlaceholder")}
                    aria-invalid={Boolean(validationError)}
                    aria-describedby={validationError ? "auth-email-error" : undefined}
                  />
                </div>
                {validationError && <p className="auth-field-error" id="auth-email-error">{validationError}</p>}
                <button className="auth-submit-button" type="submit" disabled={busy !== null}>
                  {busy === "email" ? <><LoaderCircle className="auth-spinner-icon" size={17} />{t("auth.login.sending")}</> : <>{t("auth.login.submit")}<ArrowUpRight size={17} /></>}
                </button>
              </form>
            </>
          )}

          {(error || providerError) && <p className="auth-error-message" role="alert">{error || t("auth.login.error")}</p>}
          <p className="auth-security-note">{t("auth.login.security")}</p>
        </div>
      </section>
      <p className="auth-page-footer">© {new Date().getFullYear()} MJL FULFILLMENT · CLIENT PORTAL</p>
    </main>
  );
}
