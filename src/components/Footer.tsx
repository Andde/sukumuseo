export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--card)] mt-16">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-[color:var(--muted)] flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} Hirvosen sukumuseo</span>
        <span>Digitaalinen sukumuseo — MVP 1.0</span>
      </div>
    </footer>
  );
}
