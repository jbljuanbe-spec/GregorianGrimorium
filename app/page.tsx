import ChantSearch from "@/components/ChantSearch";
import { corpusFacets, loadCorpus } from "@/lib/corpus";
import { formatCount } from "@/lib/site";

export default function HomePage() {
  const chants = loadCorpus();
  const facets = corpusFacets(chants);
  const editions = facets.sources.length;

  return (
    <>
      <section className="hero">
        <h1>Encuentra el canto, no la página del libro</h1>
        <p>
          <strong>{formatCount(chants.length)} piezas</strong> del propio de la misa,
          buscables por íncipit o por <strong>cualquier palabra de su texto latino</strong>. Cada
          ficha trae su modo, su edición impresa y su página, y la partitura en notación cuadrada.
        </p>
      </section>

      <ChantSearch facets={facets} total={chants.length} />

      <ul className="value-props">
        <li>
          <h2>Busca por dentro del texto</h2>
          <p>
            Si solo recuerdas media frase, la encuentras: el buscador entra en el texto latino
            completo, sin importar los acentos.
          </p>
        </li>
        <li>
          <h2>Partitura, no fotografía</h2>
          <p>
            La notación se compone en tu navegador desde su código fuente, así que se adapta al
            ancho de la pantalla y amplía sin pixelarse. Hay modo ensayo a pantalla completa.
          </p>
        </li>
        <li>
          <h2>Siempre con la fuente citada</h2>
          <p>
            {editions} ediciones distintas, con el libro y la página de cada pieza, para cotejarla
            con el impreso que tengas en el atril.
          </p>
        </li>
      </ul>
    </>
  );
}
