"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Buscar" },
  { href: "/explorar/", label: "Explorar" },
  { href: "/acerca-de/", label: "Acerca de" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            ℟
          </span>
          <span className="brand-name">{SITE_NAME}</span>
        </Link>

        <nav className="site-nav" aria-label="Secciones">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
