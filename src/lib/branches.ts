import { readPersons, writePersons } from "@/lib/storage";
import type { FamilyBranch } from "@/lib/types";

export type BranchInput = Omit<FamilyBranch, "id">;

export function nextBranchId(branches: FamilyBranch[]): string {
  const nums = branches
    .map((b) => /^branch_(\d+)$/.exec(b.id)?.[1])
    .filter((n): n is string => !!n)
    .map((n) => parseInt(n, 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `branch_${String(next).padStart(3, "0")}`;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function parseBranchBody(
  body: unknown,
): BranchInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "invalid body" };
  const b = body as Record<string, unknown>;
  const name = str(b.name);
  if (!name) return { error: "Nimi puuttuu." };
  return {
    name,
    description: str(b.description) || undefined,
    rootPersonId: str(b.rootPersonId) || undefined,
  };
}

export function parseMemberIds(body: unknown): string[] {
  const v = (body as { memberIds?: unknown } | null)?.memberIds;
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && !!x)
    : [];
}

// Makes exactly `memberIds` the members of the branch: they get the branch id,
// anyone else who had it loses it. Persons in other branches are moved over.
export async function syncBranchMembers(
  branchId: string,
  memberIds: string[],
): Promise<void> {
  const persons = await readPersons();
  const members = new Set(memberIds);
  let changed = false;
  const next = persons.map((p) => {
    if (members.has(p.id) && p.familyBranchId !== branchId) {
      changed = true;
      return { ...p, familyBranchId: branchId };
    }
    if (!members.has(p.id) && p.familyBranchId === branchId) {
      changed = true;
      return { ...p, familyBranchId: undefined };
    }
    return p;
  });
  if (changed) await writePersons(next);
}
