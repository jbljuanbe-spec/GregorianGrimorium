// Conector de Greenhouse (scaleups: Glovo, Wallapop, Revolut…).
//
// Greenhouse suele ser un formulario de una sola página (a veces embebido o en
// job-boards.greenhouse.io / job-boards.eu.greenhouse.io). Rellenamos los campos base y
// dejamos las preguntas personalizadas y el envío para el humano (modo asistido).

import type { Page } from "playwright";
import type { Profile } from "./workday.js";

const log = (msg: string) => console.log(`  [greenhouse] ${msg}`);

async function fillFirst(page: Page, selectors: string[], value?: string): Promise<boolean> {
  if (!value) return false;
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    try {
      if ((await loc.count()) === 0) continue;
      await loc.waitFor({ state: "visible", timeout: 2500 });
      await loc.fill(value);
      log(`${sel} = "${value}"`);
      return true;
    } catch {
      /* siguiente */
    }
  }
  return false;
}

/** Si la vacante muestra un botón "Apply for this job", lo pulsa para abrir el formulario. */
export async function startApplication(page: Page): Promise<void> {
  const applyBtn = page.getByRole("link", { name: /apply/i }).first();
  try {
    if ((await applyBtn.count()) > 0) {
      await applyBtn.click({ timeout: 3000 });
      await page.waitForLoadState("networkidle").catch(() => {});
    }
  } catch {
    /* el formulario ya estaba a la vista */
  }
}

export async function fillBasics(page: Page, p: Profile): Promise<void> {
  await fillFirst(page, ['#first_name', 'input[name="first_name"]', 'input[autocomplete="given-name"]'], p.firstName);
  await fillFirst(page, ['#last_name', 'input[name="last_name"]', 'input[autocomplete="family-name"]'], p.lastName);
  await fillFirst(page, ['#email', 'input[name="email"]', 'input[type="email"]'], p.email);
  await fillFirst(page, ['#phone', 'input[name="phone"]', 'input[type="tel"]'], `${p.phoneCountryCode}${p.phone}`);
  await fillFirst(page, ['#job_application_answers_attributes_linkedin', 'input[name*="linkedin" i]'], p.linkedin);
}

export async function uploadCv(page: Page, cvPath: string): Promise<boolean> {
  const candidates = ['#resume', 'input[type="file"][name*="resume" i]', 'input[type="file"]'];
  for (const sel of candidates) {
    const input = page.locator(sel).first();
    try {
      if ((await input.count()) === 0) continue;
      await input.setInputFiles(cvPath);
      log(`CV subido (${sel})`);
      await page.waitForTimeout(1200);
      return true;
    } catch {
      /* siguiente */
    }
  }
  log("no encontré input de CV (puede requerir pulsar 'Attach' primero).");
  return false;
}

/** Botón de envío de Greenhouse (para NO pulsarlo en modo asistido). */
export async function findSubmitButton(page: Page) {
  const submit = page.locator('#submit_app, button[type="submit"], input[type="submit"]').first();
  return (await submit.count()) > 0 ? submit : null;
}
