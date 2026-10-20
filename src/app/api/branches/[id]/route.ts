import { NextRequest, NextResponse } from "next/server";
import {
  readBranches,
  readPersons,
  writeBranches,
  writePersons,
} from "@/lib/storage";
import {
  parseBranchBody,
  parseMemberIds,
  syncBranchMembers,
} from "@/lib/branches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = parseBranchBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const branches = await readBranches();
  const idx = branches.findIndex((b) => b.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const branch = { id, ...parsed };
  branches[idx] = branch;
  await writeBranches(branches);
  await syncBranchMembers(id, parseMemberIds(body));
  return NextResponse.json({ branch });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const branches = await readBranches();
  if (!branches.some((b) => b.id === id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeBranches(branches.filter((b) => b.id !== id));
  // Don't leave persons pointing at a branch that no longer exists.
  const persons = await readPersons();
  if (persons.some((p) => p.familyBranchId === id)) {
    await writePersons(
      persons.map((p) =>
        p.familyBranchId === id ? { ...p, familyBranchId: undefined } : p,
      ),
    );
  }
  return NextResponse.json({ ok: true });
}
