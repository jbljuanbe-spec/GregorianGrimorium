"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChantPlayer from "@/components/ChantPlayer";
import { gabcForRendering } from "@/lib/gabc.mjs";
import { readPerformance } from "@/lib/performance.mjs";
import { absolutePitches, clampDo, DO_RANGE, midiToName, suggestDo } from "@/lib/pitch.mjs";
import { loadExsurge, renderScore } from "@/lib/exsurge-render";

const ZOOM_STEPS = [1, 1.25, 1.6, 2];

export default function ChantScore({ gabc, filename }: { gabc: string; filename: string }) {
  const sheet = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [rehearsing, setRehearsing] = useState(false);
  const [doMidi, setDoMidi] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Alturas y duraciones salen de la notación, no del dibujo: Exsurge no
  // aplica las alteraciones sueltas ni expone duraciones. Ver
  // lib/performance.mjs y docs/PITCH.md.
  const performance = useMemo(() => readPerformance(gabcForRendering(gabc)), [gabc]);
  const semitones = useMemo(
    () => performance.events.flatMap((event) => (event.kind === "note" ? [event.semitones] : [])),
    [performance],
  );

  useEffect(() => {
    // Cada pieza abre en el tono que la deja centrada en una tesitura coral
    // cómoda; desde ahí se sube o se baja.
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
    context.fillStyle = "#fffdf7";
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

  const shiftDo = (step: number) => setDoMidi((current) => clampDo((current ?? 0) + step));
  const pitches = doMidi !== null ? absolutePitches(semitones, doMidi) : null;

  return (
    <div className="sheet" ref={sheet}>
      <div className="sheet-bar">
        <span className="rubric">Partitura</span>
        <button type="button" className="button" onClick={() => setZoom(nextZoom(zoom))}>
          Zoom ×{zoom}
        </button>
        <button type="button" className="button" onClick={toggleRehearsal} aria-pressed={rehearsing}>
          {rehearsing ? "Salir" : "Modo ensayo"}
        </button>
      </div>

      <div
        className="score-surface"
        ref={surface}
        role="img"
        aria-label="Notación cuadrada del canto"
      />

      {pitches && doMidi !== null ? (
        <div className="pitch">
          <div className="pitch-row">
            <span className="rubric">Tono</span>
            <button
              type="button"
              className="button"
              onClick={() => shiftDo(-1)}
              disabled={doMidi <= DO_RANGE.min}
              aria-label="Bajar un semitono"
            >
              −
            </button>
            <output>do = {midiToName(doMidi)}</output>
            <button
              type="button"
              className="button"
              onClick={() => shiftDo(1)}
              disabled={doMidi >= DO_RANGE.max}
              aria-label="Subir un semitono"
            >
              +
            </button>
          </div>

          <Ambitus lowest={pitches.lowest} highest={pitches.highest} first={pitches.first} />

          <p className="pitch-note">
            La notación gregoriana no fija la altura: el dibujo no cambia, cambia a qué nota real
            suena el do. Entra en <strong>{midiToName(pitches.first)}</strong> y abarca{" "}
            {semitoneLabel(pitches.ambitus)}.
          </p>

          <ChantPlayer events={performance.events} doMidi={doMidi} />
        </div>
      ) : null}

      <div className="pitch">
        <div className="pitch-row">
          <span className="rubric">Descargar</span>
          <button
            type="button"
            className="button"
            onClick={() => download(gabc, "text/plain;charset=utf-8", "gabc")}
          >
            gabc
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              const markup = svgMarkup();
              if (markup) download(markup, "image/svg+xml;charset=utf-8", "svg");
            }}
          >
            SVG
          </button>
          <button type="button" className="button" onClick={downloadPng}>
            PNG
          </button>
          <button type="button" className="button" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </div>

      {error ? <p className="notice">{error}</p> : null}
    </div>
  );
}

/** Dónde cae la pieza en el ámbito vocal, de Fa2 a Do6. */
function Ambitus({ lowest, highest, first }: { lowest: number; highest: number; first: number }) {
  const floor = 41;
  const ceiling = 84;
  const place = (midi: number) => ((midi - floor) / (ceiling - floor)) * 100;

  return (
    <div className="ambitus">
      <div
        className="ambitus-track"
        role="img"
        aria-label={`Tesitura de ${midiToName(lowest)} a ${midiToName(highest)}`}
      >
        <div
          className="ambitus-span"
          style={{ left: `${place(lowest)}%`, width: `${place(highest) - place(lowest)}%` }}
        />
        <div className="ambitus-entry" style={{ left: `${place(first)}%` }} />
      </div>
      <div className="ambitus-scale">
        <span>{midiToName(floor)}</span>
        <span>
          {midiToName(lowest)} – {midiToName(highest)}
        </span>
        <span>{midiToName(ceiling)}</span>
      </div>
    </div>
  );
}

function semitoneLabel(semitones: number): string {
  const names: Record<number, string> = {
    5: "una cuarta",
    7: "una quinta",
    9: "una sexta",
    11: "una séptima",
    12: "una octava",
  };
  return names[semitones] ?? `${semitones} semitonos`;
}

function nextZoom(current: number): number {
  return ZOOM_STEPS[(ZOOM_STEPS.indexOf(current) + 1) % ZOOM_STEPS.length];
}
