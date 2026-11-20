import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
type InfoPageProps = { titleKey: string; descriptionKey: string; eyebrow: string };
export function InfoPage({ titleKey, descriptionKey, eyebrow }: InfoPageProps) {
  const { t } = useTranslation();
  return <main className="info-page section-wrap"><span className="section-kicker">{eyebrow}</span><h1>{t(titleKey)}</h1><p>{t(descriptionKey)}</p><Link className="button-primary" to="/contacts">{t("common.contact")}<ArrowUpRight size={17}/></Link></main>;
}
