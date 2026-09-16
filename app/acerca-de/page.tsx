import type { Metadata } from "next";
import Link from "next/link";
import { editions, loadCorpus } from "@/lib/corpus";
import { formatCount } from "@/lib/site";

export const metadata: Metadata = {
  title: "Acerca de este proyecto",
  description:
    "De dónde sale el corpus, con qué licencia, cómo se dibujan las partituras y qué significa que una ficha esté sin revisar.",
  alternates: { canonical: "/acerca-de/" },
};

export default function AcercaDePage() {
  const chants = loadCorpus();
  const reviewed = chants.filter((chant) => chant.review_status === "verified").length;

  return (
    <>
      <section className="hero">
        <h1>Acerca de este proyecto</h1>
        <p>
          Una biblioteca de canto gregoriano pensada para quien tiene que cantarlo el domingo:
          encontrar la pieza, ver en qué tono cae y llevársela.
        </p>
      </section>

      <div className="block">
        <h2>De dónde sale el corpus</h2>
        <p>
          Las {formatCount(chants.length)} transcripciones vienen de{" "}
          <a href="https://gregobase.selapa.net/" rel="noreferrer">
            GregoBase
          </a>
          , a través del empaquetado{" "}
          <a href="https://github.com/bacor/gregobasecorpus" rel="noreferrer">
            GregoBaseCorpus
          </a>
          , publicado bajo <strong>CC0-1.0</strong>, es decir en dominio público. Abarcan{" "}
          {editions().length} ediciones impresas distintas, y cada ficha dice de cuál viene y en
          qué página está.
        </p>
      </div>

      <div className="block">
        <h2>Por qué las partituras no son imágenes</h2>
        <p>
          Cada canto guarda su notación en <strong>gabc</strong>, el formato del motor Gregorio, y
          la partitura se compone en tu navegador. Eso tiene dos consecuencias prácticas: se
          adapta al ancho de la pantalla y amplía sin pixelarse, y no se reproduce la maquetación
          de ninguna edición protegida. El <em>Graduale Triplex</em> (1979) sigue teniendo
          derechos vigentes; aquí no se usa.
        </p>
      </div>

      <div className="block">
        <h2>Qué significa «sin revisar»</h2>
        <p>
          La importación es automática y <strong>nunca marca nada como revisado</strong>: ahora
          mismo hay {formatCount(reviewed)} fichas revisadas a mano de {formatCount(chants.length)}
          . Una ficha sin revisar puede arrastrar errores de la fuente —una palabra partida, un
          modo mal declarado— y lo dice en su propia página. Preferimos decirlo a aparentar una
          precisión que aún no tenemos.
        </p>
      </div>

      <div className="block">
        <h2>Cómo empezar</h2>
        <p>
          Puedes <Link href="/">buscar por texto latino</Link> o{" "}
          <Link href="/explorar/">explorar por género, modo o edición</Link>.
        </p>
      </div>
    </>
  );
}
