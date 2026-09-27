import {
  Award,
  BookA,
  ChartColumn,
  GraduationCap,
  MessageCircle,
  RotateCcw,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Другие адреса, на которых этот пункт тоже подсвечивается. */
  also?: string[];
};

/** Главные разделы: нижняя панель на телефоне и боковое меню на компьютере. */
export const mainNav: NavItem[] = [
  { href: "/learn", label: "Обучение", icon: GraduationCap, also: ["/lesson"] },
  { href: "/tutor", label: "Репетитор", icon: MessageCircle },
  { href: "/words", label: "Словарь", icon: BookA },
  { href: "/mistakes", label: "Ошибки", icon: RotateCcw },
  { href: "/exams", label: "Экзамены", icon: Award },
  { href: "/progress", label: "Прогресс", icon: ChartColumn },
];

/** Профиль: в боковом меню на компьютере и по аватару в шапке на телефоне. */
export const profileNav: NavItem = {
  href: "/profile",
  label: "Профиль",
  icon: UserRound,
  also: ["/level-test"],
};

function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Активен ли пункт меню для текущего адреса страницы. */
export function isActiveItem(pathname: string, item: NavItem) {
  return [item.href, ...(item.also ?? [])].some((href) => matchesPath(pathname, href));
}
