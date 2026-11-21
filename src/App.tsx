import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { ServicesPage } from "./pages/ServicesPage";
import { ChinaSellersPage } from "./pages/ChinaSellersPage";
import { AboutPage } from "./pages/AboutPage";
import { InfoPage } from "./pages/InfoPage";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="china" element={<ChinaSellersPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contacts" element={<InfoPage eyebrow="CONTACT / 04" titleKey="contacts.title" descriptionKey="contacts.description" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
