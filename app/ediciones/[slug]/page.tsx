import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonIndex from "@/components/TaxonIndex";
import { chantsByEdition, editions, toListItems } from "@/lib/corpus";

export function generateStaticParams() {
  return editions().map((taxon) => ({ slug: taxon.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const taxon = editions().find((entry) => entry.slug === slug);
  if (!taxon) return {};

  return {
    title: `${taxon.label}: ${taxon.count} cantos`,
    description: `Cantos del corpus que aparecen en ${taxon.label}, con la página de cada pieza en esa edición.`,
    alternates: { canonical: `/ediciones/${slug}/` },
  };
}

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const taxon = editions().find((entry) => entry.slug === slug);
  if (!taxon) notFound();

  return (
    <TaxonIndex
      eyebrow="Edición impresa"
      title={taxon.label}
      blurb={`Piezas que aparecen en ${taxon.label}. Cada ficha indica la página exacta en esta edición.`}
      items={toListItems(chantsByEdition(slug))}
    />
  );
}
