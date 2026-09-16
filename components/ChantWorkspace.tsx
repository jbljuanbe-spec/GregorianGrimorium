"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChantPlayer from "@/components/ChantPlayer";
import PitchPipe from "@/components/PitchPipe";
import { gabcForRendering } from "@/lib/gabc.mjs";
import { readPerformance } from "@/lib/performance.mjs";
import { absolutePitches, midiToName, suggestDo } from "@/lib/pitch.mjs";
import { loadExsurge, renderScore } from "@/lib/exsurge-render";

const ZOOM_STEPS = [1, 1.25, 1.6, 2];

/**
 * La mesa de trabajo de una pieza: la partitura al centro y los controles de
 * ensayo al lado. Ambas columnas comparten el tono y el modelo de ejecución,
 * así que viven en el mismo componente; el contenido de lectura llega ya
 * renderizado del servidor para que siga siendo indexable.
 */
export default function ChantWorkspace({
  gabc,
  filename,
  header,
  children,
}: {
  gabc: string;
  filename: string;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [rehearsing, setRehearsing] = useState(false);
  const [doMidi, setDoMidi] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Alturas y duraciones salen de la notación, no del dibujo: Exsurge no
  // aplica las alteraciones sueltas ni expone duraciones. Ver docs/PITCH.md.
  const performance = useMemo(() => readPerformance(gabcForRendering(gabc)), [gabc]);
  const semitones = useMemo(
    () => performance.events.flatMap((event) => (event.kind === "note" ? [event.semitones] : [])),
    [performance],
  );

  useEffect(() => {
    setDoMidi((current) => current ?? suggestDo(semitones));
  }, [semitones]);

  useEffect(() => {
    let cancelled = false;
    const target = surface.current;
    if (!target) return;

    const draw = () => {
      void renderScore({ gabc, target, zoom });
    };

    loadExsurge()
      .then(draw)
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });

    window.addEventListener("resize", draw);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", draw);
    };
  }, [gabc, zoom, rehearsing]);

  useEffect(() => {
    const sync = () => setRehearsing(document.fullscreenElement === sheet.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const download = useCallback(
    (data: BlobPart, type: string, extension: string) => {
      const url = URL.createObjectURL(new Blob([data], { type }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [filename],
  );

  const svgMarkup = useCallback(() => {
    const svg = surface.current?.querySelector("svg");
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGElement;
    // La fuente de la web no viaja con el archivo: se deja una pila con
    // alternativas reales para que el texto no se pierda al abrirlo fuera.
    clone.setAttribute("style", "font-family: Spectral, Georgia, 'Times New Roman', serif");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
  }, []);

  const downloadPng = useCallback(async () => {
    const markup = svgMarkup();
    const svg = surface.current?.querySelector("svg");
    if (!markup || !svg) return;

    const width = Number(svg.getAttribute("width")) || svg.clientWidth;
    const height = Number(svg.getAttribute("height")) || svg.clientHeight;
    const scale = 2; // Para que sirva impreso, no solo en pantalla.

    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("no se pudo rasterizar"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#fffdf6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [filename, svgMarkup]);

  const toggleRehearsal = useCallback(async () => {
    if (!sheet.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await sheet.current.requestFullscreen();
    } catch {
      // Algunos navegadores lo deniegan sin gesto del usuario; no merece
      // interrumpir la lectura de la partitura.
    }
  }, []);

  const pitches = doMidi !== null ? absolutePitches(semitones, doMidi) : null;

  return (
    <>
      <div className="workspace-main">
        {header}

        <div className="sheet" ref={sheet}>
          <div className="sheet-bar">
            <span className="rubric">Partitura</span>
            <button type="button" className="button" onClick={() => setZoom(nextZoom(zoom))}>
              Zoom ×{zoom}
            </button>
            <button
              type="button"
              className="button"
              onClick={toggleRehearsal}
              aria-pressed={rehearsing}
            >
              {rehearsing ? "Salir" : "Modo ensayo"}
            </button>
          </div>

          <div
            className="score-surface"
            ref={surface}
            role="img"
            aria-label="Notación cuadrada del canto"
          />

          {error ? <p className="notice">{error}</p> : null}
        </div>

        {children}
      </div>

      <aside className="workspace-aside rail-tools">
        <h2>Controles de ensayo</h2>

        {doMidi !== null ? (
          <>
            <div className="rail-group">
              <h3>Diapasón</h3>
              <PitchPipe doMidi={doMidi} onChange={setDoMidi} />
            </div>

            <div className="rail-group">
              <h3>Reproductor de práctica</h3>
              <ChantPlayer events={performance.events} doMidi={doMidi} />
            </div>

            {pitches ? (
              <div className="rail-group">
                <h3>Tesitura</h3>
                <p className="rail-note">
                  Suena de <strong>{midiToName(pitches.lowest)}</strong> a{" "}
                  <strong>{midiToName(pitches.highest)}</strong>, y entra en{" "}
                  <strong>{midiToName(pitches.first)}</strong>.
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="rail-group">
          <h3>Descargar</h3>
          <div className="downloads">
            <button
              type="button"
              className="button"
              onClick={() => download(gabc, "text/plain;charset=utf-8", "gabc")}
            >
              Notación <span className="format">GABC</span>
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                const markup = svgMarkup();
                if (markup) download(markup, "image/svg+xml;charset=utf-8", "svg");
              }}
            >
              Partitura <span className="format">SVG</span>
            </button>
            <button type="button" className="button" onClick={downloadPng}>
              Partitura <span className="format">PNG</span>
            </button>
            <button type="button" className="button" onClick={() => window.print()}>
              Imprimir <span className="format">PDF</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function nextZoom(current: number): number {
  return ZOOM_STEPS[(ZOOM_STEPS.indexOf(current) + 1) % ZOOM_STEPS.length];
}
