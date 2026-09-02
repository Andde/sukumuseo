import { getPhotos } from "@/lib/data";
import PhotoCard from "@/components/PhotoCard";

export const metadata = {
  title: "Kuvat – Hirvosen sukumuseo",
};

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const photos = [...(await getPhotos())].sort(
    (a, b) => (a.year ?? 0) - (b.year ?? 0),
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Kuvagalleria</h1>
      <p className="text-[color:var(--muted)] mb-8">
        Suvun valokuvat vuosikymmenten ajalta. Klikkaa kuvaa nähdäksesi lisätiedot,
        kuvassa esiintyvät henkilöt ja liittyvät paikat.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p) => (
          <PhotoCard key={p.id} photo={p} />
        ))}
      </div>
    </div>
  );
}
