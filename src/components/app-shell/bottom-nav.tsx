"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveItem, mainNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Нижняя панель навигации — видна только на телефоне (экран уже 768 px). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Основное меню"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {mainNav.map((item) => {
          const { href, label, icon: Icon } = item;
          const active = isActiveItem(pathname, item);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-bold transition-colors outline-none focus-visible:bg-muted",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-secondary",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
