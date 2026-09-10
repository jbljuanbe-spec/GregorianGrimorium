// Conector de Workday.
//
// Los portales Workday (Iberdrola, Repsol, Acciona, Enagás, Santander, BBVA…) comparten
// los mismos atributos `data-automation-id` en su flujo de candidatura. Eso permite un
// único conector para todos. Aun así, cada tenant tiene variaciones y Workday cambia con
// el tiempo: por eso el modo es ASISTIDO (rellena lo que reconoce y se para antes de enviar).

import type { Page } from "playwright";

export interface Profile {
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  linkedin?: string;
  address: { line1: string; city: string; postalCode?: string; region?: string; country: string };
  screeningAnswers?: Record<string, string>;
}

const log = (msg: string) => console.log(`  [workday] ${msg}`);

/** Rellena un campo por su data-automation-id si existe y está visible. Best-effort. */
async function fillById(page: Page, automationId: string, value?: string): Promise<boolean> {
  if (!value) return false;
  const loc = page.locator(`[data-automation-id="${automationId}"]`).first();
  try {
    if ((await loc.count()) === 0) return false;
    await loc.waitFor({ state: "visible", timeout: 3000 });
    await loc.fill(value);
    log(`campo ${automationId} = "${value}"`);
    return true;
  } catch {
    return false;
  }
}

/** Hace clic en un botón por data-automation-id si existe. */
async function clickById(page: Page, automationId: string, timeout = 4000): Promise<boolean> {
  const loc = page.locator(`[data-automation-id="${automationId}"]`).first();
  try {
    if ((await loc.count()) === 0) return false;
    await loc.waitFor({ state: "visible", timeout });
    await loc.click();
    return true;
  } catch {
    return false;
  }
}

/**
 * Inicia el flujo de candidatura: pulsa "Apply" y luego "Apply Manually" si aparece.
 * Si el tenant exige cuenta/login, el usuario lo resuelve a mano (sesión persistente:
 * solo hace falta una vez por empresa).
 */
export async function startApplication(page: Page): Promise<void> {
  await clickById(page, "apply", 6000);
  // Menú desplegable "Apply" → "Apply Manually" (evita "Use My Last Application" / autofill).
  await clickById(page, "applyManually", 3000);
  await page.waitForLoadState("networkidle").catch(() => {});
}

/** Sube el CV en el paso que tenga input de fichero. */
export async function uploadCv(page: Page, cvPath: string): Promise<boolean> {
  const candidates = [
    'input[data-automation-id="file-upload-input-ref"]',
    '[data-automation-id="resumeSection"] input[type="file"]',
    'input[type="file"]',
  ];
  for (const sel of candidates) {
    const input = page.locator(sel).first();
    try {
      if ((await input.count()) === 0) continue;
      await input.setInputFiles(cvPath);
      log(`CV subido (${sel})`);
      await page.waitForTimeout(1500);
      return true;
    } catch {
      /* siguiente candidato */
    }
  }
  log("no encontré input de CV en este paso (puede que sea otro paso).");
  return false;
}

/** Rellena los datos personales típicos del paso "My Information". */
export async function fillMyInformation(page: Page, p: Profile): Promise<void> {
  // Nombre legal.
  await fillById(page, "legalNameSection_firstName", p.firstName);
  await fillById(page, "legalNameSection_lastName", p.lastName);
  // Contacto.
  await fillById(page, "email", p.email);
  await fillById(page, "phone-number", p.phone);
  await fillById(page, "addressSection_addressLine1", p.address.line1);
  await fillById(page, "addressSection_city", p.address.city);
  await fillById(page, "addressSection_postalCode", p.address.postalCode);
  // "How did you hear about us" y otros dropdowns quedan para revisión humana (varían mucho).
}

/**
 * Intenta responder preguntas de screening de texto libre a partir del mapa del perfil.
 * Reconoce por coincidencia de palabra clave en el enunciado. Lo que no reconoce, lo deja
 * para el humano (por eso paramos antes de enviar).
 */
export async function answerScreening(page: Page, p: Profile): Promise<void> {
  const answers = p.screeningAnswers ?? {};
  const inputs = page.locator('[data-automation-id="textInputBox"], textarea');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    const box = inputs.nth(i);
    if (!(await box.isVisible().catch(() => false))) continue;
    if ((await box.inputValue().catch(() => "")) !== "") continue; // ya rellenado
    // Buscar el enunciado cercano.
    const label = (await box
      .locator("xpath=ancestor::*[self::div][1]")
      .innerText()
      .catch(() => "")).toLowerCase();
    for (const [key, value] of Object.entries(answers)) {
      if (key.startsWith("_") || !value) continue;
      if (label.includes(key.toLowerCase())) {
        await box.fill(value).catch(() => {});
        log(`screening "${key}" -> "${value}"`);
        break;
      }
    }
  }
}

/** Avanza al siguiente paso. Devuelve false si no hay botón "siguiente". */
export async function goNext(page: Page): Promise<boolean> {
  const ok =
    (await clickById(page, "pageFooterNextButton", 3000)) ||
    (await clickById(page, "bottom-navigation-next-button", 3000)) ||
    (await clickById(page, "wd-CommandButton_uic_saveAndContinueButton", 3000));
  if (ok) await page.waitForLoadState("networkidle").catch(() => {});
  return ok;
}

/** Detecta el botón de envío final (para NO pulsarlo en modo asistido). */
export async function findSubmitButton(page: Page) {
  const submit = page.locator('[data-automation-id="pageFooterSubmitButton"], [data-automation-id="submitButton"]').first();
  return (await submit.count()) > 0 ? submit : null;
}
