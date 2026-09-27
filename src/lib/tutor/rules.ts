/** Правила чата с Отти: опыт и дневная задача. Без обращений к базе. */

/** XP за сообщение ученика на английском. */
export const CHAT_MESSAGE_XP = 1;
/** Сколько сообщений в день приносят XP — чтобы опыт не набирали одними сообщениями. */
export const CHAT_XP_MESSAGES_PER_DAY = 10;
/** XP за завершённое занятие с итогами. */
export const CHAT_SUMMARY_XP = 5;
/** Сколько сообщений нужно для задачи «Поговорить с Отти». */
export const CHAT_DAILY_TASK_MESSAGES = 3;
/** Сколько новых разговоров можно начать за день. */
export const CHAT_THREADS_PER_DAY = 20;
/** Минимум сообщений ученика, чтобы подвести итоги. */
export const CHAT_MIN_MESSAGES_FOR_SUMMARY = 2;

/** Похоже ли сообщение на английскую фразу: хотя бы два слова латиницей. */
export function isEnglishPhrase(text: string): boolean {
  return (text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).length >= 2;
}
