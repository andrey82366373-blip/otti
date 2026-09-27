import { cn } from "@/lib/utils";

type ProgressProps = {
  /** Значение от 0 до max. */
  value: number;
  max?: number;
  label: string;
  className?: string;
  barClassName?: string;
};

/**
 * Полоса прогресса. При появлении плавно заполняется с нуля (CSS @starting-style),
 * при каждом изменении по ней пробегает блик.
 */
export function Progress({ value, max = 100, label, className, barClassName }: ProgressProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-3 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "relative h-full w-(--progress) overflow-hidden rounded-full bg-primary transition-[width] duration-700 ease-out starting:w-0",
          barClassName,
        )}
        style={{ "--progress": `${percent}%` } as React.CSSProperties}
      >
        {percent > 0 && (
          <span
            key={value}
            aria-hidden
            className="animate-glint absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/45 to-transparent"
            style={{ transform: "translateX(-120%)" }}
          />
        )}
      </div>
    </div>
  );
}
