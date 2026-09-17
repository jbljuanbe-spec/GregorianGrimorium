import type { Metadata } from "next";
import Link from "next/link";
import { editions, loadCorpus, reviewTally } from "@/lib/corpus";
import { formatCount } from "@/lib/site";

export const metadata: Metadata = {
  title: "Acerca de este proyecto",
  description:
    "De dónde sale el corpus, con qué licencia, cómo se dibujan las partituras y qué se comprueba de cada ficha.",
  alternates: { canonical: "/acerca-de/" },
};

export default function AcercaDePage() {
  const chants = loadCorpus();
  const tally = reviewTally();

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
        <h2>Qué se comprueba de cada ficha</h2>
        <p>
          La importación es automática y <strong>nunca firma nada como revisado</strong>: hay{" "}
          {formatCount(tally.verificado)} fichas cotejadas a mano de {formatCount(chants.length)}.
          Pero decirlo y callar lo demás sería no haber mirado, porque el canto gregoriano tiene
          propiedades que se comprueban solas.
        </p>
        <p>
          Así que cada ficha publica su evidencia: siete comprobaciones, una por línea, con lo que
          ha salido. La más exigente es musicológica —que la melodía cierre en la finalis de su
          modo o en su afinal—, y es la que más errores encuentra. Ahora mismo{" "}
          <strong>{formatCount(tally.comprobado)}</strong> fichas pasan todas las aplicables y{" "}
          <strong>{formatCount(tally["con-reparos"])}</strong> tienen un reparo con nombre.
        </p>
        <p>
          Nada de eso mira la ficha contra el libro impreso, que es lo que sigue exigiendo una
          persona. Por eso el sello dice «comprobado» y no «revisado»:{" "}
          <Link href="/revision/">el método, las cifras y la cola abierta</Link>.
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
