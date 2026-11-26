import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "./i18n";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root application element");

const firstPathSegment = window.location.pathname.split("/").filter(Boolean)[0];
const supportedPrefixes = ["en", "zh", "ky", "kk", "uz", "tg"];
const basename = firstPathSegment && supportedPrefixes.includes(firstPathSegment) ? `/${firstPathSegment}` : "/";

const app = (
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
