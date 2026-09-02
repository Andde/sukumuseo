import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPersonById,
  getPlaceById,
  getBranchById,
  getPhotosByPerson,
  formatLifeSpan,
} from "@/lib/data";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import PhotoCard from "@/components/PhotoCard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonPage({ params }: PageProps) {
  const { id } = await params;
  const person = await getPersonById(id);
  if (!person) notFound();

  const [birthPlace, branch, father, mother, spouses, children, photos] =
    await Promise.all([
      person.birthPlaceId ? getPlaceById(person.birthPlaceId) : undefined,
      person.familyBranchId ? getBranchById(person.familyBranchId) : undefined,
      person.fatherId ? getPersonById(person.fatherId) : undefined,
      person.motherId ? getPersonById(person.motherId) : undefined,
      Promise.all(
        (person.spouseIds ?? []).map((sid) => getPersonById(sid)),
      ).then((rs) => rs.filter(Boolean)),
      Promise.all(
        (person.childrenIds ?? []).map((cid) => getPersonById(cid)),
      ).then((rs) => rs.filter(Boolean)),
      getPhotosByPerson(person.id),
    ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/persons"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Kaikki henkilöt
      </Link>

      <div className="grid md:grid-cols-3 gap-8 mt-6">
        <div className="md:col-span-1">
          <PhotoPlaceholder label={person.fullName} aspect="portrait" />
        </div>

        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold">{person.fullName}</h1>
          <p className="text-lg text-[color:var(--muted)] mt-1">
            {formatLifeSpan(person)}
            {person.occupation ? ` · ${person.occupation}` : ""}
          </p>

          <dl className="grid grid-cols-2 gap-y-2 gap-x-4 mt-6 text-sm">
            {person.birthDate && (
              <>
                <dt className="text-[color:var(--muted)]">Syntynyt</dt>
                <dd>
                  {person.birthDate}
                  {birthPlace && (
                    <>
                      {" · "}
                      <Link
                        href={`/places/${birthPlace.id}`}
                        className="text-[color:var(--accent)] hover:underline"
                      >
                        {birthPlace.name}
                      </Link>
                    </>
                  )}
                </dd>
              </>
            )}
            {person.deathDate && (
              <>
                <dt className="text-[color:var(--muted)]">Kuollut</dt>
                <dd>{person.deathDate}</dd>
              </>
            )}
            {branch && (
              <>
                <dt className="text-[color:var(--muted)]">Sukuhaara</dt>
                <dd>{branch.name}</dd>
              </>
            )}
          </dl>

          {person.bio && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Elämäntarina</h2>
              <p className="leading-relaxed whitespace-pre-line">{person.bio}</p>
            </div>
          )}

          {person.geniUrl && (
            <div className="mt-6">
              <a
                href={person.geniUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-md bg-[color:var(--accent)] text-white text-sm hover:opacity-90"
              >
                Näytä Genissä ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Perhesuhteet */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Perhesuhteet</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <RelationBox title="Vanhemmat">
            {father || mother ? (
              <ul className="space-y-1">
                {father && (
                  <li>
                    <Link
                      href={`/persons/${father.id}`}
                      className="text-[color:var(--accent)] hover:underline"
                    >
                      {father.fullName}
                    </Link>
                  </li>
                )}
                {mother && (
                  <li>
                    <Link
                      href={`/persons/${mother.id}`}
                      className="text-[color:var(--accent)] hover:underline"
                    >
                      {mother.fullName}
                    </Link>
                  </li>
                )}
              </ul>
            ) : (
              <Empty />
            )}
          </RelationBox>

          <RelationBox title="Puoliso">
            {spouses.length ? (
              <ul className="space-y-1">
                {spouses.map((s) =>
                  s ? (
                    <li key={s.id}>
                      <Link
                        href={`/persons/${s.id}`}
                        className="text-[color:var(--accent)] hover:underline"
                      >
                        {s.fullName}
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            ) : (
              <Empty />
            )}
          </RelationBox>

          <RelationBox title="Lapset">
            {children.length ? (
              <ul className="space-y-1">
                {children.map((c) =>
                  c ? (
                    <li key={c.id}>
                      <Link
                        href={`/persons/${c.id}`}
                        className="text-[color:var(--accent)] hover:underline"
                      >
                        {c.fullName}
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            ) : (
              <Empty />
            )}
          </RelationBox>
        </div>
      </section>

      {/* Kuvat */}
      {photos.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Kuvat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <PhotoCard key={p.id} photo={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RelationBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-4">
      <h3 className="text-xs uppercase tracking-wide text-[color:var(--muted)] mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="italic text-[color:var(--muted)]">–</p>;
}
