import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

/** Заготовки страниц на время загрузки — вместо пустого экрана. Экранный диктор слышит «Загружаем…». */

function Loading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">Загружаем…</span>
      {children}
    </div>
  );
}

/** Общая заготовка: заголовок и несколько карточек. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <Loading className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {Array.from({ length: cards }, (_, index) => (
        <SkeletonCard key={index} lines={index === 0 ? 4 : 3} />
      ))}
    </Loading>
  );
}

/** Главная: карточка «Сегодня» и учебная карта. */
export function LearnSkeleton() {
  return (
    <Loading className="flex flex-col gap-5">
      <div className="flex items-center gap-4 rounded-2xl border-2 bg-card p-5">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      </div>
      <SkeletonCard lines={3} />
      <div className="flex flex-col gap-3 rounded-2xl border-2 bg-card p-5">
        <Skeleton className="h-6 w-1/2" />
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </Loading>
  );
}

/** Список: словарь, ошибки, разговоры. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Loading className="flex flex-col gap-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex flex-col divide-y rounded-2xl border-2 bg-card">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 p-4">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </Loading>
  );
}

/** Экран упражнения (урок, тренировка, повторение). */
export function ExerciseSkeleton() {
  return (
    <Loading className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-5">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-4 flex-1 rounded-full" />
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pt-8">
        <Skeleton className="h-6 w-3/5" />
        <SkeletonCard lines={2} className="py-8" />
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** Чат с Отти. */
export function ChatSkeleton() {
  return (
    <Loading className="flex h-dvh flex-col">
      <div className="border-b">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-5">
        <div className="flex items-start gap-2.5">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-20 w-3/4 rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-1/2 self-end rounded-2xl" />
        <div className="flex items-start gap-2.5">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-16 w-2/3 rounded-2xl" />
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-2xl gap-2 px-4 py-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="size-11 rounded-xl" />
        </div>
      </div>
    </Loading>
  );
}
