import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, BadgeCheck, Building2, Check, ChevronRight, CircleUserRound, Clock3, LogOut, Mail, PackageCheck, Save, ShieldCheck, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../auth/auth-client";

type Marketplace = "wildberries" | "ozon";
type FulfillmentModel = "FBO" | "FBS";
type CustomerProfile = {
  contactName: string;
  companyName: string;
  inn: string;
  phone: string;
  telegram: string;
  marketplaces: Marketplace[];
  fulfillmentModel: FulfillmentModel;
};

const emptyProfile: CustomerProfile = {
  contactName: "",
  companyName: "",
  inn: "",
  phone: "",
  telegram: "",
  marketplaces: [],
  fulfillmentModel: "FBO"
};

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "MJL";
  return source.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
}

function normalizeProfile(value: unknown): CustomerProfile {
  if (!value || typeof value !== "object") return emptyProfile;
  const row = value as Partial<CustomerProfile>;
  return {
    contactName: typeof row.contactName === "string" ? row.contactName : "",
    companyName: typeof row.companyName === "string" ? row.companyName : "",
    inn: typeof row.inn === "string" ? row.inn : "",
    phone: typeof row.phone === "string" ? row.phone : "",
    telegram: typeof row.telegram === "string" ? row.telegram : "",
    marketplaces: Array.isArray(row.marketplaces)
      ? row.marketplaces.filter((item): item is Marketplace => item === "wildberries" || item === "ozon")
      : [],
    fulfillmentModel: row.fulfillmentModel === "FBS" ? "FBS" : "FBO"
  };
}

export function UserProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [profile, setProfile] = useState<CustomerProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "loadError" | "saveError" | "required" | "">("");
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/customer-profile", { credentials: "include", cache: "no-store" });
        const result = await response.json() as { ok?: boolean; profile?: unknown };
        if (!response.ok || !result.ok) throw new Error("profile_load_failed");
        if (active) setProfile(normalizeProfile(result.profile));
      } catch {
        if (active) setFeedback("loadError");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadAccounts() {
      try {
        const result = await authClient.listAccounts();
        if (active && result.data) {
          const methods = result.data.map((account: { providerId: string }) => account.providerId);
          setLinkedProviders([...new Set<string>(methods)]);
        }
      } catch {
        if (active) setLinkedProviders([]);
      }
    }
    void loadAccounts();
    return () => { active = false; };
  }, []);

  function update<K extends keyof CustomerProfile>(key: K, value: CustomerProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    if (feedback) setFeedback("");
  }

  function toggleMarketplace(marketplace: Marketplace) {
    const next = profile.marketplaces.includes(marketplace)
      ? profile.marketplaces.filter((item) => item !== marketplace)
      : [...profile.marketplaces, marketplace];
    update("marketplaces", next);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    if (!profile.contactName.trim() || !profile.companyName.trim() || !profile.phone.trim() || profile.marketplaces.length === 0) {
      setFeedback("required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/customer-profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      const result = await response.json() as { ok?: boolean; profile?: unknown };
      if (!response.ok || !result.ok) throw new Error("profile_save_failed");
      setProfile(normalizeProfile(result.profile));
      setFeedback("saved");
    } catch {
      setFeedback("saveError");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setSignOutError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(true);
        return;
      }
      navigate("/login", { replace: true });
    } catch {
      setSignOutError(true);
    } finally {
      setSigningOut(false);
    }
  }

  const userName = session?.user.name || session?.user.email?.split("@")[0] || "MJL";
  const userEmail = session?.user.email || "";
  const avatar = session?.user.image;
  const providerLabels: Record<string, string> = {
    email: t("auth.profile.linkedEmail"),
    credential: t("auth.profile.linkedEmail"),
    "magic-link": t("auth.profile.linkedEmail"),
    google: t("auth.profile.linkedGoogle"),
    yandex: t("auth.profile.linkedYandex")
  };

  return (
    <main className="profile-page section-wrap">
      <div className="profile-page-heading">
        <div>
          <span className="section-kicker">{t("auth.profile.eyebrow")}</span>
          <h1>{t("auth.profile.title")}</h1>
          <p>{t("auth.profile.description")}</p>
        </div>
        <Link to="/services#calculator" className="profile-heading-cta">{t("auth.profile.createQuote")}<ArrowUpRight size={17} /></Link>
      </div>

      <section className="profile-identity-card">
        <div className="profile-identity-main">
          {avatar
            ? <img src={avatar} alt="" className="profile-avatar" referrerPolicy="no-referrer" />
            : <span className="profile-avatar profile-avatar--initials">{getInitials(userName, userEmail)}</span>}
          <div className="profile-identity-copy">
            <h2>{userName}</h2>
            <span><Mail size={14} />{userEmail}</span>
          </div>
        </div>
        <div className={session?.user.emailVerified ? "profile-verification is-verified" : "profile-verification"}>
          {session?.user.emailVerified ? <BadgeCheck size={16} /> : <ShieldCheck size={16} />}
          {session?.user.emailVerified ? t("auth.profile.verified") : t("auth.profile.unverified")}
        </div>
      </section>

      <div className="profile-content-grid">
        <div className="profile-main-column">
          <section className="profile-panel">
            <div className="profile-panel-heading">
              <span className="profile-panel-icon"><Building2 size={19} /></span>
              <div><h2>{t("auth.profile.accountData")}</h2><p>{t("auth.profile.description")}</p></div>
            </div>

            {loading ? (
              <div className="profile-loading"><span className="auth-spinner" />{t("auth.profile.loading")}</div>
            ) : (
              <form className="profile-form" onSubmit={saveProfile}>
                <label className="profile-field">
                  <span>{t("auth.profile.contactName")} <i>*</i></span>
                  <input required autoComplete="name" maxLength={160} value={profile.contactName} onChange={(event) => update("contactName", event.target.value)} />
                </label>
                <label className="profile-field">
                  <span>{t("auth.profile.companyName")} <i>*</i></span>
                  <input required autoComplete="organization" maxLength={180} value={profile.companyName} onChange={(event) => update("companyName", event.target.value)} />
                </label>
                <label className="profile-field">
                  <span>{t("auth.profile.inn")} <small>{t("auth.profile.innHint")}</small></span>
                  <input inputMode="numeric" autoComplete="off" maxLength={12} value={profile.inn} onChange={(event) => update("inn", event.target.value.replace(/\D/g, "").slice(0, 12))} />
                </label>
                <label className="profile-field">
                  <span>{t("auth.profile.phone")} <i>*</i></span>
                  <input type="tel" autoComplete="tel" maxLength={40} value={profile.phone} onChange={(event) => update("phone", event.target.value)} />
                </label>
                <label className="profile-field profile-field--full">
                  <span>{t("auth.profile.telegram")} <small>{t("auth.profile.telegramHint")}</small></span>
                  <input autoComplete="off" maxLength={40} value={profile.telegram} onChange={(event) => update("telegram", event.target.value)} placeholder="@username" />
                </label>

                <div className="profile-field profile-field--full">
                  <span>{t("auth.profile.marketplaces")} <small>{t("auth.profile.marketplaceHint")}</small></span>
                  <div className="profile-choice-row">
                    <label className={profile.marketplaces.includes("wildberries") ? "profile-choice is-selected" : "profile-choice"}>
                      <input type="checkbox" checked={profile.marketplaces.includes("wildberries")} onChange={() => toggleMarketplace("wildberries")} />
                      <span className="profile-choice-check">{profile.marketplaces.includes("wildberries") && <Check size={13} />}</span>
                      <strong>{t("auth.profile.wildberries")}</strong>
                    </label>
                    <label className={profile.marketplaces.includes("ozon") ? "profile-choice is-selected" : "profile-choice"}>
                      <input type="checkbox" checked={profile.marketplaces.includes("ozon")} onChange={() => toggleMarketplace("ozon")} />
                      <span className="profile-choice-check">{profile.marketplaces.includes("ozon") && <Check size={13} />}</span>
                      <strong>{t("auth.profile.ozon")}</strong>
                    </label>
                  </div>
                </div>

                <div className="profile-field profile-field--full">
                  <span>{t("auth.profile.fulfillmentModel")}</span>
                  <div className="profile-choice-row">
                    {(["FBO", "FBS"] as const).map((model) => (
                      <label key={model} className={profile.fulfillmentModel === model ? "profile-choice is-selected" : "profile-choice"}>
                        <input type="radio" name="fulfillmentModel" checked={profile.fulfillmentModel === model} onChange={() => update("fulfillmentModel", model)} />
                        <span className="profile-choice-check">{profile.fulfillmentModel === model && <Check size={13} />}</span>
                        <strong>{t(model === "FBO" ? "auth.profile.fbo" : "auth.profile.fbs")}</strong>
                      </label>
                    ))}
                  </div>
                </div>

                {feedback && (
                  <p className={feedback === "saved" ? "profile-feedback is-success" : "profile-feedback is-error"} role={feedback === "saved" ? "status" : "alert"}>
                    {t("auth.profile." + feedback)}
                  </p>
                )}

                <div className="profile-form-actions">
                  <button className="auth-submit-button profile-save-button" type="submit" disabled={saving}>
                    {saving ? <><LoaderCircleIcon />{t("auth.profile.saving")}</> : <><Save size={16} />{t("auth.profile.save")}</>}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="profile-panel profile-shipments-panel">
            <div className="profile-panel-heading">
              <span className="profile-panel-icon"><PackageCheck size={19} /></span>
              <div><h2>{t("auth.profile.shipments")}</h2><p>{t("auth.profile.shipmentsDescription")}</p></div>
            </div>
            <div className="profile-shipment-empty">
              <span className="profile-shipment-illustration"><Truck size={25} /></span>
              <h3>{t("auth.profile.emptyHistory")}</h3>
              <p>{t("auth.profile.emptyHistoryHint")}</p>
              <Link to="/services#calculator" className="profile-empty-cta">{t("auth.profile.createQuote")}<ChevronRight size={16} /></Link>
            </div>
            <div className="profile-history-placeholder">
              <strong>{t("auth.profile.history")}</strong>
              <span>{t("auth.profile.stages")}</span>
              <div className="profile-stage-list">
                <span><i>01</i>{t("auth.profile.receiving")}</span>
                <span><i>02</i>{t("auth.profile.labeling")}</span>
                <span><i>03</i>{t("auth.profile.packing")}</span>
                <span><i>04</i>{t("auth.profile.dispatch")}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="profile-side-column">
          <section className="profile-panel profile-account-panel">
            <div className="profile-panel-heading">
              <span className="profile-panel-icon"><CircleUserRound size={19} /></span>
              <div><h2>{t("auth.profile.accountSettings")}</h2><p>{t("auth.profile.accountNote")}</p></div>
            </div>
            <div className="profile-linked-methods">
              <strong>{t("auth.profile.linkedMethods")}</strong>
              {linkedProviders.map((provider) => (
                <div className="profile-linked-method" key={provider}>
                  <span className={"profile-provider-mark profile-provider-mark--" + provider}>{provider === "google" ? "G" : provider === "yandex" ? "Я" : <Mail size={15} />}</span>
                  <span>{providerLabels[provider] || provider}</span>
                  <BadgeCheck size={15} className="profile-provider-check" />
                </div>
              ))}
            </div>
            {signOutError && <p className="profile-feedback is-error" role="alert">{t("auth.login.error")}</p>}
            <button type="button" className="profile-signout-button" onClick={signOut} disabled={signingOut}>
              {signingOut ? <span className="auth-spinner auth-spinner--small" /> : <LogOut size={16} />}
              {signingOut ? t("auth.profile.saving") : t("auth.profile.signOut")}
            </button>
          </section>
          <div className="profile-security-card">
            <span><ShieldCheck size={19} /></span>
            <strong>MJL FULFILLMENT</strong>
            <p>{t("auth.profile.accountNote")}</p>
            <small><Clock3 size={13} />{t("auth.profile.memberSince")}</small>
          </div>
        </aside>
      </div>
    </main>
  );
}

function LoaderCircleIcon() {
  return <span className="auth-spinner auth-spinner--small" aria-hidden="true" />;
}
