export const DEFAULT_DO: number;
export const DO_RANGE: { min: number; max: number };
export function midiToName(midi: number): string;
export function midiToFrequency(midi: number): number;
export function absolutePitches(
  semitonesFromDo: number[],
  doMidi: number,
): { first: number; lowest: number; highest: number; ambitus: number } | null;
export function suggestDo(semitonesFromDo: number[], center?: number): number;
export function clampDo(doMidi: number): number;
