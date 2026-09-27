import { LoaderCircle } from "lucide-react";

import { Otti } from "@/components/otti";

/** Пока страница загружается — меню остаётся на месте, а вместо содержимого крутится значок. */
export default function Loading() {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Otti size={72} />
      <p className="flex items-center gap-2 font-bold text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" aria-hidden />
        Загружаем…
      </p>
    </div>
  );
}
