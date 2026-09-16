import ChantSearch from "@/components/ChantSearch";
import { corpusFacets, loadCorpus } from "@/lib/corpus";

export default function HomePage() {
  const chants = loadCorpus();
  const facets = corpusFacets(chants);

  return (
    <>
      <ChantSearch facets={facets} total={chants.length} />
      <p className="result-count">
        Corpus actual: propios de la misa (introitos, graduales, aleluyas, tractos, ofertorios y
        comuniones) importados de GregoBase. Cada ficha indica su edición impresa y su página.
      </p>
    </>
  );
}
