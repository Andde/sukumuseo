import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, getAccessCode } from "@/lib/access";

export const dynamic = "force-dynamic";

async function checkAccess(formData: FormData) {
  "use server";
  const code = formData.get("code");
  const from = formData.get("from");
  const destination =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
      ? from
      : "/";

  const accessCode = getAccessCode();
  if (accessCode && typeof code === "string" && code === accessCode) {
    (await cookies()).set(ACCESS_COOKIE, accessCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(destination);
  }

  redirect(
    `/access?error=1&from=${encodeURIComponent(destination)}`,
  );
}

type PageProps = {
  searchParams: Promise<{ from?: string; error?: string }>;
};

export default async function AccessPage({ searchParams }: PageProps) {
  const { from, error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="text-2xl font-bold mb-6 text-center text-[color:var(--accent)]">
        Hirvosen sukumuseo
      </h1>
      <form action={checkAccess} className="space-y-4">
        <input type="hidden" name="from" value={from ?? ""} />
        <div>
          <label className="block text-sm mb-1" htmlFor="code">
            Pääsykoodi
          </label>
          <input
            id="code"
            name="code"
            type="password"
            autoFocus
            required
            className="w-full px-3 py-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)]"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">Väärä koodi. Yritä uudelleen.</p>
        )}
        <button
          type="submit"
          className="w-full px-4 py-2 rounded-md bg-[color:var(--accent)] text-white hover:opacity-90"
        >
          Kirjaudu
        </button>
      </form>
    </div>
  );
}
