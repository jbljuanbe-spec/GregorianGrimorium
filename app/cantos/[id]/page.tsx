import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChantScore from "@/components/ChantScore";
import { getChant, loadCorpus } from "@/lib/corpus";

export function generateStaticParams() {
  return loadCorpus().map((chant) => ({ id: chant.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const chant = getChant(id);
  if (!chant) return {};

  const descriptors = [chant.genre, chant.mode ? `modo ${chant.mode}` : null].filter(Boolean).join(", ");
  return {
    title: chant.incipit,
    description: `${chant.incipit} (${descriptors}). Texto latino y partitura en notación cuadrada. ${truncate(chant.text_latin, 110)}`,
  };
}

export default async function ChantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chant = getChant(id);
  if (!chant) notFound();

  const reviewed = chant.review_status === "verified";

  return (
    <article>
      <header className="chant-header">
        <h1>{chant.incipit}</h1>
        <div className="chant-meta">
          <span>{chant.genre}</span>
          {chant.mode ? <span>Modo {chant.mode}</span> : null}
          {chant.mode_variant ? <span>{chant.mode_variant}</span> : null}
          {chant.version ? <span>Versión {chant.version}</span> : null}
          <span className="badge">{reviewed ? "Verificado" : "Sin verificar"}</span>
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
                {reference.page ? ` — p. ${reference.page}` : ""}
                {reference.editor ? ` (${reference.editor})` : ""}
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

function truncate(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1).trimEnd()}…`;
}
