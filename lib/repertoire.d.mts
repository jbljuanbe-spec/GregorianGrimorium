export interface RepertoireItem {
  id: string;
  note: string;
}

export interface Repertoire {
  version: number;
  name: string;
  items: RepertoireItem[];
}

export const SCHEMA_VERSION: number;
export const LIMITS: { items: number; note: number; name: number };

export function createRepertoire(name?: string): Repertoire;
export function addChant(repertoire: Repertoire, id: string): Repertoire;
export function removeChant(repertoire: Repertoire, index: number): Repertoire;
export function moveChant(repertoire: Repertoire, index: number, offset: number): Repertoire;
export function annotate(repertoire: Repertoire, index: number, note: string): Repertoire;
export function rename(repertoire: Repertoire, name: string): Repertoire;
export function encodeRepertoire(repertoire: Repertoire): string;
export function decodeRepertoire(encoded: string | null): Repertoire | null;
