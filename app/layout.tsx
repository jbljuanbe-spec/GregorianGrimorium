import type { Metadata } from "next";
import Link from "next/link";
import { Crimson_Text, Inter } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Crimson Text es una tipografía de estilo Garamond: es la que usa Exsurge
// para la letra bajo los neumas, así que el texto de la web y el de la
// partitura casan.
const serif = Crimson_Text({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
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
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a href="#contenido" className="skip-link">
          Ir al contenido
        </a>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden="true">
                ℟
              </span>
              <span className="brand-name">{SITE_NAME}</span>
            </Link>
            <span className="tagline">Biblioteca de canto gregoriano</span>
          </div>
        </header>
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
              , en dominio público (CC0-1.0). Partituras compuestas en tu navegador con{" "}
              <a href="https://github.com/frmatthew/exsurge" rel="noreferrer">
                Exsurge
              </a>{" "}
              (MIT).
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
