"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { IndexEntry } from "@/lib/corpus";

const PAGE_SIZE = 60;

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

  const deferredQuery = useDeferredValue(query);

  // Sin criterio no se lista el corpus entero: 3.054 íncipits seguidos, muchos
  // casi idénticos, no ayudan a nadie y tapan lo que la web ofrece.
  const hasCriteria = Boolean(deferredQuery.trim() || genre || mode || source);

  const results = useMemo(() => {
    if (!index || !hasCriteria) return [];
    const terms = fold(deferredQuery).split(/\s+/).filter(Boolean);
    return index.filter((entry) => {
      if (genre && entry.genre !== genre) return false;
      if (mode && entry.mode !== mode) return false;
      if (source && !entry.sources.includes(source)) return false;
      return terms.every((term) => entry.haystack.includes(term));
    });
  }, [index, hasCriteria, deferredQuery, genre, mode, source]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [deferredQuery, genre, mode, source]);

  return (
    <>
      <div className="search-field">
        <input
          className="search-box"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busca por íncipit o por cualquier palabra del texto latino…"
          aria-label="Buscar cantos"
          autoFocus
        />
      </div>

      <div className="filters">
        <label>
          Género
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
          Modo
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
          Edición
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
        <p className="result-count">
          {index === null
            ? `Cargando el índice de ${total} cantos…`
            : `${results.length} de ${total} cantos`}
        </p>
      ) : null}

      <ul className="results">
        {results.slice(0, limit).map((entry) => (
          <li key={entry.id}>
            <Link href={`/cantos/${entry.id}/`}>
              <span className="incipit">{entry.incipit}</span>
              <span className="meta">
                {[
                  entry.genre,
                  entry.mode ? `modo ${entry.mode}` : null,
                  entry.version,
                  entry.sources[0],
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {hasCriteria && index !== null && results.length === 0 ? (
        <p className="empty">
          Sin resultados. Prueba con menos palabras, o quita algún filtro: el texto latino usa la
          ortografía de la edición, así que «coeli» y «cæli» pueden no coincidir.
        </p>
      ) : null}

      {results.length > limit ? (
        <p className="result-count">
          <button type="button" onClick={() => setLimit(limit + PAGE_SIZE)}>
            Mostrar más
          </button>
        </p>
      ) : null}
    </>
  );
}
