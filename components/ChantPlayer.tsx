"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { midiToFrequency } from "@/lib/pitch.mjs";
import { buildTimeline, indexAtBeat, type PerformanceEvent } from "@/lib/performance.mjs";

/** Duración del pulso. El canto es de ritmo libre; esto marca su paso. */
const SECONDS_PER_BEAT = 0.4;

type State = "stopped" | "playing" | "paused";

/**
 * Reproduce la pieza en el tono elegido, con las duraciones que la notación
 * escribe, y se puede parar y seguir por el mismo sitio.
 *
 * Una sola voz que va cambiando de altura: el canto es monódico y ligado.
 */
export default function ChantPlayer({
  events,
  doMidi,
}: {
  events: PerformanceEvent[];
  doMidi: number;
}) {
  const audio = useRef<AudioContext | null>(null);
  const voice = useRef<{ oscillator: OscillatorNode; gain: GainNode } | null>(null);
  const anchor = useRef<{ startedAt: number; fromBeat: number } | null>(null);
  const frame = useRef<number | null>(null);

  const [state, setState] = useState<State>("stopped");
  const [beat, setBeat] = useState(0);

  const { timeline, totalBeats } = useMemo(() => buildTimeline(events), [events]);

  const silence = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;

    const context = audio.current;
    if (voice.current && context) {
      const { oscillator, gain } = voice.current;
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.04);
      oscillator.stop(now + 0.07);
      voice.current = null;
    }
  }, []);

  // Al cambiar de pieza o de tono se corta: lo que sonaba ya no corresponde.
  useEffect(() => {
    silence();
    anchor.current = null;
    setState("stopped");
    setBeat(0);
  }, [events, doMidi, silence]);

  useEffect(() => silence, [silence]);

  const playFrom = useCallback(
    (fromBeat: number) => {
      if (!timeline.length) return;
      silence();

      audio.current ??= new AudioContext();
      const context = audio.current;
      void context.resume();

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      gain.gain.setValueAtTime(0.0001, context.currentTime);

      const startedAt = context.currentTime + 0.06;
      const from = indexAtBeat(timeline, fromBeat);

      for (const entry of timeline.slice(from)) {
        const at = startedAt + (entry.at - fromBeat) * SECONDS_PER_BEAT;
        const seconds = entry.beats * SECONDS_PER_BEAT;

        if (entry.kind === "rest") {
          // El silencio es parte de la pieza: es la respiración.
          gain.gain.setValueAtTime(0.0001, at);
          continue;
        }

        oscillator.frequency.setValueAtTime(midiToFrequency(doMidi + entry.semitones), at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.linearRampToValueAtTime(0.2, at + 0.025);
        gain.gain.setValueAtTime(0.2, Math.max(at + 0.03, at + seconds - 0.055));
        gain.gain.linearRampToValueAtTime(0.03, at + seconds - 0.01);
      }

      const ends = startedAt + (totalBeats - fromBeat) * SECONDS_PER_BEAT;
      gain.gain.linearRampToValueAtTime(0, ends + 0.08);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startedAt);
      oscillator.stop(ends + 0.15);

      voice.current = { oscillator, gain };
      anchor.current = { startedAt, fromBeat };
      setState("playing");

      const follow = () => {
        const current = anchor.current;
        if (!current || !audio.current) return;
        const elapsed = (audio.current.currentTime - current.startedAt) / SECONDS_PER_BEAT;
        const position = current.fromBeat + Math.max(0, elapsed);

        if (position >= totalBeats) {
          setBeat(0);
          anchor.current = null;
          setState("stopped");
          return;
        }
        setBeat(position);
        frame.current = requestAnimationFrame(follow);
      };
      frame.current = requestAnimationFrame(follow);
    },
    [doMidi, silence, timeline, totalBeats],
  );

  const pause = useCallback(() => {
    const current = anchor.current;
    const context = audio.current;
    if (current && context) {
      const elapsed = (context.currentTime - current.startedAt) / SECONDS_PER_BEAT;
      setBeat(current.fromBeat + Math.max(0, elapsed));
    }
    silence();
    anchor.current = null;
    setState("paused");
  }, [silence]);

  if (!timeline.length) return null;

  const index = indexAtBeat(timeline, beat);
  const notes = timeline.filter((entry) => entry.kind === "note").length;
  const notesPlayed = timeline.slice(0, index + 1).filter((entry) => entry.kind === "note").length;

  return (
    <div className="player">
      <div className="player-row">
        <span className="rubric">Escuchar</span>

        <button
          type="button"
          className="button"
          onClick={() => (state === "playing" ? pause() : playFrom(state === "paused" ? beat : 0))}
        >
          {state === "playing" ? "Pausa" : state === "paused" ? "Seguir" : "Reproducir"}
        </button>

        <button
          type="button"
          className="button"
          onClick={() => {
            // Dar el tono: solo la nota de entrada, que es lo que se entona
            // antes de empezar a cantar.
            const first = timeline.find((entry) => entry.kind === "note");
            if (!first || first.kind !== "note") return;
            silence();
            audio.current ??= new AudioContext();
            const context = audio.current;
            void context.resume();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = "triangle";
            oscillator.frequency.value = midiToFrequency(doMidi + first.semitones);
            const now = context.currentTime;
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
            oscillator.connect(gain).connect(context.destination);
            oscillator.start(now);
            oscillator.stop(now + 1.6);
            voice.current = { oscillator, gain };
            anchor.current = null;
            setState("stopped");
          }}
        >
          Dar el tono
        </button>

        {state !== "stopped" ? (
          <button
            type="button"
            className="button button-quiet"
            onClick={() => {
              silence();
              anchor.current = null;
              setBeat(0);
              setState("stopped");
            }}
          >
            Al principio
          </button>
        ) : null}

        <span className="player-count">
          {state === "stopped" ? `${notes} notas` : `nota ${notesPlayed} de ${notes}`}
        </span>
      </div>

      <div
        className="player-track"
        role="progressbar"
        aria-label="Avance de la pieza"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalBeats)}
        aria-valuenow={Math.round(beat)}
      >
        <div className="player-fill" style={{ width: `${(beat / totalBeats) * 100}%` }} />
      </div>
    </div>
  );
}
