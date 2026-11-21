import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { InfoPage } from "./pages/InfoPage";
import { ServicesPage } from "./pages/ServicesPage";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="china" element={<InfoPage eyebrow="CROSS-BORDER / 02" titleKey="china.title" descriptionKey="china.description" />} />
        <Route path="about" element={<InfoPage eyebrow="ABOUT MJL / 03" titleKey="about.title" descriptionKey="about.description" />} />
        <Route path="contacts" element={<InfoPage eyebrow="CONTACT / 04" titleKey="contacts.title" descriptionKey="contacts.description" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
