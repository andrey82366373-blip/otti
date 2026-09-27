/** Работа с датами с учётом часового пояса ученика. Даты хранятся как строки ГГГГ-ММ-ДД. */

function formatDay(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Сегодняшняя дата в формате ГГГГ-ММ-ДД в указанном часовом поясе. */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  try {
    return formatDay(timezone, now);
  } catch {
    // Неизвестный часовой пояс — считаем по Москве
    return formatDay("Europe/Moscow", now);
  }
}

/** Сдвигает дату ГГГГ-ММ-ДД на delta дней (может быть отрицательным). */
export function addDays(day: string, delta: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + delta)).toISOString().slice(0, 10);
}

/** Последние count дней, заканчивая today (от старых к новым). */
export function lastDays(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(today, index - (count - 1)));
}

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** «26 сентября» */
export function formatDayLong(day: string): string {
  const [, month, date] = day.split("-").map(Number);
  return `${date} ${MONTHS[month - 1]}`;
}

/** «пн», «вт»… */
export function weekdayShort(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, date)).getUTCDay()];
}
