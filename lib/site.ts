// URL pública del sitio. En Vercel se define NEXT_PUBLIC_SITE_URL; en las
// previsualizaciones, Vercel expone VERCEL_URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Gregorian Grimorium";

export const SITE_DESCRIPTION =
  "Buscador de canto gregoriano: encuentra una pieza por su íncipit o por cualquier palabra de su texto latino, filtra por modo y edición, y lee la partitura en notación cuadrada.";

/** 3054 -> "3.054". No depende de los datos de ICU del entorno de compilación. */
export function formatCount(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
