import ChantList, { type ChantListItem } from "@/components/ChantList";
import { formatCount } from "@/lib/site";

export default function TaxonIndex({
  eyebrow,
  title,
  blurb,
  items,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  items: ChantListItem[];
}) {
  return (
    <>
      <section className="hero">
        <p className="rubric">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{blurb}</p>
      </section>

      <div className="result-bar">
        <span>
          {formatCount(items.length)} {items.length === 1 ? "pieza" : "piezas"}
        </span>
      </div>

      <ChantList items={items} />
    </>
  );
}
