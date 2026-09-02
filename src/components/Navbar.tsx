import Link from "next/link";

const links = [
  { href: "/", label: "Etusivu" },
  { href: "/persons", label: "Henkilöt" },
  { href: "/photos", label: "Kuvat" },
  { href: "/stories", label: "Historia" },
  { href: "/places", label: "Paikat" },
  { href: "/admin", label: "Ylläpito" },
];

export default function Navbar() {
  return (
    <header className="border-b border-[color:var(--border)] bg-[color:var(--card)]">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-[color:var(--accent)]"
        >
          Hirvosen sukumuseo
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-[color:var(--accent)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://www.geni.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[color:var(--accent)] transition-colors"
          >
            Geni ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
