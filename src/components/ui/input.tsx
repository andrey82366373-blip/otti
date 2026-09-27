import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // text-base (16 px) — чтобы телефон не увеличивал страницу при вводе
        "h-12 w-full min-w-0 rounded-xl border-2 border-input bg-card px-4 text-base font-semibold text-foreground transition-colors outline-none placeholder:font-normal placeholder:text-muted-foreground/70",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
