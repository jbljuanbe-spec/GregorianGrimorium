import type { Metadata } from "next";
import { Archivo, Spectral } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Archivo para la interfaz: una grotesca de trabajo, con carácter y buena
// densidad para filas de metadatos.
const display = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Spectral para el latín y para la letra bajo los neumas: serif pensada para
// pantalla, con diacríticos sólidos (é, æ, ǽ) que este repertorio necesita.
const chant = Spectral({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
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
