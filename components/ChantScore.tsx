"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gabcForRendering } from "@/lib/gabc.mjs";
import { absolutePitches, clampDo, DO_RANGE, midiToFrequency, midiToName, suggestDo } from "@/lib/pitch.mjs";

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

// Intervalos en semitonos desde el do de la clave, en orden de aparición. Es
// lo único que la notación fija: el tono real lo elige quien dirige.
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
/** El canto es de ritmo libre; se toca a pulso regular, sin inventar duraciones. */
const NOTE_SECONDS = 0.42;

export default function ChantScore({ gabc, filename }: { gabc: string; filename: string }) {
  const sheet = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const voice = useRef<{ oscillator: OscillatorNode; gain: GainNode } | null>(null);
  const timer = useRef<number | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rehearsing, setRehearsing] = useState(false);
  const [playing, setPlaying] = useState(false);
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
      ctxt.lyricTextFont = "var(--font-chant), Georgia, serif";
      ctxt.lyricTextSize *= 1.15 * zoom;
      ctxt.dropCapTextFont = ctxt.lyricTextFont;
      ctxt.annotationTextFont = ctxt.lyricTextFont;

      const mappings = exsurge.Gabc.createMappingsFromSource(ctxt, gabcForRendering(gabc));
      const score = new exsurge.ChantScore(ctxt, mappings, true);
      score.performLayout(ctxt);

      // Con zoom el pentagrama crece y se desplaza en horizontal en vez de
      // comprimir los neumas: un director tiene que poder leerlos.
      const style = getComputedStyle(target);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const width = Math.max(target.clientWidth - padding, 280) * zoom;

      score.layoutChantLines(ctxt, width, () => {
        if (cancelled || !target) return;
        target.innerHTML = score.createSvg(ctxt);
        const read = readSemitones(score);
        setSemitones(read);
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

  useEffect(() => {
    const sync = () => setRehearsing(document.fullscreenElement === sheet.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    if (voice.current) {
      const { oscillator, gain } = voice.current;
      const now = audio.current?.currentTime ?? 0;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      oscillator.stop(now + 0.08);
      voice.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => stop, [stop]);

  const pitches = semitones && doMidi !== null ? absolutePitches(semitones, doMidi) : null;

  /**
   * Toca la melodía en el tono elegido. Una sola voz que va cambiando de
   * altura: el canto es monódico y ligado, así que suena más fiel que una
   * nota suelta por neuma.
   */
  const play = useCallback(
    (notes: number[]) => {
      if (!notes.length) return;
      stop();

      audio.current ??= new AudioContext();
      const context = audio.current;
      void context.resume();

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";

      const start = context.currentTime + 0.05;
      const total = notes.length * NOTE_SECONDS;

      notes.forEach((midi, position) => {
        const at = start + position * NOTE_SECONDS;
        oscillator.frequency.setValueAtTime(midiToFrequency(midi), at);
        // Pequeña articulación entre notas, para que no sea un glissando.
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.linearRampToValueAtTime(0.2, at + 0.03);
        gain.gain.setValueAtTime(0.2, at + NOTE_SECONDS - 0.06);
        gain.gain.linearRampToValueAtTime(0.04, at + NOTE_SECONDS - 0.01);
      });

      gain.gain.linearRampToValueAtTime(0, start + total + 0.1);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + total + 0.2);

      voice.current = { oscillator, gain };
      setPlaying(true);
      timer.current = window.setTimeout(() => {
        voice.current = null;
        setPlaying(false);
      }, (total + 0.3) * 1000);
    },
    [stop],
  );

  const download = useCallback((data: BlobPart, type: string, extension: string) => {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filename]);

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

  return (
    <div className="sheet" ref={sheet}>
      <div className="sheet-bar">
        <span className="rubric">Partitura</span>

        {pitches ? (
          <button
            type="button"
            className="button"
            onClick={() => (playing ? stop() : play(semitones!.map((s) => doMidi! + s)))}
          >
            {playing ? "Detener" : "Escuchar"}
          </button>
        ) : null}

        <button type="button" className="button" onClick={() => setZoom(nextZoom(zoom))}>
          Zoom ×{zoom}
        </button>
        <button type="button" className="button" onClick={toggleRehearsal} aria-pressed={rehearsing}>
          {rehearsing ? "Salir" : "Modo ensayo"}
        </button>
      </div>

      <div className="score-surface" ref={surface} role="img" aria-label="Notación cuadrada del canto" />

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
            <button type="button" className="button" onClick={() => play([pitches.first])}>
              Dar el tono
            </button>
          </div>

          <Ambitus lowest={pitches.lowest} highest={pitches.highest} first={pitches.first} />

          <p className="pitch-note">
            La notación gregoriana no fija la altura: el dibujo no cambia, cambia a qué nota real
            suena el do. Entra en <strong>{midiToName(pitches.first)}</strong> y abarca{" "}
            {semitoneLabel(pitches.ambitus)}.
          </p>
        </div>
      ) : null}

      <div className="pitch">
        <div className="pitch-row">
          <span className="rubric">Descargar</span>
          <button type="button" className="button" onClick={() => download(gabc, "text/plain;charset=utf-8", "gabc")}>
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
