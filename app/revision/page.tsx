import type { Metadata } from "next";
import Link from "next/link";
import { formatCount } from "@/lib/site";
import { loadCorpus, reviewQueue, reviewTally } from "@/lib/corpus";
import { CHECKS, GRADES } from "@/lib/review.mjs";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cómo se revisa este corpus",
  description:
    "Qué se comprueba de cada canto de forma automática, qué exige una persona, y la cola " +
    "abierta de fichas con reparos.",
  alternates: { canonical: "/revision/" },
};

const SHOWN = 120;

export default function ReviewPage() {
  const total = loadCorpus().length;
  const tally = reviewTally();
  const queue = reviewQueue();

  // Cuántas fichas falla cada comprobación: dice por dónde conviene empezar.
  const byCheck = new Map<string, number>();
  for (const { audit } of queue) {
    for (const check of audit.failed) {
      byCheck.set(check.id, (byCheck.get(check.id) ?? 0) + 1);
    }
  }

  return (
    <article>
      <section className="hero">
        <h1>Cómo se revisa este corpus</h1>
        <p>
          El corpus se importa solo, y una importación automática no puede
          firmar que una ficha esté bien. Pero decir «sin revisar» de las{" "}
          {formatCount(total)} y callar lo demás mezcla dos cosas distintas: que
          nadie la haya cotejado a mano, y que no sepamos nada de ella. Lo
          segundo no es cierto. Así que cada ficha publica qué se le ha
          comprobado.
        </p>
      </section>

      <div className="tally">
        {(["verificado", "comprobado", "con-reparos"] as const).map((grade) => (
          <div key={grade} className={`tally-cell is-${grade}`}>
            <strong>{formatCount(tally[grade])}</strong>
            <span>{GRADES[grade].label}</span>
          </div>
        ))}
      </div>

      <div className="block">
        <h2>Qué se comprueba sin intervención humana</h2>

        <dl className="checks-doc">
          <div>
            <dt>La notación se lee y produce una melodía</dt>
            <dd>
              Paréntesis compensados, clave explícita al principio y al menos
              una nota. Sin clave, Exsurge dibuja con una por defecto y la pieza
              suena en un ámbito que no es el suyo.
            </dd>
          </div>
          <div>
            <dt>El texto cantado está limpio</dt>
            <dd>
              Que no se hayan colado como sílabas las rúbricas de ejecución
              («ij.», «E u o u a e»), ni corchetes o JSON de la fuente, ni
              caracteres invisibles —de esos aparecieron tres, y no se ven
              mirando la ficha—. Los signos del gradual sí se admiten: ℣ y ℟
              marcan versículo y respuesta, y son texto legítimo.
            </dd>
          </div>
          <div>
            <dt>La pieza cierra donde su modo manda</dt>
            <dd>
              Es la comprobación con más fondo. La finalis de cada modo está
              fijada por la teoría: re para I y II, mi para III y IV, fa para V
              y VI, sol para VII y VIII. Si una pieza dice ser del modo II y no
              cierra ahí, una de las dos cosas está mal. Se admite además la
              afinal —una quinta arriba: re con la, mi con ti, fa con do—,
              porque transponer para que quepa en el tetragrama es práctica
              corriente en la Vaticana y no un error; sin admitirlo, 306 fichas
              correctas darían falso positivo.
            </dd>
          </div>
          <div>
            <dt>El modo coincide con las demás transcripciones</dt>
            <dd>
              GregoBase recoge varias versiones de la misma pieza. Dos ediciones
              no pueden tener razón las dos sobre el modo, así que un desacuerdo
              señala un error en una. <strong>Con una cautela:</strong> casi
              todas las transcripciones del corpus las hizo la misma persona a
              partir de libros distintos, así que esto corrobora que las
              ediciones concuerdan, no que dos personas independientes lo
              leyeran igual. Vale menos que una firma.
            </dd>
          </div>
          <div>
            <dt>Consta la procedencia</dt>
            <dd>
              Origen, licencia, identificador en la fuente, instantánea del
              volcado y al menos una edición impresa con su página. Es lo que
              hace la ficha citable y lo que permite cotejarla.
            </dd>
          </div>
        </dl>
      </div>

      <div className="block">
        <h2>Qué sigue exigiendo una persona</h2>

        <p>
          Nada de lo anterior mira la ficha contra el libro. Una transcripción
          puede pasar las seis comprobaciones y tener una palabra partida donde
          no toca, un neuma de menos o un modo que la fuente ya traía mal y que
          sus otras ediciones repiten. Eso solo lo ve alguien con el gradual
          delante.
        </p>

        <p>
          Por eso <strong>{GRADES.comprobado.label.toLowerCase()}</strong> no
          dice «revisado». Las firmas viven en <code>data/reviewed.json</code>,
          versionado en git: quién firmó qué y cuándo queda en el historial,
          auditable. Firmar no borra los reparos —si una comprobación sigue
          fallando, la ficha lo enseña igual—.
        </p>
      </div>

      <div className="block">
        <h2>Cola abierta: {formatCount(queue.length)} fichas con reparos</h2>

        <p>
          Ordenada por gravedad, primero las que fallan más de una cosa. Por
          comprobación:{" "}
          {[...byCheck.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(
              ([id, count]) =>
                `${CHECKS[id as keyof typeof CHECKS].toLowerCase()} (${count})`,
            )
            .join(", ")}
          .
        </p>

        <ul className="queue">
          {queue.slice(0, SHOWN).map(({ chant, audit }) => (
            <li key={chant.id}>
              <Link href={`/cantos/${chant.id}/`}>
                <span className="incipit">{chant.incipit}</span>
                <span className="detail">
                  {[
                    chant.genre,
                    chant.mode ? `modo ${chant.mode}` : null,
                    chant.version,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
              <ul className="queue-reasons">
                {audit.failed.map((check) => (
                  <li key={check.id}>{check.detail}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        {queue.length > SHOWN ? (
          <p className="pitch-note">
            Y {formatCount(queue.length - SHOWN)} más. La lista completa sale de{" "}
            <code>pnpm run validate</code>.
          </p>
        ) : null}
      </div>
    </article>
  );
}
