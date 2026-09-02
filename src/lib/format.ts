import type { Person } from "@/lib/types";

// Pure formatters — safe to import from both server and client components.
// Keep fs-touching helpers in data.ts / storage.ts.

export function formatLifeSpan(person: Person): string {
  const birth = person.birthDate?.slice(0, 4) ?? "?";
  const death = person.deathDate?.slice(0, 4) ?? "";
  return death ? `${birth}–${death}` : birth;
}
