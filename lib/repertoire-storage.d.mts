import type { Repertoire } from "@/lib/repertoire.mjs";

export function readAll(): Record<string, Repertoire>;
export function saveRepertoire(key: string, repertoire: Repertoire): void;
export function removeRepertoire(key: string): void;
export function getActiveKey(): string | null;
export function setActiveKey(key: string | null): void;
export function newKey(): string;
