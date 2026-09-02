import { getStories } from "@/lib/data";
import StoryCard from "@/components/StoryCard";

export const metadata = {
  title: "Historia – Hirvosen sukumuseo",
};

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const stories = [...(await getStories())].sort(
    (a, b) => (a.yearFrom ?? 0) - (b.yearFrom ?? 0),
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Suvun historia</h1>
      <p className="text-[color:var(--muted)] mb-8">
        Tarinoita ja artikkeleita suvun vaiheista aikakausien läpi.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stories.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}
