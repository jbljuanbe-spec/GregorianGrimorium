export type CheckId =
  | "notacion"
  | "incipit"
  | "texto"
  | "derivado"
  | "modo"
  | "finalis"
  | "ediciones"
  | "procedencia";

export type CheckState = "pass" | "fail" | "skip";

export interface Check {
  id: CheckId;
  state: CheckState;
  /** Qué se ha visto, en una frase, para poder enseñarlo en la ficha. */
  detail: string;
}

export type Grade = "verificado" | "comprobado" | "con-reparos";

export interface Signature {
  /** Quién firma la revisión. */
  by: string;
  /** Fecha ISO (YYYY-MM-DD) en que se cotejó. */
  date: string;
  /** Contra qué se cotejó, y cualquier salvedad. */
  note?: string;
}

export interface Audit {
  grade: Grade;
  checks: Check[];
  failed: Check[];
  passed: number;
  applicable: number;
  signedOff: Signature | null;
}

export interface AuditedChant extends Audit {
  id: string;
}

interface Auditable {
  id: string;
  incipit: string;
  genre: string;
  mode?: string | null;
  text_latin: string;
  gabc: string;
  bibliography?: { title: string; page?: string | null }[];
  provenance?: Record<string, unknown>;
}

export const CHECKS: Record<CheckId, string>;
export const DEGREE_NAMES: Record<number, string>;
export const MODES: Record<string, { finalis: number; affinals: number[] }>;
export const GRADES: Record<Grade, { label: string; blurb: string }>;

export function auditChant(
  chant: Auditable,
  options?: { siblings?: Auditable[]; signedOff?: Signature | null },
): Audit;

export function auditCorpus(
  chants: Auditable[],
  signatures?: Record<string, Signature>,
): AuditedChant[];

export function pieceKey(chant: Auditable): string;
