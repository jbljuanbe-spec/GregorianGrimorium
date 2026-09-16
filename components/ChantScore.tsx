"use client";

import { useEffect, useRef, useState } from "react";
import { gabcForRendering } from "@/lib/gabc.mjs";

// Exsurge se carga como global desde /vendor/exsurge.js (ver
// scripts/build-exsurge.mjs): su código de 2016 usa imports no relativos que
// el bundler de Next no resuelve.
declare global {
  interface Window {
    exsurge?: {
      ChantContext: new () => ExsurgeContext;
      ChantScore: new (ctxt: ExsurgeContext, mappings: unknown[], useDropCap: boolean) => ExsurgeScore;
      Gabc: { createMappingsFromSource: (ctxt: ExsurgeContext, source: string) => unknown[] };
    };
  }
}

interface ExsurgeContext {
  lyricTextFont: string;
  lyricTextSize: number;
  dropCapTextFont: string;
  annotationTextFont: string;
  setFont?: (font: string, size: number) => void;
}

interface ExsurgeScore {
  performLayout: (ctxt: ExsurgeContext) => void;
  layoutChantLines: (ctxt: ExsurgeContext, width: number, done: () => void) => void;
  createSvg: (ctxt: ExsurgeContext) => string;
}

let loader: Promise<void> | null = null;

function loadExsurge(): Promise<void> {
  if (window.exsurge) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/exsurge.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el motor de partituras"));
    document.head.appendChild(script);
  });
  return loader;
}

const ZOOM_STEPS = [1, 1.25, 1.6, 2];

export default function ChantScore({ gabc }: { gabc: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const target = container.current;
    if (!target) return;

    const render = () => {
      const exsurge = window.exsurge;
      if (!exsurge || cancelled || !target) return;

      const ctxt = new exsurge.ChantContext();
      ctxt.lyricTextFont = "'Crimson Text', Palatino, Georgia, serif";
      ctxt.lyricTextSize *= 1.15 * zoom;
      ctxt.dropCapTextFont = ctxt.lyricTextFont;
      ctxt.annotationTextFont = ctxt.lyricTextFont;

      const mappings = exsurge.Gabc.createMappingsFromSource(ctxt, gabcForRendering(gabc));
      const score = new exsurge.ChantScore(ctxt, mappings, true);
      score.performLayout(ctxt);
      // Con zoom, el pentagrama crece y se desplaza en horizontal en vez de
      // comprimir los neumas: un director tiene que poder leerlos. Se descuenta
      // el relleno del contenedor para que la última sílaba no quede cortada.
      const style = getComputedStyle(target);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const width = Math.max(target.clientWidth - padding, 320) * zoom;
      score.layoutChantLines(ctxt, width, () => {
        if (!cancelled && target) target.innerHTML = score.createSvg(ctxt);
      });
    };

    loadExsurge()
      .then(render)
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });

    const onResize = () => render();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [gabc, zoom]);

  return (
    <div className="score-panel">
      <div className="score-toolbar">
        <span>Partitura</span>
        <button type="button" onClick={() => setZoom(nextZoom(zoom))} aria-label="Cambiar tamaño de la partitura">
          Zoom ×{zoom}
        </button>
        <span>Dibujada desde el gabc, no es una imagen escaneada.</span>
      </div>
      <div className="score-surface" ref={container} role="img" aria-label="Notación cuadrada del canto" />
      {error ? <p className="notice">{error}</p> : null}
    </div>
  );
}

function nextZoom(current: number): number {
  const index = ZOOM_STEPS.indexOf(current);
  return ZOOM_STEPS[(index + 1) % ZOOM_STEPS.length];
}
