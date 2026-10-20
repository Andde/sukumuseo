import Link from "next/link";
import { notFound } from "next/navigation";
import { getBranches, getPersons } from "@/lib/data";
import BranchEditor from "@/components/admin/BranchEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sukuhaara · Ylläpito" };

type PageProps = { params: Promise<{ id: string }> };

// `/admin/branches/new` creates, any other id edits that branch.
export default async function AdminBranchPage({ params }: PageProps) {
  const { id } = await params;
  const [branches, persons] = await Promise.all([getBranches(), getPersons()]);
  const branch = id === "new" ? undefined : branches.find((b) => b.id === id);
  if (id !== "new" && !branch) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/admin/branches"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Sukuhaarat
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">
        {branch ? branch.name : "Uusi sukuhaara"}
      </h1>
      <BranchEditor
        branch={branch}
        persons={persons.map((p) => ({ id: p.id, name: p.fullName }))}
        memberIds={
          branch
            ? persons.filter((p) => p.familyBranchId === branch.id).map((p) => p.id)
            : []
        }
      />
    </div>
  );
}
