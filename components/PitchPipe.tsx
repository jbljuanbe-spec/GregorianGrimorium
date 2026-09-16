"use client";

import { useCallback, useRef } from "react";
import { clampDo, DO_RANGE, midiToFrequency, midiToName } from "@/lib/pitch.mjs";

const BLACK = new Set([1, 3, 6, 8, 10]);

/**
 * Diapasón: elige a qué nota real suena el do y lo hace sonar.
 *
 * Es el gesto con el que empieza un ensayo —dar el tono— así que va con los
 * controles, no escondido en un menú.
 */
export default function PitchPipe({
  doMidi,
  onChange,
}: {
  doMidi: number;
  onChange: (midi: number) => void;
}) {
  const audio = useRef<AudioContext | null>(null);

  const sound = useCallback((midi: number) => {
    audio.current ??= new AudioContext();
    const context = audio.current;
    void context.resume();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = midiToFrequency(midi);

    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 1.5);
  }, []);

  // Se muestra la octava donde cae el do actual: elegir entre 25 semitonos
  // sería un teclado inmanejable en un panel.
  const base = Math.floor(doMidi / 12) * 12;
  const keys = Array.from({ length: 12 }, (_, step) => base + step).filter(
    (midi) => midi >= DO_RANGE.min && midi <= DO_RANGE.max,
  );

  return (
    <div>
      <div className="pipe-readout">
        <span className="pipe-note">do = {midiToName(doMidi)}</span>
        <span className="pipe-hz">{midiToFrequency(doMidi).toFixed(1)} Hz</span>
      </div>

      <div className="pipe-keys" role="group" aria-label="Elegir el tono del do">
        {keys.map((midi) => (
          <button
            key={midi}
            type="button"
            data-black={BLACK.has(((midi % 12) + 12) % 12)}
            aria-pressed={midi === doMidi}
            aria-label={`do = ${midiToName(midi)}`}
            onClick={() => {
              const next = clampDo(midi);
              onChange(next);
              sound(next);
            }}
          >
            {midiToName(midi).replace(/\d+$/, "")}
          </button>
        ))}
      </div>

      <p className="rail-note">
        La notación no fija la altura: al cambiar el do, el dibujo no cambia; cambia a qué nota
        real suena.
      </p>
    </div>
  );
}
