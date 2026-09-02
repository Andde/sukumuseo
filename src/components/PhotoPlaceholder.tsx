type Props = {
  label?: string;
  className?: string;
  aspect?: "square" | "landscape" | "portrait";
};

const aspectClass = {
  square: "aspect-square",
  landscape: "aspect-[4/3]",
  portrait: "aspect-[3/4]",
} as const;

export default function PhotoPlaceholder({
  label,
  className = "",
  aspect = "landscape",
}: Props) {
  return (
    <div
      className={`${aspectClass[aspect]} w-full bg-[color:var(--border)]/40 border border-[color:var(--border)] flex items-center justify-center text-[color:var(--muted)] ${className}`}
    >
      <div className="text-center px-3">
        <div className="text-3xl mb-1">📷</div>
        <div className="text-xs italic line-clamp-2">
          {label ?? "Ei kuvaa"}
        </div>
      </div>
    </div>
  );
}
