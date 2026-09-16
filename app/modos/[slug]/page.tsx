import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TaxonIndex from "@/components/TaxonIndex";
import { chantsByMode, modes, toListItems } from "@/lib/corpus";

export function generateStaticParams() {
  return modes().map((taxon) => ({ slug: taxon.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const taxon = modes().find((entry) => entry.slug === slug);
  if (!taxon) return {};

  return {
    title: `Modo ${taxon.label}: ${taxon.count} cantos`,
    description: `Cantos en modo ${taxon.label} del corpus, con su texto latino, su edición impresa y su partitura.`,
    alternates: { canonical: `/modos/${slug}/` },
  };
}

export default async function ModePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const taxon = modes().find((entry) => entry.slug === slug);
  if (!taxon) notFound();

  return (
    <TaxonIndex
      eyebrow="Modo"
      title={`Modo ${taxon.label}`}
      blurb={`Piezas del corpus escritas en modo ${taxon.label} según su fuente.`}
      items={toListItems(chantsByMode(slug))}
    />
  );
}
