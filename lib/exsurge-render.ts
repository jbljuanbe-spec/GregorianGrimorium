// Carga y uso del motor de partituras. Lo comparten la ficha de canto y el
// repertorio, que dibuja varias piezas seguidas.
//
// Exsurge se sirve como global desde /vendor/exsurge.js (ver
// scripts/build-exsurge.mjs): su código de 2016 usa imports no relativos que
// el bundler de Next no resuelve.

import { gabcForRendering } from "@/lib/gabc.mjs";

declare global {
  interface Window {
    exsurge?: {
      ChantContext: new () => ExsurgeContext;
      ChantScore: new (ctxt: ExsurgeContext, mappings: ExsurgeMapping[], useDropCap: boolean) => ExsurgeScore;
      Gabc: { createMappingsFromSource: (ctxt: ExsurgeContext, source: string) => ExsurgeMapping[] };
    };
  }
}

interface ExsurgeContext {
  lyricTextFont: string;
  lyricTextSize: number;
  dropCapTextFont: string;
  annotationTextFont: string;
}

interface ExsurgeMapping {
  notations?: { isNeume?: boolean; notes?: { pitch: { toInt: () => number } | null }[] }[];
}

interface ExsurgeScore {
  mappings: ExsurgeMapping[];
  startingClef: { octave: number } | null;
  performLayout: (ctxt: ExsurgeContext) => void;
  layoutChantLines: (ctxt: ExsurgeContext, width: number, done: () => void) => void;
  createSvg: (ctxt: ExsurgeContext) => string;
}

let loader: Promise<void> | null = null;

export function loadExsurge(): Promise<void> {
  if (window.exsurge) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/exsurge.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el motor de partituras."));
    document.head.appendChild(script);
  });
  return loader;
}

/**
 * Dibuja el gabc dentro de `target` y devuelve los intervalos en semitonos
 * desde el do de la clave, que es lo único que la notación fija.
 */
export function renderScore({
  gabc,
  target,
  zoom = 1,
}: {
  gabc: string;
  target: HTMLElement;
  zoom?: number;
}): Promise<number[]> {
  const exsurge = window.exsurge;
  if (!exsurge) return Promise.resolve([]);

  const ctxt = new exsurge.ChantContext();
  ctxt.lyricTextFont = "var(--font-chant), Georgia, serif";
  ctxt.lyricTextSize *= 1.15 * zoom;
  ctxt.dropCapTextFont = ctxt.lyricTextFont;
  ctxt.annotationTextFont = ctxt.lyricTextFont;

  const mappings = exsurge.Gabc.createMappingsFromSource(ctxt, gabcForRendering(gabc));
  const score = new exsurge.ChantScore(ctxt, mappings, true);
  score.performLayout(ctxt);

  // Se descuenta el relleno para que la última sílaba no quede cortada. Con
  // zoom el pentagrama crece y se desplaza en horizontal, en vez de comprimir
  // los neumas: un director tiene que poder leerlos.
  const style = getComputedStyle(target);
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const width = Math.max(target.clientWidth - padding, 280) * zoom;

  return new Promise((resolve) => {
    score.layoutChantLines(ctxt, width, () => {
      target.innerHTML = score.createSvg(ctxt);
      resolve(readSemitones(score));
    });
  });
}

function readSemitones(score: ExsurgeScore): number[] {
  const doOffset = (score.startingClef?.octave ?? 0) * 12;
  const semitones: number[] = [];

  for (const mapping of score.mappings) {
    for (const notation of mapping.notations ?? []) {
      if (!notation.isNeume) continue;
      for (const note of notation.notes ?? []) {
        if (note.pitch) semitones.push(note.pitch.toInt() - doOffset);
      }
    }
  }
  return semitones;
}
