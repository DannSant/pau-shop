import { useState } from "react";
import { Star } from "lucide-react";
import { t } from "../../i18n";

const SIZES = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" };

// Read-only stars; fractional values are partly filled (3.5 -> three and a half).
export function StarRating({ value, size = "md" }: { value: number; size?: keyof typeof SIZES }) {
  const percent = Math.max(0, Math.min(5, value)) * 20;

  return (
    <span className="relative inline-flex" role="img" aria-label={`${value} ${t.reviews.outOfFive}`}>
      <span className="flex text-gray-300">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={SIZES[size]} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-amber-400" style={{ width: `${percent}%` }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={`${SIZES[size]} shrink-0`} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
    </span>
  );
}

// Clickable 1-5 picker.
export function StarRatingInput({ value, onChange }: { value: number; onChange: (score: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={t.reviews.starLabel(n)}
          aria-pressed={value === n}
          className="cursor-pointer"
          onMouseEnter={() => setHovered(n)}
          onClick={() => onChange(n)}
        >
          <Star
            className={`w-8 h-8 transition ${n <= shown ? "text-amber-400" : "text-gray-300"}`}
            fill="currentColor"
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  );
}
