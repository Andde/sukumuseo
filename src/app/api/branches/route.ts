import { NextRequest, NextResponse } from "next/server";
import { readBranches, writeBranches } from "@/lib/storage";
import {
  nextBranchId,
  parseBranchBody,
  parseMemberIds,
  syncBranchMembers,
} from "@/lib/branches";
import type { FamilyBranch } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auth: only the site-wide access gate in proxy.ts.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = parseBranchBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const branches = await readBranches();
  const branch: FamilyBranch = { id: nextBranchId(branches), ...parsed };
  await writeBranches([...branches, branch]);
  await syncBranchMembers(branch.id, parseMemberIds(body));
  return NextResponse.json({ branch }, { status: 201 });
}
