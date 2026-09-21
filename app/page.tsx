import Link from "next/link";
import ChantSearch from "@/components/ChantSearch";
import { corpusFacets, displayTitle, genres, loadCorpus, modes, type Chant } from "@/lib/corpus";
import { formatCount } from "@/lib/site";

/**
 * La portada de un gradual es su tabla de contenidos.
 *
 * Antes era una landing: titular, propuesta de valor, buscador y media
 * pantalla en blanco, en un sitio que tiene 3.051 piezas que enseñar. Ahora
 * abre por el índice —los géneros del propio, los ocho modos y una muestra
 * real del repertorio—, que es lo que hace un libro de coro. Ver DESIGN.md.
 */
export default function HomePage() {
  const chants = loadCorpus();
  const facets = corpusFacets(chants);
  const byGenre = genres().slice(0, 6);

  return (
    <>
      <section className="hero">
        <h1>El propio de la misa, buscable por dentro</h1>
        <p>
          <strong>{formatCount(chants.length)} transcripciones</strong> con su modo, su edición
          impresa y su página. Busca por íncipit o por{" "}
          <strong>cualquier palabra del texto latino</strong>, ajusta el tono a tu coro y llévate
          la partitura.
        </p>
      </section>

      <ChantSearch facets={facets} total={chants.length} />

      <div className="index-columns">
        <nav className="taxon-group" aria-label="Explorar por género">
          <h2>Propio de la misa</h2>
          <ul className="taxon-grid">
            {byGenre.map((taxon) => (
              <li key={taxon.slug}>
                <Link href={`/generos/${taxon.slug}/`}>
                  {taxon.label}
                  <span className="count">{formatCount(taxon.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="taxon-group" aria-label="Explorar por modo">
          <h2>Los ocho modos</h2>
          <ul className="mode-index">
            {modes().map((taxon) => (
              <li key={taxon.slug}>
                <Link href={`/modos/${taxon.slug}/`}>
                  <span className="mode-numeral">{taxon.label}</span>
                  <span className="count">{formatCount(taxon.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Repertorio de verdad en la portada: una muestra por género, con su
          íncipit y su texto, para que la biblioteca se vea nada más entrar. */}
      <section className="opening">
        <h2>Del repertorio</h2>
        <ul className="entries">
          {sample(chants, byGenre.map((taxon) => taxon.label)).map((chant) => (
            <li key={chant.id}>
              <Link href={`/cantos/${chant.id}/`}>
                <span className="entry-incipit">{displayTitle(chant)}</span>
                <span className="entry-text">{opening(chant.text_latin)}</span>
                <span className="entry-meta">
                  {[chant.genre, chant.mode ? `modo ${chant.mode}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="opening-more">
          <Link href="/explorar/">Ver el índice completo →</Link>
        </p>
      </section>
    </>
  );
}

/**
 * Una pieza por género, la primera de cada uno. Determinista a propósito: el
 * sitio es estático y una portada que cambia sola entre compilaciones sin
 * motivo es ruido, no vida.
 */
function sample(chants: Chant[], wanted: string[]): Chant[] {
  return wanted.flatMap((genre) => {
    const first = chants.find(
      (chant) => chant.genre === genre && chant.text_latin.length > 40,
    );
    return first ? [first] : [];
  });
}

/** Las primeras palabras del texto, para que la fila diga algo. */
function opening(text: string): string {
  const clean = text.replace(/^\s*[℣℟*†]\s*/, "").trim();
  return clean.length <= 78 ? clean : `${clean.slice(0, 77).trimEnd()}…`;
}
