// Co-piloto de candidaturas en portales Workday — runner principal.
//
// USO (en tu portátil, no en la nube):
//   npm install
//   npx playwright install chromium
//   npx tsx src/apply.ts --url "<URL de la vacante>" --cv "../cv/es/CV_....pdf"
//   # o una cola:
//   npx tsx src/apply.ts --queue jobs.json
//
// MODO ASISTIDO (por defecto): rellena todo lo que reconoce y SE PARA antes de enviar,
// para que revises, resuelvas CAPTCHA/2FA y pulses tú "Submit".
// Para permitir envío automático (bajo tu riesgo): añade --submit  (no recomendado).
//
// La sesión del navegador se guarda en ./chrome-user-data (persistente): te logueas una
// vez por empresa y queda recordado. Ese directorio NO se sube a git (.gitignore).

import { chromium, type BrowserContext, type Page } from "playwright";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as wd from "./workday.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

interface Job { empresa?: string; url: string; cv: string; carta?: string }

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) { args[key] = next; i++; }
      else args[key] = true;
    }
  }
  return args;
}

function loadProfile() {
  return JSON.parse(readFileSync(resolve(ROOT, "profile.json"), "utf8")) as wd.Profile;
}

async function pause(message: string) {
  console.log(`\n⏸  ${message}\n   → Cuando termines, pulsa ENTER aquí para continuar…`);
  await new Promise<void>((res) => {
    process.stdin.resume();
    process.stdin.once("data", () => { process.stdin.pause(); res(); });
  });
}

async function applyToJob(context: BrowserContext, job: Job, profile: wd.Profile, autoSubmit: boolean) {
  const cvAbs = resolve(ROOT, job.cv);
  console.log(`\n=== ${job.empresa ?? "Vacante"} ===`);
  console.log(`URL: ${job.url}`);
  console.log(`CV:  ${cvAbs}`);

  const page: Page = await context.newPage();
  await page.goto(job.url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 1) Iniciar candidatura.
  await wd.startApplication(page);

  // 2) Si el tenant pide login/crear cuenta, lo resuelve el humano (sesión persistente).
  await pause("Si el portal pide iniciar sesión o crear cuenta, hazlo ahora en la ventana del navegador.");

  // 3) Subir CV (Workday suele ofrecerlo al principio o en 'My Experience').
  await wd.uploadCv(page, cvAbs);

  // 4) Recorrer los pasos rellenando lo que se reconoce, hasta llegar al envío.
  for (let step = 0; step < 8; step++) {
    await wd.fillMyInformation(page, profile);
    await wd.answerScreening(page, profile);
    await wd.uploadCv(page, cvAbs); // por si el input aparece en un paso posterior

    const submit = await wd.findSubmitButton(page);
    if (submit) {
      console.log("\n✅ Formulario en el paso final (botón Submit detectado).");
      break;
    }
    const advanced = await wd.goNext(page);
    if (!advanced) {
      console.log("\nℹ️  No encuentro botón 'Next' ni 'Submit'. Probablemente falta algún campo obligatorio.");
      break;
    }
    await page.waitForTimeout(1200);
  }

  // 5) Envío.
  const submit = await wd.findSubmitButton(page);
  if (autoSubmit && submit) {
    console.log("⚠️  --submit activo: enviando automáticamente…");
    await submit.click();
    console.log("📨 Enviado.");
  } else {
    await pause(
      "MODO ASISTIDO: revisa todos los campos, completa lo que falte, resuelve CAPTCHA/2FA " +
      "y pulsa tú el botón 'Submit'. (No envío yo nada.)"
    );
  }

  console.log(`\n👉 Registra el resultado en ../seguimiento/candidaturas.csv (empresa: ${job.empresa ?? ""}).`);
  await page.close().catch(() => {});
}

async function main() {
  const args = parseArgs(process.argv);
  const autoSubmit = Boolean(args.submit);
  const profile = loadProfile();

  let jobs: Job[] = [];
  if (typeof args.queue === "string") {
    jobs = JSON.parse(readFileSync(resolve(ROOT, args.queue), "utf8"));
  } else if (typeof args.url === "string" && typeof args.cv === "string") {
    jobs = [{ url: args.url, cv: args.cv, empresa: typeof args.empresa === "string" ? args.empresa : undefined }];
  } else {
    console.error(
      "Uso: --url <URL> --cv <ruta_cv> [--empresa <nombre>] [--submit]\n" +
      "  o: --queue jobs.json [--submit]"
    );
    process.exit(1);
  }

  console.log(`Co-piloto Workday · ${jobs.length} vacante(s) · modo ${autoSubmit ? "ENVÍO AUTOMÁTICO ⚠️" : "asistido (recomendado)"}`);

  // Navegador persistente = tus logins se recuerdan entre ejecuciones.
  const context = await chromium.launchPersistentContext(resolve(ROOT, "chrome-user-data"), {
    headless: false,
    channel: "chrome", // usa tu Chrome instalado; quita esta línea para usar el Chromium de Playwright
    viewport: { width: 1280, height: 900 },
  });

  try {
    for (const job of jobs) {
      try {
        await applyToJob(context, job, profile, autoSubmit);
      } catch (err) {
        console.error(`❌ Error en ${job.empresa ?? job.url}:`, (err as Error).message);
        await pause("Revisa la ventana. Pulsa ENTER para pasar a la siguiente vacante.");
      }
    }
  } finally {
    await pause("Fin de la cola. Pulsa ENTER para cerrar el navegador.");
    await context.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
