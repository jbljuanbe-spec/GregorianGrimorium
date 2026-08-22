import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const publicDir = resolve(root, "public");
const distDir = resolve(root, "dist");

const [index, styles, sources, app] = await Promise.all([
  readFile(resolve(publicDir, "index.html"), "utf8"),
  readFile(resolve(publicDir, "styles.css"), "utf8"),
  readFile(resolve(publicDir, "sources.js"), "utf8"),
  readFile(resolve(publicDir, "app.js"), "utf8"),
]);

const body = index
  .replace(/\s*<link rel="stylesheet" href="\.\/styles\.css" \/>/, "")
  .replace(/\s*<script type="module" src="\.\/app\.js"><\/script>/, "")
  .replace("</head>", `<style>${styles}</style></head>`)
  .replace("</body>", `<script type="module">${sources}\n${app.replace('import { searchPublicSources } from "./sources.js";\n\n', "")}</script></body>`);

const worker = `addEventListener("fetch", event => {
  event.respondWith(new Response(${JSON.stringify(body)}, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff"
    }
  }));
});\n`;

const mcpInput = {
  code: `async () => cloudflare.request({ method: "PUT", path: \`/accounts/\${accountId}/workers/scripts/byscador-ofertas-espana\`, body: ${JSON.stringify(worker)}, contentType: "application/javascript", rawBody: true })`,
};

await mkdir(distDir, { recursive: true });
await writeFile(resolve(distDir, "worker.js"), worker);
await writeFile(resolve(distDir, "deploy-worker.json"), JSON.stringify(mcpInput));
console.log("Worker autónomo empaquetado en standalone/dist/worker.js");
