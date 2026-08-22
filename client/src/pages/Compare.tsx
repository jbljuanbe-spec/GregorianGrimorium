import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, Scale, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const sections = [
  { key: "keywordScore", label: "Competencias y palabras clave", max: 45 },
  { key: "roleScore", label: "Puesto y sector", max: 25 },
  { key: "preferenceScore", label: "Ubicación y condiciones", max: 15 },
  { key: "languageScore", label: "Idiomas", max: 10 },
] as const;

export default function Compare() {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => setIds(JSON.parse(localStorage.getItem("byscador-compare") ?? "[]")), []);
  const comparison = trpc.employment.offers.compare.useQuery({ ids: ids.length >= 2 ? ids : [1, 2] }, { enabled: ids.length >= 2 });
  const remove = (id: number) => { const next = ids.filter(value => value !== id); setIds(next); localStorage.setItem("byscador-compare", JSON.stringify(next)); };
  const rows = comparison.data ?? [];

  if (ids.length < 2) return <div className="content-shell"><section className="page-header"><div><p className="eyebrow">COMPARADOR</p><h1>Compara solo lo que importa.</h1><p>Selecciona entre dos y tres oportunidades desde el catálogo para ver dónde están las diferencias relevantes.</p></div></section><Card className="empty-catalogue"><CardContent><Scale className="h-7 w-7" /><h2>Aún no hay una comparación.</h2><p>El comparador conserva la lectura de coincidencias, carencias, condiciones y adecuación de cada oferta seleccionada.</p><Link href="/ofertas"><Button>Ir al catálogo</Button></Link></CardContent></Card></div>;
  if (comparison.isLoading) return <div className="content-shell"><section className="page-header"><div><p className="eyebrow">COMPARADOR</p><h1>Preparando la comparación.</h1><p>Contrastando las coincidencias, carencias y condiciones de las oportunidades elegidas.</p></div></section><Card className="loading-panel"><CardContent><span className="loading-orbit" /><p>Calculando diferencias relevantes…</p></CardContent></Card></div>;
  if (comparison.isError) return <div className="content-shell"><section className="page-header"><div><p className="eyebrow">COMPARADOR</p><h1>No ha sido posible recuperar la comparación.</h1><p>Las ofertas siguen guardadas; vuelve a cargar la lectura cuando se restablezca la conexión.</p></div></section><Card className="empty-catalogue"><CardContent><Scale className="h-7 w-7" /><h2>La comparación no está disponible ahora.</h2><Button onClick={() => comparison.refetch()}>Reintentar</Button></CardContent></Card></div>;

  return <div className="content-shell comparison-page"><section className="page-header"><div><p className="eyebrow">COMPARADOR</p><h1>El detalle para decidir con calma.</h1><p>La puntuación no sustituye tu criterio: hace explícitos los factores que más pesan en cada oportunidad.</p></div><Link href="/ofertas"><Button variant="outline"><ArrowLeft className="h-4 w-4" />Volver al catálogo</Button></Link></section><div className="comparison-grid">{rows.map(offer => <Card className="comparison-card" key={offer.id}><CardContent><div className="compare-card-heading"><div><p className="fit-number">{offer.fit.score}<span>/100</span></p><h2>{offer.title}</h2><p>{offer.company} · {offer.location}</p></div><button onClick={() => remove(offer.id)} className="icon-button" aria-label="Quitar de la comparación"><X className="h-4 w-4" /></button></div><div className="tag-row"><Badge variant="outline">{offer.modality}</Badge><Badge variant="outline">{offer.contractType}</Badge><Badge variant="outline">{offer.area}</Badge></div><div className="score-breakdown">{sections.map(section => <div key={section.key}><div><span>{section.label}</span><strong>{offer.fit[section.key]}/{section.max}</strong></div><Progress value={(offer.fit[section.key] / section.max) * 100} /></div>)}</div><div className="comparison-insight match"><CheckCircle2 className="h-4 w-4" /><div><small>COINCIDENCIAS</small><p>{offer.fit.matchedKeywords.length ? offer.fit.matchedKeywords.join(" · ") : "No hay coincidencias explícitas detectadas."}</p></div></div><div className="comparison-insight gap"><CircleAlert className="h-4 w-4" /><div><small>CARENCIA O DUDA</small><p>{offer.fit.missingKeywords.length ? offer.fit.missingKeywords.join(" · ") : "No hay requisitos ausentes detectados."}</p></div></div><a href={offer.sourceUrl} target="_blank" rel="noreferrer" className="text-link">Abrir candidatura</a></CardContent></Card>)}</div></div>;
}
