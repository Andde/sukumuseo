import Link from "next/link";
import type { Place } from "@/lib/types";

export default function PlaceCard({ place }: { place: Place }) {
  return (
    <Link
      href={`/places/${place.id}`}
      className="group block rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-5 hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold group-hover:text-[color:var(--accent)]">
        {place.name}
      </h3>
      {place.municipality && (
        <p className="text-sm text-[color:var(--muted)] mt-1">
          {place.municipality}
        </p>
      )}
      {place.description && (
        <p className="text-sm mt-3 line-clamp-3">{place.description}</p>
      )}
    </Link>
  );
}
