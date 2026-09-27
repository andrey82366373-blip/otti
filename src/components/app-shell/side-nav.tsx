"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";
import { isActiveItem, mainNav, profileNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Боковое меню — видно только на экранах от 768 px (планшет и компьютер). */
export function SideNav() {
  const pathname = usePathname();
  const items = [...mainNav, profileNav];

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card/50 px-4 py-6 md:flex">
      <Logo href="/learn" className="ml-2 self-start" />

      <nav aria-label="Основное меню" className="mt-8">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const { href, label, icon: Icon } = item;
            const active = isActiveItem(pathname, item);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-5", active && "text-primary")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-auto px-3 text-xs text-muted-foreground">
        Otti · версия 0.1
      </p>
    </aside>
  );
}
