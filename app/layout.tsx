import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gregorian Grimorium — biblioteca de canto gregoriano",
    template: "%s — Gregorian Grimorium",
  },
  description:
    "Buscador de canto gregoriano por íncipit, texto latino, modo y edición. Partituras en notación cuadrada dibujadas desde su código fuente.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              Gregorian Grimorium
            </Link>
            <span className="tagline">Biblioteca de canto gregoriano</span>
          </div>
        </header>
        <main>
          <div className="wrap">{children}</div>
        </main>
        <footer className="site-footer">
          <div className="wrap">
            Corpus procedente de{" "}
            <a href="https://gregobase.selapa.net/" rel="noreferrer">
              GregoBase
            </a>{" "}
            vía{" "}
            <a href="https://github.com/bacor/gregobasecorpus" rel="noreferrer">
              GregoBaseCorpus
            </a>
            , bajo CC0-1.0. Partituras dibujadas con{" "}
            <a href="https://github.com/frmatthew/exsurge" rel="noreferrer">
              Exsurge
            </a>{" "}
            (MIT).
          </div>
        </footer>
      </body>
    </html>
  );
}
