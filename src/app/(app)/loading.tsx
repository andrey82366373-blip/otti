import { PageSkeleton } from "@/components/ui/page-skeletons";

/** Пока страница загружается — меню остаётся на месте, а вместо содержимого видны заготовки. */
export default function Loading() {
  return <PageSkeleton />;
}
