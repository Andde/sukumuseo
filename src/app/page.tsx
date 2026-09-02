import Link from "next/link";
import {
  getFeaturedPersons,
  getRecentPhotos,
} from "@/lib/data";
import PersonCard from "@/components/PersonCard";
import PhotoCard from "@/components/PhotoCard";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [persons, photos] = await Promise.all([
    getFeaturedPersons(4),
    getRecentPhotos(4),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[color:var(--border)] bg-[color:var(--card)]">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[color:var(--accent)]">
              Hirvosen sukumuseo
            </h1>
            <p className="mt-4 text-lg leading-relaxed">
              Tervetuloa suvun digitaaliseen museoon. Täältä löydät henkilöiden
              tarinat, vanhat valokuvat, paikat ja historian — matkalta 1800-luvun
              Karjalan tiloilta nykypäivään.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/persons"
                className="px-4 py-2 rounded-md bg-[color:var(--accent)] text-white text-sm hover:opacity-90"
              >
                Tutki henkilöitä
              </Link>
              <Link
                href="/photos"
                className="px-4 py-2 rounded-md border border-[color:var(--border)] text-sm hover:border-[color:var(--accent)]"
              >
                Katso kuvia
              </Link>
              <Link
                href="/stories"
                className="px-4 py-2 rounded-md border border-[color:var(--border)] text-sm hover:border-[color:var(--accent)]"
              >
                Lue historiaa
              </Link>
              <a
                href="https://www.geni.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-md border border-[color:var(--border)] text-sm hover:border-[color:var(--accent)]"
              >
                Avaa Geni ↗
              </a>
            </div>
          </div>
          <div>
            <PhotoPlaceholder
              label="Historiallinen hero-kuva"
              aspect="landscape"
            />
          </div>
        </div>
      </section>

      {/* Viimeksi lisätyt henkilöt */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold">Henkilöitä</h2>
          <Link
            href="/persons"
            className="text-sm text-[color:var(--accent)] hover:underline"
          >
            Kaikki henkilöt →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {persons.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      </section>

      {/* Viimeksi lisätyt kuvat */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold">Kuvia</h2>
          <Link
            href="/photos"
            className="text-sm text-[color:var(--accent)] hover:underline"
          >
            Koko galleria →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
