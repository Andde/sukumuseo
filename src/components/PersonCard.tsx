import Link from "next/link";
import type { Person } from "@/lib/types";
import { formatLifeSpan } from "@/lib/data";
import PhotoPlaceholder from "./PhotoPlaceholder";

export default function PersonCard({ person }: { person: Person }) {
  return (
    <Link
      href={`/persons/${person.id}`}
      className="group block rounded-md border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden hover:shadow-md transition-shadow"
    >
      <PhotoPlaceholder label={person.fullName} aspect="portrait" />
      <div className="p-4">
        <h3 className="font-semibold text-lg group-hover:text-[color:var(--accent)]">
          {person.fullName}
        </h3>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          {formatLifeSpan(person)}
        </p>
        {person.occupation && (
          <p className="text-sm mt-2 italic">{person.occupation}</p>
        )}
      </div>
    </Link>
  );
}
