import type { MetadataRoute } from "next";
import { editions, genres, loadCorpus, modes } from "@/lib/corpus";
import { SITE_URL } from "@/lib/site";

// Con `output: export` el sitemap se genera en compilación, no por petición.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const taxonomy = [
    ...genres().map((taxon) => `/generos/${taxon.slug}/`),
    ...modes().map((taxon) => `/modos/${taxon.slug}/`),
    ...editions().map((taxon) => `/ediciones/${taxon.slug}/`),
  ];

  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/explorar/`, priority: 0.9 },
    { url: `${SITE_URL}/acerca-de/`, priority: 0.5 },
    ...taxonomy.map((path) => ({ url: `${SITE_URL}${path}`, priority: 0.8 })),
    ...loadCorpus().map((chant) => ({ url: `${SITE_URL}/cantos/${chant.id}/`, priority: 0.7 })),
  ];
}
