"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gabcForRendering } from "@/lib/gabc.mjs";
import {
  absolutePitches,
  clampDo,
  DO_RANGE,
  midiToFrequency,
  midiToName,
  suggestDo,
} from "@/lib/pitch.mjs";

// Exsurge se carga como global desde /vendor/exsurge.js (ver
// scripts/build-exsurge.mjs): su código de 2016 usa imports no relativos que
// el bundler de Next no resuelve.
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

interface ExsurgePitch {
  step: number;
  octave: number;
  toInt: () => number;
}

interface ExsurgeMapping {
  notations?: { isNeume?: boolean; notes?: { pitch: ExsurgePitch | null }[] }[];
}

interface ExsurgeScore {
  mappings: ExsurgeMapping[];
  startingClef: { octave: number } | null;
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
    script.onerror = () => reject(new Error("No se pudo cargar el motor de partituras."));
    document.head.appendChild(script);
  });
  return loader;
}

// Intervalos en semitonos desde el do de la clave, en orden de aparición.
// Es lo único que la notación fija: el tono real lo elige quien dirige.
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

const ZOOM_STEPS = [1, 1.25, 1.6, 2];

export default function ChantScore({ gabc }: { gabc: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rehearsing, setRehearsing] = useState(false);
  const [semitones, setSemitones] = useState<number[] | null>(null);
  const [doMidi, setDoMidi] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const target = surface.current;
    if (!target) return;

    const render = () => {
      const exsurge = window.exsurge;
      if (!exsurge || cancelled || !target) return;

      const ctxt = new exsurge.ChantContext();
      ctxt.lyricTextFont = "var(--font-serif), Palatino, Georgia, serif";
      ctxt.lyricTextSize *= 1.15 * zoom;
      ctxt.dropCapTextFont = ctxt.lyricTextFont;
      ctxt.annotationTextFont = ctxt.lyricTextFont;

      const mappings = exsurge.Gabc.createMappingsFromSource(ctxt, gabcForRendering(gabc));
      const score = new exsurge.ChantScore(ctxt, mappings, true);
      score.performLayout(ctxt);

      // Con zoom el pentagrama crece y se desplaza en horizontal en vez de
      // comprimir los neumas: un director tiene que poder leerlos. Se descuenta
      // el relleno para que la última sílaba no quede cortada.
      const style = getComputedStyle(target);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const width = Math.max(target.clientWidth - padding, 280) * zoom;

      score.layoutChantLines(ctxt, width, () => {
        if (cancelled || !target) return;
        target.innerHTML = score.createSvg(ctxt);
        const read = readSemitones(score);
        setSemitones(read);
        // Cada pieza abre en el tono que la deja centrada en una tesitura
        // coral cómoda; desde ahí se sube o se baja.
        setDoMidi((current) => current ?? suggestDo(read));
      });
    };

    loadExsurge()
      .then(render)
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });

    window.addEventListener("resize", render);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", render);
    };
  }, [gabc, zoom, rehearsing]);

  // El modo ensayo usa pantalla completa nativa, así que hay que seguir los
  // cambios que no vienen de nuestro botón (tecla Escape, gesto del sistema).
  useEffect(() => {
    const sync = () => setRehearsing(document.fullscreenElement === panel.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleRehearsal = useCallback(async () => {
    if (!panel.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await panel.current.requestFullscreen();
    } catch {
      // Algunos navegadores lo deniegan sin gesto del usuario; no es un fallo
      // que merezca interrumpir la lectura de la partitura.
    }
  }, []);

  const pitches = semitones && doMidi !== null ? absolutePitches(semitones, doMidi) : null;

  // Da el tono: suena la primera nota, que es lo que se entona antes de cantar.
  const intone = useCallback(() => {
    if (!pitches) return;
    audio.current ??= new AudioContext();
    const context = audio.current;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = midiToFrequency(pitches.first);

    const now = context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 1.7);
  }, [pitches]);

  const shiftDo = (semitones: number) =>
    setDoMidi((current) => clampDo((current ?? 0) + semitones));

  return (
    <div className="score-panel" ref={panel}>
      <div className="score-toolbar">
        <span className="rubric">Partitura</span>
        <button type="button" onClick={() => setZoom(nextZoom(zoom))}>
          Zoom ×{zoom}
        </button>
        <button type="button" onClick={toggleRehearsal} aria-pressed={rehearsing}>
          {rehearsing ? "Salir del modo ensayo" : "Modo ensayo"}
        </button>
      </div>

      <div
        className="score-surface"
        ref={surface}
        role="img"
        aria-label="Notación cuadrada del canto"
      />

      {pitches && doMidi !== null ? (
        <div className="pitch-bar">
          <div className="pitch-control">
            <span className="rubric">Tono</span>
            <button
              type="button"
              onClick={() => shiftDo(-1)}
              disabled={doMidi <= DO_RANGE.min}
              aria-label="Bajar un semitono"
            >
              −
            </button>
            <output>do = {midiToName(doMidi)}</output>
            <button
              type="button"
              onClick={() => shiftDo(1)}
              disabled={doMidi >= DO_RANGE.max}
              aria-label="Subir un semitono"
            >
              +
            </button>
            <button type="button" onClick={intone}>
              Dar el tono
            </button>
          </div>
          <p className="pitch-range">
            Suena de <strong>{midiToName(pitches.lowest)}</strong> a{" "}
            <strong>{midiToName(pitches.highest)}</strong>, y entra en{" "}
            <strong>{midiToName(pitches.first)}</strong>. La notación gregoriana no fija la altura:
            el dibujo no cambia, lo que cambia es a qué nota real suena el do.
          </p>
        </div>
      ) : null}

      {error ? <p className="notice">{error}</p> : null}
    </div>
  );
}

function nextZoom(current: number): number {
  return ZOOM_STEPS[(ZOOM_STEPS.indexOf(current) + 1) % ZOOM_STEPS.length];
}
