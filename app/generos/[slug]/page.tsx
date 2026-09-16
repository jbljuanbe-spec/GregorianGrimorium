import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonIndex from "@/components/TaxonIndex";
import { chantsByGenre, genres, toListItems } from "@/lib/corpus";

export function generateStaticParams() {
  return genres().map((taxon) => ({ slug: taxon.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const taxon = genres().find((entry) => entry.slug === slug);
  if (!taxon) return {};

  return {
    title: `${taxon.label}: ${taxon.count} cantos`,
    description: `Todos los cantos del género ${taxon.label} del corpus, con su modo, su edición impresa y su partitura en notación cuadrada.`,
    alternates: { canonical: `/generos/${slug}/` },
  };
}

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const taxon = genres().find((entry) => entry.slug === slug);
  if (!taxon) notFound();

  return (
    <TaxonIndex
      eyebrow="Género"
      title={taxon.label}
      blurb={`Piezas del corpus clasificadas como ${taxon.label}. Las transcripciones de una misma pieza se agrupan en una sola fila.`}
      items={toListItems(chantsByGenre(slug))}
    />
  );
}
