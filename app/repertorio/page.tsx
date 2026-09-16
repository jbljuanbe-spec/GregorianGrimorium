"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import RepertoireScore, { type RepertoireChant } from "@/components/RepertoireScore";
import {
  annotate,
  createRepertoire,
  decodeRepertoire,
  encodeRepertoire,
  moveChant,
  removeChant,
  rename,
  type Repertoire,
} from "@/lib/repertoire.mjs";
import {
  getActiveKey,
  newKey,
  readAll,
  removeRepertoire,
  saveRepertoire,
  setActiveKey,
} from "@/lib/repertoire-storage.mjs";

export default function RepertoirePage() {
  const [repertoires, setRepertoires] = useState<Record<string, Repertoire>>({});
  const [key, setKey] = useState<string | null>(null);
  const [shared, setShared] = useState<Repertoire | null>(null);
  const [chants, setChants] = useState<Record<string, RepertoireChant>>({});
  const [copied, setCopied] = useState(false);

  // Un enlace compartido llega en el fragmento de la URL, que no viaja al
  // servidor: el repertorio de otra persona no se registra en ningún sitio.
  useEffect(() => {
    const fromLink = decodeRepertoire(window.location.hash.replace(/^#r=/, "") || null);
    if (fromLink) setShared(fromLink);
    setRepertoires(readAll());
    setKey(getActiveKey());
  }, []);

  const repertoire = shared ?? (key ? repertoires[key] : null) ?? null;

  // Los datos de cada pieza se piden uno a uno a la API estática, para no
  // cargar el corpus entero por abrir un repertorio de cinco cantos.
  useEffect(() => {
    if (!repertoire) return;
    let cancelled = false;

    for (const item of repertoire.items) {
      if (chants[item.id]) continue;
      fetch(`/chants/${item.id}.json`)
        .then((response) => (response.ok ? response.json() : null))
        .then((chant: RepertoireChant | null) => {
          if (chant && !cancelled) setChants((current) => ({ ...current, [chant.id]: chant }));
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [repertoire, chants]);

  const update = useCallback(
    (next: Repertoire) => {
      if (shared) {
        setShared(next);
        return;
      }
      if (!key) return;
      saveRepertoire(key, next);
      setRepertoires((current) => ({ ...current, [key]: next }));
    },
    [key, shared],
  );

  const shareUrl = useMemo(() => {
    if (!repertoire || typeof window === "undefined") return "";
    return `${window.location.origin}/repertorio/#r=${encodeRepertoire(repertoire)}`;
  }, [repertoire]);

  const create = () => {
    const created = newKey();
    const fresh = createRepertoire("Misa del domingo");
    saveRepertoire(created, fresh);
    setActiveKey(created);
    setRepertoires((current) => ({ ...current, [created]: fresh }));
    setKey(created);
    setShared(null);
    window.location.hash = "";
  };

  const keepCopy = () => {
    if (!shared) return;
    const created = newKey();
    saveRepertoire(created, shared);
    setActiveKey(created);
    setRepertoires((current) => ({ ...current, [created]: shared }));
    setKey(created);
    setShared(null);
    window.location.hash = "";
  };

  const keys = Object.keys(repertoires);

  return (
    <>
      <section className="hero">
        <p className="rubric">Repertorio</p>
        <h1>{repertoire ? repertoire.name : "Aún no hay repertorios"}</h1>
        <p>
          Una lista privada de piezas en el orden de la misa. Vive en este navegador; para pasarla
          al coro se comparte con un enlace, sin que nadie tenga que registrarse.
        </p>
      </section>

      <div className="repertoire-bar">
        {keys.length > 0 && !shared ? (
          <label className="repertoire-picker">
            <span className="rubric">Abrir</span>
            <select
              value={key ?? ""}
              onChange={(event) => {
                setKey(event.target.value);
                setActiveKey(event.target.value);
              }}
            >
              {keys.map((entry) => (
                <option key={entry} value={entry}>
                  {repertoires[entry].name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button type="button" className="button" onClick={create}>
          Nuevo repertorio
        </button>

        {shared ? (
          <button type="button" className="button" onClick={keepCopy}>
            Guardar una copia
          </button>
        ) : null}

        {repertoire && repertoire.items.length > 0 ? (
          <>
            <button
              type="button"
              className="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Enlace copiado" : "Copiar enlace para el coro"}
            </button>
            <button type="button" className="button" onClick={() => window.print()}>
              Imprimir todo
            </button>
          </>
        ) : null}

        {repertoire && !shared ? (
          <button
            type="button"
            className="button button-quiet"
            onClick={() => {
              if (!key) return;
              removeRepertoire(key);
              const remaining = { ...repertoires };
              delete remaining[key];
              setRepertoires(remaining);
              setKey(Object.keys(remaining)[0] ?? null);
            }}
          >
            Borrar este repertorio
          </button>
        ) : null}
      </div>

      {shared ? (
        <p className="notice">
          Estás viendo un repertorio compartido. Puedes cambiarlo aquí sin afectar al original;
          guarda una copia si quieres conservarlo en este navegador.
        </p>
      ) : null}

      {!repertoire ? (
        <p className="empty">
          Crea uno y ve añadiendo piezas desde su ficha, con el botón «Añadir a un repertorio».{" "}
          <Link href="/">Buscar cantos →</Link>
        </p>
      ) : null}

      {repertoire && !shared ? (
        <label className="repertoire-name">
          <span className="rubric">Nombre</span>
          <input
            type="text"
            className="search-box"
            value={repertoire.name}
            onChange={(event) => update(rename(repertoire, event.target.value))}
            aria-label="Nombre del repertorio"
          />
        </label>
      ) : null}

      {repertoire && repertoire.items.length === 0 ? (
        <p className="empty">
          Este repertorio está vacío. <Link href="/">Busca una pieza</Link> y añádela desde su
          ficha.
        </p>
      ) : null}

      <ol className="repertoire-items">
        {repertoire?.items.map((item, position) => {
          const chant = chants[item.id];
          return (
            <li key={item.id}>
              <div className="repertoire-head">
                <span className="repertoire-order">{position + 1}</span>
                <div>
                  <Link href={`/cantos/${item.id}/`} className="incipit">
                    {chant ? chant.incipit : item.id}
                  </Link>
                  <span className="detail">
                    {chant
                      ? [chant.genre, chant.mode ? `modo ${chant.mode}` : null, chant.bibliography[0]?.title]
                          .filter(Boolean)
                          .join(" · ")
                      : "Cargando…"}
                  </span>
                </div>
                <div className="repertoire-actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => update(moveChant(repertoire, position, -1))}
                    disabled={position === 0}
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={() => update(moveChant(repertoire, position, 1))}
                    disabled={position === repertoire.items.length - 1}
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => update(removeChant(repertoire, position))}
                    aria-label="Quitar del repertorio"
                  >
                    Quitar
                  </button>
                </div>
              </div>

              <input
                type="text"
                className="repertoire-note"
                value={item.note}
                placeholder="Anotación para el coro: tono, versos, quién canta…"
                onChange={(event) => update(annotate(repertoire, position, event.target.value))}
                aria-label={`Anotación para ${chant?.incipit ?? item.id}`}
              />

              {chant ? <RepertoireScore chant={chant} /> : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}
