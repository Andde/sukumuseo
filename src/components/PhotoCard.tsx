import Link from "next/link";
import type { Photo } from "@/lib/types";
import PhotoPlaceholder from "./PhotoPlaceholder";

export default function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <Link
      href={`/photos/${photo.id}`}
      className="group block rounded-md border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden hover:shadow-md transition-shadow"
    >
      {photo.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.imageUrl}
          alt={photo.title}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <PhotoPlaceholder label={photo.title} aspect="square" />
      )}
      <div className="p-3">
        <h3 className="font-medium text-sm group-hover:text-[color:var(--accent)]">
          {photo.title}
        </h3>
        {photo.year && (
          <p className="text-xs text-[color:var(--muted)] mt-1">{photo.year}</p>
        )}
      </div>
    </Link>
  );
}
