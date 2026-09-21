import type { Metadata } from "next";
import { Cardo, Inter_Tight } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Inter Tight para la interfaz: etiquetas, cifras y navegación. Va en papel
// secundario a propósito —la voz de la página es la serif—, así que lo que se
// le pide es densidad y cifras tabulares limpias, no carácter.
const display = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

// Cardo para el latín, los íncipits y los titulares.
//
// Está diseñada por David Perry PARA medievalistas y clasicistas: es una
// Bembo renacentista con la cobertura de diacríticos que este repertorio
// necesita de verdad (é, æ, ǽ, œ) y con el aire de un libro compuesto en
// plomo. Antes iba Spectral, que es buena pero es una de las serif por
// defecto de Google Fonts y aparece en miles de webs generadas: el tipo de
// letra es lo que más delata una interfaz sin autor. Esta cara tiene un
// referente y un motivo.
const chant = Cardo({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-chant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — biblioteca de canto gregoriano`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_ES",
    title: `${SITE_NAME} — biblioteca de canto gregoriano`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${chant.variable}`}>
      <head>
        {/* El motor de partituras se descarga en paralelo con la página, así
            que cuando el componente lo pide ya está en caché: eso recorta la
            espera en blanco sobre el pentagrama. Se precarga y no se ejecuta
            en diferido a propósito, para no retrasar la interactividad del
            buscador con 130 KB que solo necesita la ficha. */}
        <link rel="preload" href="/vendor/exsurge.js" as="script" />
      </head>
      <body>
        <a href="#contenido" className="skip-link">
          Ir al contenido
        </a>

        <SiteNav />

        <main id="contenido">
          <div className="wrap">{children}</div>
        </main>

        <footer className="site-footer">
          <div className="wrap">
            <p>
              Corpus de{" "}
              <a href="https://gregobase.selapa.net/" rel="noreferrer">
                GregoBase
              </a>{" "}
              vía{" "}
              <a href="https://github.com/bacor/gregobasecorpus" rel="noreferrer">
                GregoBaseCorpus
              </a>
              , en dominio público (CC0-1.0). Las partituras se componen en tu navegador desde su
              notación gabc con{" "}
              <a href="https://github.com/frmatthew/exsurge" rel="noreferrer">
                Exsurge
              </a>{" "}
              (MIT); no son imágenes escaneadas.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
