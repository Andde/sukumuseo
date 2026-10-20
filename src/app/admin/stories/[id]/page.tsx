import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersons, getPlaces, getStories } from "@/lib/data";
import StoryEditor from "@/components/admin/StoryEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tarina · Ylläpito" };

type PageProps = { params: Promise<{ id: string }> };

// `/admin/stories/new` creates, any other id edits that story.
export default async function AdminStoryPage({ params }: PageProps) {
  const { id } = await params;
  const [stories, persons, places] = await Promise.all([
    getStories(),
    getPersons(),
    getPlaces(),
  ]);
  const story = id === "new" ? undefined : stories.find((s) => s.id === id);
  if (id !== "new" && !story) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/admin/stories"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Tarinat
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">
        {story ? story.title : "Uusi tarina"}
      </h1>
      <StoryEditor
        story={story}
        persons={persons.map((p) => ({ id: p.id, name: p.fullName }))}
        places={places.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
