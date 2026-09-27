import { cn } from "@/lib/utils";

type ProgressProps = {
  /** Значение от 0 до max. */
  value: number;
  max?: number;
  label: string;
  className?: string;
  barClassName?: string;
};

/** Полоса прогресса. */
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
        className={cn("h-full rounded-full bg-primary transition-[width] duration-500 ease-out", barClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
