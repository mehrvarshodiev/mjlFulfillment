import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { HomePage } from "./pages/HomePage";

const ServicesPage = lazy(() => import("./pages/ServicesPage").then(module => ({ default: module.ServicesPage })));
const ChinaSellersPage = lazy(() => import("./pages/ChinaSellersPage").then(module => ({ default: module.ChinaSellersPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then(module => ({ default: module.AboutPage })));
const ContactsPage = lazy(() => import("./pages/ContactsPage").then(module => ({ default: module.ContactsPage })));

function PageLoader() {
  return <div className="page-loader" role="status" aria-live="polite"><span className="page-loader-mark">MJL</span><span>FULFILLMENT</span></div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<Suspense fallback={<PageLoader />}><ServicesPage /></Suspense>} />
        <Route path="china" element={<Suspense fallback={<PageLoader />}><ChinaSellersPage /></Suspense>} />
        <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="contacts" element={<Suspense fallback={<PageLoader />}><ContactsPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
