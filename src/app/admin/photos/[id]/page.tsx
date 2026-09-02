import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhotoById, getPersons } from "@/lib/data";
import FaceTagger from "@/components/admin/FaceTagger";

export const dynamic = "force-dynamic";
export const metadata = { title: "Merkitse kasvot · Ylläpito" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminPhotoPage({ params }: PageProps) {
  const { id } = await params;
  const [photo, persons] = await Promise.all([getPhotoById(id), getPersons()]);
  if (!photo || !photo.imageUrl) notFound();

  const knownPersons = persons.map((p) => ({
    id: p.id,
    name: p.fullName,
    faceDescriptors: p.faceDescriptors ?? [],
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/admin"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Ylläpitoon
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{photo.title}</h1>
      <p className="text-sm text-[color:var(--muted)]">
        Merkitse kuvassa esiintyvät henkilöt. Malli ehdottaa tunnistuksia; sinä
        päätät.
      </p>

      <div className="mt-6">
        <FaceTagger
          photoId={photo.id}
          imageUrl={photo.imageUrl}
          initialFaces={photo.faces ?? []}
          persons={knownPersons}
        />
      </div>
    </div>
  );
}
