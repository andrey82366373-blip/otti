import { cn } from "@/lib/utils";

export type OttiMood = "happy" | "wink" | "confused";

type OttiProps = {
  /** Размер в пикселях (ширина = высота). */
  size?: number;
  /** Настроение: обычная улыбка, подмигивание или растерянность. */
  mood?: OttiMood;
  className?: string;
  /** Подпись для экранных дикторов. Если не указана — картинка считается декоративной. */
  label?: string;
};

/** Маскот приложения — выдра Отти. Нарисован кодом (SVG), цвета берутся из темы. */
export function Otti({ size = 96, mood = "happy", className, label }: OttiProps) {
  const decorative = !label;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={cn("shrink-0", className)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={label}
    >
      {/* Маленькие уши по бокам */}
      <ellipse cx="19" cy="50" rx="8" ry="8.5" className="fill-otti-fur-dark" />
      <ellipse cx="101" cy="50" rx="8" ry="8.5" className="fill-otti-fur-dark" />
      <ellipse cx="20" cy="50" rx="3.8" ry="4.2" className="fill-otti-cream" opacity="0.5" />
      <ellipse cx="100" cy="50" rx="3.8" ry="4.2" className="fill-otti-cream" opacity="0.5" />

      {/* Голова */}
      <path
        d="M60 22 C88 22 106 40 106 64 C106 88 86 102 60 102 C34 102 14 88 14 64 C14 40 32 22 60 22Z"
        className="fill-otti-fur"
      />

      {/* Светлая мордочка */}
      <path
        d="M60 50 C80 50 94 62 94 78 C94 92 79 100 60 100 C41 100 26 92 26 78 C26 62 40 50 60 50Z"
        className="fill-otti-cream"
      />

      {/* Румянец */}
      <ellipse cx="30" cy="72" rx="6" ry="3.6" className="fill-otti-blush" opacity="0.55" />
      <ellipse cx="90" cy="72" rx="6" ry="3.6" className="fill-otti-blush" opacity="0.55" />

      {/* Глаза */}
      <circle cx="42" cy="54" r="6.5" className="fill-otti-ink" />
      <circle cx="44.2" cy="51.6" r="2.2" fill="#ffffff" />
      {mood === "wink" ? (
        <path
          d="M72 55 Q78 48.5 84 55"
          fill="none"
          strokeWidth="3.2"
          strokeLinecap="round"
          className="stroke-otti-ink"
        />
      ) : (
        <>
          <circle cx="78" cy="54" r="6.5" className="fill-otti-ink" />
          <circle cx="80.2" cy="51.6" r="2.2" fill="#ffffff" />
        </>
      )}

      {/* Брови — только когда Отти растерян */}
      {mood === "confused" && (
        <g fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-otti-ink">
          <path d="M35 45.5 Q41.5 42 49 42.5" />
          <path d="M71 41.5 Q78 36.5 86 40.5" />
        </g>
      )}

      {/* Подушечки с усами */}
      <circle cx="51.5" cy="75" r="10.5" className="fill-otti-cream" />
      <circle cx="68.5" cy="75" r="10.5" className="fill-otti-cream" />
      <circle cx="51.5" cy="75" r="10.5" fill="#ffffff" opacity="0.4" />
      <circle cx="68.5" cy="75" r="10.5" fill="#ffffff" opacity="0.4" />
      <g className="fill-otti-ink" opacity="0.45">
        <circle cx="47" cy="73" r="1.2" />
        <circle cx="45" cy="78" r="1.2" />
        <circle cx="50.5" cy="79" r="1.2" />
        <circle cx="73" cy="73" r="1.2" />
        <circle cx="75" cy="78" r="1.2" />
        <circle cx="69.5" cy="79" r="1.2" />
      </g>

      {/* Нос */}
      <path
        d="M52.5 65.5 Q60 62.5 67.5 65.5 Q67 71.5 60 73 Q53 71.5 52.5 65.5Z"
        className="fill-otti-ink"
      />
      <ellipse cx="57" cy="66" rx="2.4" ry="1.1" fill="#ffffff" opacity="0.6" />

      {/* Рот */}
      <path
        d={mood === "confused" ? "M54 89 Q57 86.5 60 89 Q63 91.5 66 89" : "M54 88 Q60 93.5 66 88"}
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="stroke-otti-ink"
      />

      {/* Усы */}
      <g strokeWidth="1.5" strokeLinecap="round" className="stroke-otti-ink" opacity="0.35">
        <path d="M42 74 L8 68" />
        <path d="M42 79 L7 80" />
        <path d="M43 83 L10 91" />
        <path d="M78 74 L112 68" />
        <path d="M78 79 L113 80" />
        <path d="M77 83 L110 91" />
      </g>
    </svg>
  );
}
