import { CHECKS, GRADES } from "@/lib/review.mjs";
import type { Audit } from "@/lib/corpus";

const MARK = { pass: "✓", fail: "✗", skip: "–" } as const;

/**
 * El estado de revisión de una ficha, con la evidencia a la vista.
 *
 * Antes aquí ponía «Sin revisar» y nada más, que es verdad y a la vez
 * inútil: mezcla «nadie la ha firmado» con «no sabemos nada de ella». Lo
 * segundo es falso, así que se enseña qué se ha comprobado y qué ha salido,
 * una línea por comprobación.
 */
export default function ReviewPanel({ audit }: { audit: Audit }) {
  const grade = GRADES[audit.grade];

  return (
    <section className="review" aria-labelledby="revision-titulo">
      <div className="review-head">
        <h2 id="revision-titulo">Revisión</h2>
        <span className={`review-grade is-${audit.grade}`}>{grade.label}</span>
      </div>

      <p className="review-blurb">{grade.blurb}</p>

      {audit.signedOff ? (
        <p className="review-signature">
          Firmada por <strong>{audit.signedOff.by}</strong> el {audit.signedOff.date}
          {audit.signedOff.note ? `. ${audit.signedOff.note}` : "."}
        </p>
      ) : null}

      <ul className="review-checks">
        {audit.checks.map((check) => (
          <li key={check.id} data-state={check.state}>
            <span className="review-mark" aria-hidden="true">
              {MARK[check.state]}
            </span>
            <span>
              <strong>{CHECKS[check.id]}</strong>
              <span className="review-detail">
                {check.state === "skip" ? "No aplica: " : ""}
                {check.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="review-note">
        {audit.passed} de {audit.applicable} comprobaciones aplicables.{" "}
        <a href="/revision/">Cómo se revisa este corpus →</a>
      </p>
    </section>
  );
}
