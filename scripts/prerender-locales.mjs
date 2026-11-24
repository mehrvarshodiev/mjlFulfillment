import { createServer } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://mjlfulfillment.vercel.app";
const routes = [
  "/", "/services", "/china", "/about", "/contacts",
  "/en/", "/en/services", "/en/china", "/en/about", "/en/contacts",
  "/zh/", "/zh/services", "/zh/china", "/zh/about", "/zh/contacts"
];

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderHeadElement(element) {
  const attributes = Object.entries(element.props)
    .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
    .join(" ");
  return `<${element.type} ${attributes}>`;
}

function outputFileForRoute(route) {
  if (route === "/") return path.resolve("dist/index.html");
  const segments = route.split("/").filter(Boolean);
  return path.resolve("dist", ...segments, "index.html");
}

const template = await readFile(path.resolve("dist/index.html"), "utf8");
const vite = await createServer({
  configFile: path.resolve("vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error"
});

try {
  const { prerender } = await vite.ssrLoadModule("/src/prerender.tsx");

  for (const route of routes) {
    const result = await prerender({ url: new URL(route, origin).toString() });
    const tags = [...result.head.elements].map(renderHeadElement).join("\n    ");
    let html = template
      .replace('<html lang="ru">', `<html lang="${escapeAttribute(result.head.lang)}">`)
      .replace(/<title>.*?<\\/title>/s, `<title>${escapeAttribute(result.head.title)}</title>`)
      .replace('<div id="root"></div>', `<div id="root">${result.html}</div>`)
      .replace("</head>", `    ${tags}\n  </head>`);

    const output = outputFileForRoute(route);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html, "utf8");
  }

  process.stdout.write(`Prerendered ${routes.length} static pages (RU, EN, ZH).\\n`);
} finally {
  await vite.close();
}
