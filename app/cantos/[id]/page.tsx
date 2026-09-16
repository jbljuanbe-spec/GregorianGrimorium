import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToRepertoire from "@/components/AddToRepertoire";
import ChantWorkspace from "@/components/ChantWorkspace";
import LibraryRail from "@/components/LibraryRail";
import {
  getChant,
  getOtherVersions,
  loadCorpus,
  neighbours,
  toSlug,
  type Chant,
} from "@/lib/corpus";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return loadCorpus().map((chant) => ({ id: chant.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const chant = getChant(id);
  if (!chant) return {};

  const descriptors = [chant.genre, chant.mode ? `modo ${chant.mode}` : null].filter(Boolean).join(", ");
  const description = `${chant.incipit} — ${descriptors}. Texto latino, partitura en notación cuadrada y tono ajustable. ${truncate(chant.text_latin, 90)}`;
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
  const { previous, next } = neighbours(chant);
  const genreSlug = toSlug(chant.genre);

  const header = (
    <header className="chant-header">
      <div className="chant-top">
        <Link href={`/generos/${genreSlug}/`}>← {chant.genre}</Link>
        <div className="step-links">
          {previous ? <Link href={`/cantos/${previous.id}/`}>← {previous.incipit}</Link> : null}
          {next ? <Link href={`/cantos/${next.id}/`}>{next.incipit} →</Link> : null}
        </div>
      </div>

      <h1>{chant.incipit}</h1>

      <div className="chant-chips">
        <Link href={`/generos/${genreSlug}/`} className="is-rubric">
          {chant.genre}
        </Link>
        {chant.mode ? <Link href={`/modos/${toSlug(chant.mode)}/`}>modo {chant.mode}</Link> : null}
        {chant.mode_variant ? <span>{chant.mode_variant}</span> : null}
        {chant.version ? <span>Versión {chant.version}</span> : null}
        <span>{reviewed ? "Revisado" : "Sin revisar"}</span>
      </div>
    </header>
  );

  return (
    <article className="workspace">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(chant)) }}
      />

      <LibraryRail currentId={chant.id} />

      <ChantWorkspace gabc={chant.gabc} filename={chant.id} header={header}>
        {chant.repeat_indication || chant.psalm_tone_ending ? (
          <p className="performance">
            <span className="rubric">Ejecución</span>
            {chant.repeat_indication ? (
              <span>
                Se repite {chant.repeat_indication === "iij" ? "tres veces" : "dos veces"} (
                {chant.repeat_indication}.)
              </span>
            ) : null}
            {chant.psalm_tone_ending ? (
              <span>Termina con la fórmula salmódica «E u o u a e»</span>
            ) : null}
          </p>
        ) : null}

        <div className="block">
          <h2>Texto latino</h2>
          <p className="latin-text">{chant.text_latin}</p>
        </div>

        {otherVersions.length > 0 ? (
          <div className="block">
            <h2>Otras versiones de esta pieza</h2>
            <ul className="refs">
              {otherVersions.map((other) => (
                <li key={other.id}>
                  <Link href={`/cantos/${other.id}/`}>
                    {[other.version ?? "Sin versión declarada", other.bibliography[0]?.title]
                      .filter(Boolean)
                      .join(" · ")}
                    {other.bibliography[0]?.page ? (
                      <span className="page"> p. {other.bibliography[0].page}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {reviewed ? null : (
          <p className="notice">
            Ficha de importación automática, aún sin revisión humana: el texto o el modo pueden
            arrastrar errores de la fuente.
          </p>
        )}

        <div className="chant-refs">
          <AddToRepertoire chantId={chant.id} />

          {chant.bibliography.length > 0 ? (
            <div className="panel">
              <h2>Ediciones impresas</h2>
              <ul className="refs">
                {chant.bibliography.map((reference, position) => (
                  <li key={`${reference.title}-${reference.page}-${position}`}>
                    <Link href={`/ediciones/${toSlug(reference.title)}/`}>{reference.title}</Link>
                    {reference.year ? `, ${reference.year}` : ""}
                    {reference.page ? <span className="page"> — p. {reference.page}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {chant.liturgical_occurrences.length > 0 ? (
            <div className="panel">
              <h2>Uso litúrgico</h2>
              <ul className="refs">
                {chant.liturgical_occurrences.map((occurrence) => (
                  <li key={occurrence.celebration}>{occurrence.celebration}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="panel">
            <h2>Procedencia</h2>
            <dl className="meta-list">
              <div>
                <dt>Fuente</dt>
                <dd>
                  {chant.provenance.origin}
                  {chant.provenance.external_id ? ` #${chant.provenance.external_id}` : ""}
                </dd>
              </div>
              <div>
                <dt>Licencia</dt>
                <dd>{chant.provenance.license}</dd>
              </div>
              {chant.transcriber ? (
                <div>
                  <dt>Transcripción</dt>
                  <dd>{chant.transcriber}</dd>
                </div>
              ) : null}
              {chant.cantus_id ? (
                <div>
                  <dt>Cantus ID</dt>
                  <dd>
                    <a href={`https://cantusindex.org/id/${chant.cantus_id}`} rel="noreferrer">
                      {chant.cantus_id}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
            {chant.commentary ? (
              <p className="pitch-note">Nota de la fuente: {chant.commentary}</p>
            ) : null}
          </div>
        </div>
      </ChantWorkspace>
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
