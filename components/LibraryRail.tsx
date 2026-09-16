"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { IndexEntry } from "@/lib/corpus";

const MODES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
const SHOWN = 40;

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .toLowerCase();
}

/**
 * Biblioteca siempre a mano: se busca y se filtra sin salir de la pieza que
 * se está viendo, que es como se prepara una misa —saltando de una a otra.
 */
export default function LibraryRail({ currentId }: { currentId?: string }) {
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [mode, setMode] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/search-index.json")
      .then((response) => response.json())
      .then((data: IndexEntry[]) => {
        if (!cancelled) setIndex(data);
      })
      .catch(() => {
        if (!cancelled) setIndex([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deferred = useDeferredValue(query);

  const genres = useMemo(() => {
    if (!index) return [];
    const counts = new Map<string, number>();
    for (const entry of index) counts.set(entry.genre, (counts.get(entry.genre) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [index]);

  const results = useMemo(() => {
    if (!index) return [];
    const terms = fold(deferred).split(/\s+/).filter(Boolean);

    const matches = index.filter((entry) => {
      if (genre && entry.genre !== genre) return false;
      if (mode && entry.mode !== mode) return false;
      return terms.every((term) => entry.haystack.includes(term));
    });

    // Una fila por pieza: el corpus trae varias transcripciones de cada una.
    const pieces = new Map<string, IndexEntry>();
    for (const entry of matches) {
      const key = `${fold(entry.incipit)}|${entry.genre}`;
      if (!pieces.has(key)) pieces.set(key, entry);
    }
    return [...pieces.values()];
  }, [index, deferred, genre, mode]);

  return (
    <aside className="workspace-aside rail-library">
      <h2>Biblioteca</h2>

      <div className="rail-group">
        <input
          type="search"
          className="rail-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Íncipit o texto latino…"
          aria-label="Buscar en la biblioteca"
        />
      </div>

      <div className="rail-group">
        <h3>Modo gregoriano</h3>
        <div className="mode-chips">
          {MODES.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={mode === name}
              onClick={() => setMode(mode === name ? "" : name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="rail-group">
        <h3>Tipo de canto</h3>
        <ul className="rail-list">
          {genres.map(([name, count]) => (
            <li key={name}>
              <button
                type="button"
                className="button button-quiet"
                style={{ width: "100%", justifyContent: "space-between" }}
                aria-pressed={genre === name}
                onClick={() => setGenre(genre === name ? "" : name)}
              >
                <span style={{ color: genre === name ? "var(--rubric)" : undefined }}>{name}</span>
                <span className="detail">{count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rail-group">
        <h3>{query || genre || mode ? `${results.length} piezas` : "Todo el corpus"}</h3>
        <ul className="rail-list">
          {results.slice(0, SHOWN).map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/cantos/${entry.id}/`}
                aria-current={entry.id === currentId ? "page" : undefined}
              >
                <span className="incipit">{entry.incipit}</span>
                <span className="detail">
                  {[entry.genre, entry.mode ? `modo ${entry.mode}` : null].filter(Boolean).join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {index === null ? <p className="rail-note">Cargando la biblioteca…</p> : null}
        {results.length > SHOWN ? (
          <p className="rail-note">
            Y {results.length - SHOWN} más. Afina la búsqueda o{" "}
            <Link href="/">búscalo en la portada</Link>.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
