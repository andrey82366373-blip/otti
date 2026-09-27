import { LoaderCircle } from "lucide-react";

import { Otti } from "@/components/otti";

export default function Loading() {
  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <Otti size={80} />
      <p className="flex items-center gap-2 font-bold text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" aria-hidden />
        Загружаем…
      </p>
    </div>
  );
}
