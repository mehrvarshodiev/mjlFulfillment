import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authClient } from "./auth-client";

export function RequireAuth() {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <main className="auth-page auth-page--loading" aria-busy="true">
        <div className="auth-loading-card">
          <span className="auth-spinner" aria-hidden="true" />
          <p>{t("auth.profile.loading")}</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
