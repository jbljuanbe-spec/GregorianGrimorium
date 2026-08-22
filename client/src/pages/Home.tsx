import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BookmarkCheck, BriefcaseBusiness, ChevronRight, Compass, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "wouter";

const sources = [
  { label: "InfoJobs", url: "https://www.infojobs.net/" },
  { label: "LinkedIn Empleos", url: "https://es.linkedin.com/jobs" },
  { label: "Indeed España", url: "https://es.indeed.com/" },
  { label: "Empléate", url: "https://www.empleate.gob.es/empleo/#/" },
];

const statusLabels = { pendiente: "Pendiente", favorita: "Favorita", aplicada: "Aplicada", descartada: "Descartada" };

export default function Home() {
  const profile = trpc.employment.profile.me.useQuery();
  const offers = trpc.employment.offers.list.useQuery();
  const rows = offers.data ?? [];
  const active = rows.filter(offer => offer.applicationStatus !== "descartada");
  const topOffers = rows.slice(0, 3);
  const hasDataError = profile.isError || offers.isError;

  if (profile.isLoading || offers.isLoading) return <div className="content-shell"><section className="page-header"><div><p className="eyebrow">PANEL PERSONAL</p><h1>Preparando tu panorama profesional.</h1><p>Recuperando tu perfil y las oportunidades guardadas.</p></div></section><Card className="loading-panel"><CardContent><span className="loading-orbit" /><p>Actualizando la lectura de adecuación…</p></CardContent></Card></div>;

  return <div className="content-shell">
    <section className="dashboard-hero"><div><p className="eyebrow">PANEL PERSONAL</p><h1>Decide dónde merece la pena estar.</h1><p className="hero-copy">Una lectura clara de tus oportunidades en España, filtrada con tus propios criterios profesionales.</p></div><div className="hero-actions"><Link href="/ofertas"><Button>Explorar ofertas <ArrowUpRight className="h-4 w-4" /></Button></Link><Link href="/perfil"><Button variant="outline">Afinar perfil</Button></Link></div></section>

    {hasDataError && <Card className="inline-error"><CardContent><p><strong>Hay un problema al actualizar una parte del panel.</strong> Reintenta en unos segundos; el acceso a fuentes externas sigue disponible.</p><Button size="sm" variant="outline" onClick={() => { profile.refetch(); offers.refetch(); }}>Reintentar</Button></CardContent></Card>}
    <section className="metric-grid"><Card><CardContent><span className="metric-label">OFERTAS ACTIVAS</span><strong>{active.length}</strong><span>En tu espacio privado</span></CardContent></Card><Card><CardContent><span className="metric-label">FAVORITAS</span><strong>{rows.filter(offer => offer.applicationStatus === "favorita").length}</strong><span>Para volver con calma</span></CardContent></Card><Card><CardContent><span className="metric-label">ADECUACIÓN MEDIA</span><strong>{rows.length ? `${Math.round(rows.reduce((sum, offer) => sum + offer.fit.score, 0) / rows.length)}%` : "—"}</strong><span>Sobre las ofertas registradas</span></CardContent></Card></section>

    <section className="two-column-section"><Card className="spotlight-card"><CardContent><div className="section-heading"><div><p className="eyebrow">MEJORES OPCIONES</p><h2>Prioridad de esta semana</h2></div><Link href="/ofertas" className="text-link">Ver catálogo <ChevronRight className="h-4 w-4" /></Link></div>{topOffers.length ? <div className="offer-stack">{topOffers.map(offer => <div className="compact-offer" key={offer.id}><div className="fit-orbit"><span>{offer.fit.score}</span><small>/100</small></div><div className="min-w-0 flex-1"><div className="offer-title-row"><h3>{offer.title}</h3><Badge variant="secondary">{statusLabels[offer.applicationStatus]}</Badge></div><p>{offer.company} · {offer.location} · {offer.modality}</p><div className="keyword-line">{offer.fit.matchedKeywords.slice(0, 3).map(keyword => <span key={keyword}>{keyword}</span>)}</div></div></div>)}</div> : <div className="quiet-empty"><Sparkles className="h-5 w-5" /><p>Aún no hay ofertas. Añade las oportunidades que encuentres y recibirás una lectura de adecuación transparente.</p><Link href="/ofertas"><Button size="sm">Añadir primera oferta</Button></Link></div>}</CardContent></Card>
      <Card className="profile-snapshot"><CardContent><p className="eyebrow">PUNTO DE PARTIDA</p><h2>{profile.data?.headline ?? "Cargando perfil…"}</h2><p>{profile.data?.summary}</p><div className="profile-keywords">{profile.data?.keywords.split(",").slice(0, 7).map(keyword => <span key={keyword.trim()}>{keyword.trim()}</span>)}</div><Link href="/perfil"><Button variant="outline" className="w-full">Editar criterios <ChevronRight className="h-4 w-4" /></Button></Link></CardContent></Card></section>

    <section className="source-strip"><div><p className="eyebrow">FUENTES DE CONSULTA</p><h2>Tu radar exterior</h2></div><div className="source-links">{sources.map(source => <a href={source.url} key={source.label} target="_blank" rel="noreferrer">{source.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div><p className="source-caption"><BookmarkCheck className="h-4 w-4" />Guarda aquí solo las ofertas que merezcan seguimiento.</p></section>
  </div>;
}
