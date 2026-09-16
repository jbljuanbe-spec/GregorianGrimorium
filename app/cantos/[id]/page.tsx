import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChantScore from "@/components/ChantScore";
import { getChant, getOtherVersions, loadCorpus, type Chant } from "@/lib/corpus";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return loadCorpus().map((chant) => ({ id: chant.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const chant = getChant(id);
  if (!chant) return {};

  const descriptors = [chant.genre, chant.mode ? `modo ${chant.mode}` : null].filter(Boolean).join(", ");
  const description = `${chant.incipit} — ${descriptors}. Texto latino y partitura en notación cuadrada. ${truncate(chant.text_latin, 100)}`;
  const path = `/cantos/${chant.id}/`;

  return {
    title: chant.incipit,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: `${chant.incipit} — ${descriptors}`,
      description,
      siteName: SITE_NAME,
    },
  };
}

export default async function ChantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chant = getChant(id);
  if (!chant) notFound();

  const reviewed = chant.review_status === "verified";
  const otherVersions = getOtherVersions(chant);

  return (
    <article>
      <script
        type="application/ld+json"
        // Datos estructurados: permiten que un buscador entienda que la página
        // es una obra musical con su texto, su modo y su fuente impresa.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(chant)) }}
      />

      <nav className="breadcrumb">
        <Link href="/">← Todos los cantos</Link>
      </nav>

      <header className="chant-header">
        <h1>{chant.incipit}</h1>
        <div className="chant-meta">
          <span className="rubric">{chant.genre}</span>
          {chant.mode ? <span>Modo {chant.mode}</span> : null}
          {chant.mode_variant ? <span>{chant.mode_variant}</span> : null}
          {chant.version ? <span>Versión {chant.version}</span> : null}
          <span className="badge">{reviewed ? "Revisado" : "Sin revisar"}</span>
        </div>
      </header>

      <ChantScore gabc={chant.gabc} />

      <section className="section">
        <h2>Texto latino</h2>
        <p className="latin-text">{chant.text_latin}</p>
      </section>

      {chant.bibliography.length > 0 ? (
        <section className="section">
          <h2>Ediciones impresas</h2>
          <ul className="references">
            {chant.bibliography.map((reference, position) => (
              <li key={`${reference.title}-${reference.page}-${position}`}>
                {reference.title}
                {reference.year ? `, ${reference.year}` : ""}
                {reference.editor ? ` · ${reference.editor}` : ""}
                {reference.page ? <span className="page"> — p. {reference.page}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {otherVersions.length > 0 ? (
        <section className="section">
          <h2>Otras versiones de esta pieza</h2>
          <ul className="references">
            {otherVersions.map((other) => (
              <li key={other.id}>
                <Link href={`/cantos/${other.id}/`}>
                  {[
                    other.version ?? "Sin versión declarada",
                    other.mode ? `modo ${other.mode}` : null,
                    other.bibliography[0]?.title,
                    other.bibliography[0]?.page ? `p. ${other.bibliography[0].page}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {chant.liturgical_occurrences.length > 0 ? (
        <section className="section">
          <h2>Uso litúrgico</h2>
          <ul className="references">
            {chant.liturgical_occurrences.map((occurrence) => (
              <li key={occurrence.celebration}>
                {occurrence.celebration} <span className="provenance">({occurrence.calendar})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="section">
        <h2>Procedencia</h2>
        <p className="provenance">
          Origen: {chant.provenance.origin}
          {chant.provenance.external_id ? ` #${chant.provenance.external_id}` : ""} · Licencia:{" "}
          {chant.provenance.license}
          {chant.provenance.snapshot ? ` · Volcado: ${chant.provenance.snapshot}` : ""}
          {chant.transcriber ? ` · Transcripción: ${chant.transcriber}` : ""}
        </p>
        {chant.cantus_id ? (
          <p className="provenance">
            Cantus ID:{" "}
            <a href={`https://cantusindex.org/id/${chant.cantus_id}`} rel="noreferrer">
              {chant.cantus_id}
            </a>
          </p>
        ) : null}
        {chant.commentary ? <p className="provenance">Nota de la fuente: {chant.commentary}</p> : null}
        {reviewed ? null : (
          <p className="notice">
            Esta ficha viene de una importación automática y aún no ha pasado revisión humana. El
            texto y el modo pueden contener errores heredados de la fuente.
          </p>
        )}
      </section>
    </article>
  );
}

function structuredData(chant: Chant) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: chant.incipit,
    url: `${SITE_URL}/cantos/${chant.id}/`,
    inLanguage: "la",
    musicalKey: chant.mode ? `Modo ${chant.mode}` : undefined,
    genre: chant.genre,
    lyrics: { "@type": "CreativeWork", text: chant.text_latin },
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    isPartOf: { "@type": "Collection", name: SITE_NAME, url: `${SITE_URL}/` },
    citation: chant.bibliography.map((reference) =>
      [reference.title, reference.year, reference.page ? `p. ${reference.page}` : null]
        .filter(Boolean)
        .join(", "),
    ),
  };
}

function truncate(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1).trimEnd()}…`;
}
