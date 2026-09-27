import Link from "next/link";

import { Otti } from "@/components/otti";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
};

/** Логотип: мордочка Отти и название приложения. */
export function Logo({ href = "/", className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <Otti size={36} />
      <span className="text-2xl font-black tracking-tight">Otti</span>
      <span className="sr-only"> — на главную</span>
    </Link>
  );
}
