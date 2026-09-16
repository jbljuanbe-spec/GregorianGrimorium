import type { Metadata } from "next";
import Link from "next/link";
import { editions, genres, modes } from "@/lib/corpus";
import { formatCount } from "@/lib/site";

export const metadata: Metadata = {
  title: "Explorar el corpus",
  description:
    "Recorre el corpus por género (introitos, graduales, aleluyas…), por modo gregoriano o por la edición impresa en la que aparece cada pieza.",
  alternates: { canonical: "/explorar/" },
};

export default function ExplorarPage() {
  return (
    <>
      <section className="hero">
        <h1>Explorar el corpus</h1>
        <p>
          Tres formas de entrar sin saber de antemano qué buscas: por el momento de la misa, por
          el modo, o por el libro que tengas delante.
        </p>
      </section>

      <div className="taxon-group">
        <h2>Por género</h2>
        <ul className="taxon-grid">
          {genres().map((taxon) => (
            <li key={taxon.slug}>
              <Link href={`/generos/${taxon.slug}/`}>
                {taxon.label}
                <span className="count">{formatCount(taxon.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="taxon-group">
        <h2>Por modo</h2>
        <ul className="taxon-grid">
          {modes().map((taxon) => (
            <li key={taxon.slug}>
              <Link href={`/modos/${taxon.slug}/`}>
                Modo {taxon.label}
                <span className="count">{formatCount(taxon.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="taxon-group">
        <h2>Por edición impresa</h2>
        <ul className="taxon-grid">
          {editions().map((taxon) => (
            <li key={taxon.slug}>
              <Link href={`/ediciones/${taxon.slug}/`}>
                {taxon.label}
                <span className="count">{formatCount(taxon.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
