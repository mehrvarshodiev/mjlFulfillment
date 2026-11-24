import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

const prerenderRoutes = [
  "/", "/services", "/china", "/about", "/contacts",
  "/en/", "/en/services", "/en/china", "/en/about", "/en/contacts",
  "/zh/", "/zh/services", "/zh/china", "/zh/about", "/zh/contacts"
];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vitePrerenderPlugin({
      renderTarget: "#root",
      prerenderScript: resolve(process.cwd(), "src/prerender.tsx"),
      additionalPrerenderRoutes: prerenderRoutes
    })
  ],
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
          if (id.includes("react-router")) return "router-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("i18next") || id.includes("react-i18next")) return "i18n-vendor";
        }
      }
    }
  }
});
