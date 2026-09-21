import Link from "next/link";

export interface ChantListItem {
  id: string;
  incipit: string;
  /** El íncipit ya presentable: ver lib/chant-title.mjs. */
  title: string;
  mode: string | null;
  detail: string;
  /** Número de transcripciones de la misma pieza, si hay más de una. */
  versions?: number;
}

/**
 * Lista de cantos. Se agrupan las transcripciones de una misma pieza: en
 * GregoBase hay hasta cinco versiones del mismo canto, y listarlas por
 * separado llena la pantalla de entradas indistinguibles.
 */
export default function ChantList({ items }: { items: ChantListItem[] }) {
  return (
    <ul className="chant-list">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/cantos/${item.id}/`}>
            <span className="incipit">{item.title}</span>
            <span className="detail">{item.detail}</span>
            <span className="tally">
              {item.mode ? <span className="mode-tag">{item.mode}</span> : null}
              {item.versions && item.versions > 1 ? ` ${item.versions} versiones` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
