"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import ChantList, { type ChantListItem } from "@/components/ChantList";
import type { IndexEntry } from "@/lib/corpus";

const PAGE_SIZE = 50;

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .toLowerCase();
}

interface Facets {
  genres: [string, number][];
  modes: [string, number][];
  sources: [string, number][];
}

export default function ChantSearch({ facets, total }: { facets: Facets; total: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [mode, setMode] = useState("");
  const [source, setSource] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // El índice se descarga aparte para que la primera pintada no espere por él.
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

  // "/" enfoca el buscador, como en cualquier herramienta de consulta.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLSelectElement) return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const deferredQuery = useDeferredValue(query);

  // Sin criterio no se lista el corpus entero: 3.000 íncipits seguidos no
  // ayudan a nadie y tapan lo que la web ofrece.
  const hasCriteria = Boolean(deferredQuery.trim() || genre || mode || source);

  const results = useMemo<ChantListItem[]>(() => {
    if (!index || !hasCriteria) return [];
    const terms = fold(deferredQuery).split(/\s+/).filter(Boolean);

    const matches = index.filter((entry) => {
      if (genre && entry.genre !== genre) return false;
      if (mode && entry.mode !== mode) return false;
      if (source && !entry.sources.includes(source)) return false;
      return terms.every((term) => entry.haystack.includes(term));
    });

    // Se agrupan las transcripciones de la misma pieza y se enseña una fila
    // por pieza, con el recuento de versiones.
    const pieces = new Map<string, { entry: IndexEntry; versions: number }>();
    for (const entry of matches) {
      const key = `${fold(entry.incipit)}|${entry.genre}`;
      const piece = pieces.get(key);
      if (piece) piece.versions += 1;
      else pieces.set(key, { entry, versions: 1 });
    }

    return [...pieces.values()].map(({ entry, versions }) => ({
      id: entry.id,
      incipit: entry.incipit,
      mode: entry.mode,
      versions,
      detail: [entry.genre, entry.version, entry.sources[0]].filter(Boolean).join(" · "),
    }));
  }, [index, hasCriteria, deferredQuery, genre, mode, source]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [deferredQuery, genre, mode, source]);

  return (
    <>
      <div className="search-field">
        <input
          ref={input}
          id="buscar"
          className="search-box"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Íncipit o cualquier palabra del texto latino…"
          aria-label="Buscar cantos"
          autoFocus
        />
        <span className="search-hint" aria-hidden="true">
          <kbd>/</kbd>
        </span>
      </div>

      <div className="filters">
        <label>
          <span className="rubric">Género</span>
          <select value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="">Todos</option>
            {facets.genres.map(([name, count]) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rubric">Modo</span>
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="">Todos</option>
            {facets.modes.map(([name, count]) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rubric">Edición</span>
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="">Todas</option>
            {facets.sources.map(([name, count]) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasCriteria ? (
        <div className="result-bar">
          <span>
            {index === null
              ? `Cargando el índice de ${total} cantos…`
              : `${results.length} ${results.length === 1 ? "pieza" : "piezas"}`}
          </span>
          {genre || mode || source ? (
            <button
              type="button"
              className="button button-quiet"
              onClick={() => {
                setGenre("");
                setMode("");
                setSource("");
              }}
            >
              Quitar filtros
            </button>
          ) : null}
        </div>
      ) : null}

      {results.length > 0 ? <ChantList items={results.slice(0, limit)} /> : null}

      {hasCriteria && index !== null && results.length === 0 ? (
        <p className="empty">
          Sin resultados. Prueba con menos palabras o quita algún filtro: el texto sigue la
          ortografía de cada edición, así que «coeli» y «cæli» no siempre coinciden.
        </p>
      ) : null}

      {results.length > limit ? (
        <div className="result-bar">
          <button type="button" className="button" onClick={() => setLimit(limit + PAGE_SIZE)}>
            Mostrar {Math.min(PAGE_SIZE, results.length - limit)} más
          </button>
        </div>
      ) : null}
    </>
  );
}
