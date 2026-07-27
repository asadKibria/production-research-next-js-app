"use client";

export function RatingInput({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {label ? <span className="text-sm font-medium text-ink-700">{label}</span> : null}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} star`}
            aria-pressed={value !== null && value >= n}
            className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg transition-colors ${
              value !== null && value >= n
                ? "border-plum-900 bg-plum-900 text-cream-050"
                : "border-cream-200 text-ink-700 hover:border-plum-700"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
