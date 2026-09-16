import Link from "next/link";
import ChantSearch from "@/components/ChantSearch";
import { corpusFacets, genres, loadCorpus, modes } from "@/lib/corpus";
import { formatCount } from "@/lib/site";

export default function HomePage() {
  const chants = loadCorpus();
  const facets = corpusFacets(chants);

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

      <nav className="taxon-group" aria-label="Explorar por género">
        <h2>O empieza por aquí</h2>
        <ul className="taxon-grid">
          {genres()
            .slice(0, 6)
            .map((taxon) => (
              <li key={taxon.slug}>
                <Link href={`/generos/${taxon.slug}/`}>
                  {taxon.label}
                  <span className="count">{formatCount(taxon.count)}</span>
                </Link>
              </li>
            ))}
          {modes()
            .slice(0, 2)
            .map((taxon) => (
              <li key={taxon.slug}>
                <Link href={`/modos/${taxon.slug}/`}>
                  Modo {taxon.label}
                  <span className="count">{formatCount(taxon.count)}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </>
  );
}
