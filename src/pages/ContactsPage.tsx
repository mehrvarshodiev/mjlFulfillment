import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock3, Globe2, MessageCircle, PackageCheck, Send, ShieldCheck, Truck } from "lucide-react";

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

const initialForm: FormState = {
  name: "", phone: "", company: "", country: "", productType: "", volume: "", marketplace: "both", telegram: "", website: ""
};

export function ContactsPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status === "error" || status === "success") setStatus("idle");
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json() as { ok?: boolean; code?: string };
      if (!response.ok || !result.ok) throw new Error(result.code || "request_failed");
      setStatus("success");
      setForm(initialForm);
    } catch {
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
        <div className="contacts-form-heading"><span>{t("contacts.formEyebrow")}</span><h2>{t("contacts.formTitle")}</h2><p>{t("contacts.formDescription")}</p></div>
        <form onSubmit={handleSubmit}>
          <div className="contacts-field-grid">
            <label>{t("contacts.name")}<input required autoComplete="name" maxLength={100} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder={t("contacts.namePlaceholder")}/></label>
            <label>{t("contacts.phone")}<input required type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder={t("contacts.phonePlaceholder")}/></label>
            <label>{t("contacts.company")}<input autoComplete="organization" maxLength={120} value={form.company} onChange={(e) => update("company", e.target.value)} placeholder={t("contacts.companyPlaceholder")}/></label>
            <label>{t("contacts.country")}<input required autoComplete="country-name" maxLength={80} value={form.country} onChange={(e) => update("country", e.target.value)} placeholder={t("contacts.countryPlaceholder")}/></label>
            <label>{t("contacts.productType")}<input required maxLength={120} value={form.productType} onChange={(e) => update("productType", e.target.value)} placeholder={t("contacts.productPlaceholder")}/></label>
            <label>{t("contacts.volume")}<input required maxLength={80} value={form.volume} onChange={(e) => update("volume", e.target.value)} placeholder={t("contacts.volumePlaceholder")}/></label>
            <label>{t("contacts.marketplace")}<select value={form.marketplace} onChange={(e) => update("marketplace", e.target.value)}><option value="both">{t("contacts.marketplaceBoth")}</option><option value="wildberries">Wildberries</option><option value="ozon">Ozon</option><option value="other">{t("contacts.marketplaceOther")}</option></select></label>
            <label>{t("contacts.telegram")}<input maxLength={80} value={form.telegram} onChange={(e) => update("telegram", e.target.value)} placeholder="@username"/></label>
          </div>
          <label className="contacts-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)}/></label>
          <label className="contacts-consent"><input type="checkbox" required/><span>{t("contacts.privacy")}</span></label>
          <button className="button-primary contacts-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? t("contacts.sending") : t("contacts.submit")}<Send size={16}/></button>
          {status === "success" && <p className="contacts-feedback success" role="status"><CheckCircle2 size={17}/>{t("contacts.success")}</p>}
          {status === "error" && <p className="contacts-feedback error" role="alert">{t("contacts.error")}</p>}
        </form>
      </div>
    </section>
    <section className="contacts-bottom section-wrap">
      <article><span><PackageCheck size={19}/></span><h3>{t("contacts.stepOneTitle")}</h3><p>{t("contacts.stepOneDescription")}</p></article>
      <article><span><Truck size={19}/></span><h3>{t("contacts.stepTwoTitle")}</h3><p>{t("contacts.stepTwoDescription")}</p></article>
      <article><span><Globe2 size={19}/></span><h3>{t("contacts.stepThreeTitle")}</h3><p>{t("contacts.stepThreeDescription")}</p></article>
    </section>
  </main>;
}
