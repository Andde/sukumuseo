// "Rauhalan tilan alkuvaiheet" -> "rauhalan-tilan-alkuvaiheet". Finnish
// letters are folded to ASCII so the URL stays readable.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äå]/g, "a")
    .replace(/ö/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(base: string, taken: string[]): string {
  const root = base || "tarina";
  let slug = root;
  for (let i = 2; taken.includes(slug); i++) slug = `${root}-${i}`;
  return slug;
}
