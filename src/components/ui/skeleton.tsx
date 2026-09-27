import { cn } from "@/lib/utils";

/** Серая «заготовка» содержимого с мягким переливом — пока страница загружается. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton block rounded-xl", className)} />;
}

/** Заготовка карточки: заголовок и несколько строк. */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex flex-col gap-3 rounded-2xl border-2 bg-card p-5", className)}>
      <Skeleton className="h-5 w-2/5" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-4", index === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}
