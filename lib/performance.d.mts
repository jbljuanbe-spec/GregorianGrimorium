export interface PerformanceNote {
  kind: "note";
  semitones: number;
  beats: number;
}

export interface PerformanceRest {
  kind: "rest";
  beats: number;
}

export type PerformanceEvent = PerformanceNote | PerformanceRest;

export const BEATS: Record<string, number>;
export const RESTS: Record<string, number>;

export function readPerformance(body: string): { events: PerformanceEvent[]; clef: string };
export function buildTimeline(events: PerformanceEvent[]): {
  timeline: (PerformanceEvent & { at: number })[];
  totalBeats: number;
};
export function indexAtBeat(timeline: { at: number }[], beat: number): number;
