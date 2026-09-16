"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addChant, createRepertoire, type Repertoire } from "@/lib/repertoire.mjs";
import {
  getActiveKey,
  newKey,
  readAll,
  saveRepertoire,
  setActiveKey,
} from "@/lib/repertoire-storage.mjs";

/**
 * Añade la pieza al repertorio activo. Si no hay ninguno, lo crea: un
 * director que llega buscando el introito del domingo no debería tener que
 * pasar por una pantalla de configuración antes de guardar nada.
 */
export default function AddToRepertoire({ chantId }: { chantId: string }) {
  const [repertoires, setRepertoires] = useState<Record<string, Repertoire>>({});
  const [active, setActive] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setRepertoires(readAll());
    setActive(getActiveKey());
  }, []);

  const keys = Object.keys(repertoires);
  const current = active && repertoires[active] ? repertoires[active] : null;
  const alreadyIn = current?.items.some((item) => item.id === chantId) ?? false;

  const add = () => {
    const key = active && repertoires[active] ? active : newKey();
    const base = repertoires[key] ?? createRepertoire("Mi repertorio");
    const updated = addChant(base, chantId);

    saveRepertoire(key, updated);
    setActiveKey(key);
    setRepertoires({ ...repertoires, [key]: updated });
    setActive(key);
    setJustAdded(true);
  };

  return (
    <div className="panel">
      <h2>Repertorio</h2>

      {keys.length > 1 ? (
        <label className="repertoire-picker">
          <span className="rubric">Añadir a</span>
          <select
            value={active ?? ""}
            onChange={(event) => {
              setActive(event.target.value);
              setActiveKey(event.target.value);
              setJustAdded(false);
            }}
          >
            {keys.map((key) => (
              <option key={key} value={key}>
                {repertoires[key].name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {alreadyIn ? (
        <p className="meta-list">
          Ya está en <strong>{current?.name}</strong>.
        </p>
      ) : (
        <button type="button" className="button" onClick={add}>
          Añadir a un repertorio
        </button>
      )}

      {justAdded || alreadyIn ? (
        <p className="meta-list" style={{ marginTop: "0.5rem" }}>
          <Link href="/repertorio/">Abrir el repertorio →</Link>
        </p>
      ) : (
        <p className="pitch-note" style={{ marginTop: "0.5rem" }}>
          Una lista privada de piezas, en el orden de la misa, que puedes anotar, imprimir y
          compartir por enlace.
        </p>
      )}
    </div>
  );
}
