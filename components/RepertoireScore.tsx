"use client";

import { useEffect, useRef, useState } from "react";
import { loadExsurge, renderScore } from "@/lib/exsurge-render";

export interface RepertoireChant {
  id: string;
  incipit: string;
  genre: string;
  mode: string | null;
  gabc: string;
  bibliography: { title: string; page: string | null }[];
}

/** Una pieza dentro del repertorio: partitura y poco más, sin controles. */
export default function RepertoireScore({ chant }: { chant: RepertoireChant }) {
  const surface = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const target = surface.current;
    if (!target) return;

    const draw = () => {
      void renderScore({ gabc: chant.gabc, target });
    };

    loadExsurge()
      .then(draw)
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    window.addEventListener("resize", draw);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", draw);
    };
  }, [chant.gabc]);

  return (
    <div className="sheet">
      <div className="score-surface" ref={surface} role="img" aria-label={`Partitura de ${chant.incipit}`} />
      {failed ? <p className="notice">No se pudo dibujar esta partitura.</p> : null}
    </div>
  );
}
