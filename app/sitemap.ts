import type { MetadataRoute } from "next";
import { loadCorpus } from "@/lib/corpus";
import { SITE_URL } from "@/lib/site";

// Con `output: export` el sitemap se genera en compilación, no por petición.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    ...loadCorpus().map((chant) => ({
      url: `${SITE_URL}/cantos/${chant.id}/`,
      priority: 0.7,
    })),
  ];
}
