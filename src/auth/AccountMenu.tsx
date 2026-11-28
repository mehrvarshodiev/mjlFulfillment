import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "./auth-client";

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "MJL";
  return source.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
}

export function AccountMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      setOpen(false);
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  if (isPending) {
    return <span className="header-account-skeleton" aria-hidden="true" />;
  }

  if (!session) {
    return (
      <Link to="/login" className="header-account-login">
        <UserRound size={15} aria-hidden="true" />
        <span>{t("auth.menu.signIn")}</span>
      </Link>
    );
  }

  const name = session.user.name || session.user.email.split("@")[0] || "MJL";
  const image = session.user.image;

  return (
    <div className="header-account" ref={rootRef}>
      <button
        type="button"
        className="header-account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {image
          ? <img className="account-avatar" src={image} alt="" referrerPolicy="no-referrer" />
          : <span className="account-avatar account-avatar--initials">{getInitials(name, session.user.email)}</span>}
        <span className="header-account-name">{name}</span>
        <ChevronDown size={14} className={open ? "account-chevron is-open" : "account-chevron"} />
      </button>
      {open && (
        <div className="account-dropdown" role="menu" aria-label={t("auth.menu.open")}>
          <div className="account-dropdown-user">
            <strong>{name}</strong>
            <span>{session.user.email}</span>
          </div>
          <Link to="/userprofile" className="account-dropdown-link" role="menuitem" onClick={() => setOpen(false)}>
            <UserRound size={16} aria-hidden="true" />
            {t("auth.menu.profile")}
          </Link>
          <button type="button" className="account-dropdown-link account-dropdown-logout" role="menuitem" disabled={signingOut} onClick={signOut}>
            <LogOut size={16} aria-hidden="true" />
            {t("auth.menu.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
