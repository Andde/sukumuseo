import { getPersons, getBranches } from "@/lib/data";
import PersonsList from "./PersonsList";

export const metadata = {
  title: "Henkilöt – Hirvosen sukumuseo",
};

export const dynamic = "force-dynamic";

export default async function PersonsPage() {
  const [persons, branches] = await Promise.all([getPersons(), getBranches()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Henkilöt</h1>
      <p className="text-[color:var(--muted)] mb-8">
        Suvun jäsenet aikakausien läpi. Suodata nimellä, syntymävuodella tai
        sukuhaaralla.
      </p>
      <PersonsList persons={persons} branches={branches} />
    </div>
  );
}
