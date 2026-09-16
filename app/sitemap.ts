import type { MetadataRoute } from "next";
import { loadCorpus } from "@/lib/corpus";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gregorian-grimorium.example";

// Con `output: export` el sitemap se genera en compilación, no por petición.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, priority: 1 },
    ...loadCorpus().map((chant) => ({
      url: `${SITE}/cantos/${chant.id}/`,
      priority: 0.7,
    })),
  ];
}
