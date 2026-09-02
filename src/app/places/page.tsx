import { getPlaces } from "@/lib/data";
import PlaceCard from "@/components/PlaceCard";

export const metadata = {
  title: "Paikat – Hirvosen sukumuseo",
};

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const places = await getPlaces();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Paikat</h1>
      <p className="text-[color:var(--muted)] mb-8">
        Suvun kotitilat, kaupungit ja kylät. Jokaisen paikan takaa löydät siihen
        liittyvät henkilöt ja kuvat.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {places.map((p) => (
          <PlaceCard key={p.id} place={p} />
        ))}
      </div>
    </div>
  );
}
