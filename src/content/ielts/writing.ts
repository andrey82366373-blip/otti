/**
 * IELTS Writing: оригинальные задания Task 1 (Academic и General Training) и Task 2.
 * Данные графиков вымышлены и созданы для тренировки.
 */
import type { WritingTask } from "@/content/ielts/types";

const REPORT_STRUCTURE = [
  { title: "1. Вступление (1 предложение)", text: "Перескажи задание своими словами: что показывает график, где и за какой период." },
  {
    title: "2. Overview — общий обзор (2 предложения)",
    text: "Главные тенденции без цифр: что выросло или упало сильнее всего, что самое большое и самое маленькое. Без обзора Task Achievement не выше 5.",
  },
  { title: "3. Детали (абзац 1)", text: "Сгруппируй данные и сравни их с цифрами. Не перечисляй всё подряд — выбирай важное." },
  { title: "4. Детали (абзац 2)", text: "Вторая группа данных или вторая половина периода. Мнение и причины не нужны." },
];

const REPORT_PHRASES = [
  "The chart compares … in terms of …",
  "Overall, it is clear that …",
  "… rose sharply / slightly from … to …",
  "… remained stable at around …",
  "In contrast, … / By comparison, …",
  "… accounted for the largest proportion of …",
];

const LETTER_STRUCTURE = [
  { title: "1. Обращение", text: "Formal: Dear Sir or Madam, / Dear Mr Smith,. Informal: Dear Anna, / Hi Tom,." },
  { title: "2. Цель письма (1–2 предложения)", text: "Сразу скажи, зачем пишешь: I am writing to… / I'm writing to tell you…" },
  {
    title: "3. Три пункта задания — по абзацу на каждый",
    text: "Раскрой каждый пункт из задания подробно. Пропущенный пункт сильно снижает оценку за Task Achievement.",
  },
  { title: "4. Завершение и подпись", text: "Formal: I look forward to hearing from you. Yours faithfully / sincerely. Informal: Best wishes, / Take care," },
];

const ESSAY_STRUCTURE = [
  { title: "1. Вступление (2–3 предложения)", text: "Перефразируй тему и чётко напиши свою позицию (thesis), если спрашивают мнение." },
  {
    title: "2. Основной абзац 1",
    text: "Одна главная идея → объяснение → пример. Начни с понятного topic sentence.",
  },
  { title: "3. Основной абзац 2", text: "Вторая идея (или противоположная точка зрения) → объяснение → пример." },
  { title: "4. Заключение (2 предложения)", text: "Повтори позицию другими словами. Новых аргументов в заключении не добавляй." },
];

const ESSAY_PHRASES = [
  "It is often argued that …",
  "In my view, … / I strongly believe that …",
  "One major advantage of … is that …",
  "For instance, … / A good example of this is …",
  "On the other hand, … / Nevertheless, …",
  "In conclusion, …",
];

export const WRITING_TASKS: WritingTask[] = [
  /* ─────────────── Task 1 Academic ─────────────── */
  {
    id: "w1a-cycling",
    task: 1,
    module: "academic",
    title: "Cycling to work in four cities",
    kindTitle: "Столбчатая диаграмма",
    prompt:
      "The chart below shows the percentage of workers who cycled to work in four cities in 2005 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
    chart: {
      type: "bar",
      title: "Workers who cycled to work (%)",
      unit: "%",
      categories: ["Riverton", "Oakfield", "Portmere", "Hillsby"],
      series: [
        { name: "2005", values: [8, 15, 4, 11] },
        { name: "2025", values: [21, 18, 12, 9] },
      ],
    },
    minWords: 150,
    minutes: 20,
    structure: REPORT_STRUCTURE,
    phrases: REPORT_PHRASES,
  },
  {
    id: "w1a-visitors",
    task: 1,
    module: "academic",
    title: "Visitors to attractions in a coastal town",
    kindTitle: "Линейный график",
    prompt:
      "The graph below shows the number of visitors (in thousands) to three types of attraction in a coastal town between 2015 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
    chart: {
      type: "line",
      title: "Visitors (thousands)",
      unit: "",
      categories: ["2015", "2017", "2019", "2020", "2021", "2023"],
      series: [
        { name: "Beaches", values: [400, 420, 380, 210, 450, 470] },
        { name: "Theme park", values: [250, 260, 300, 120, 280, 330] },
        { name: "Museums", values: [120, 135, 150, 90, 160, 175] },
      ],
    },
    minWords: 150,
    minutes: 20,
    structure: REPORT_STRUCTURE,
    phrases: REPORT_PHRASES,
  },
  {
    id: "w1a-student-time",
    task: 1,
    module: "academic",
    title: "How students spend their week",
    kindTitle: "Таблица",
    prompt:
      "The table below shows the average number of hours per week that university students in one country spent on five activities in 2010 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
    chart: {
      type: "table",
      title: "Average hours per week",
      columns: ["Activity", "2010", "2025"],
      rows: [
        ["Studying", "20", "18"],
        ["Paid work", "6", "11"],
        ["Social media", "5", "14"],
        ["Sport", "4", "3"],
        ["Reading for pleasure", "3", "1.5"],
      ],
    },
    minWords: 150,
    minutes: 20,
    structure: REPORT_STRUCTURE,
    phrases: REPORT_PHRASES,
  },

  /* ─────────────── Task 1 General Training ─────────────── */
  {
    id: "w1g-heating",
    task: 1,
    module: "general",
    title: "Heating problem in a rented flat",
    kindTitle: "Официальное письмо-жалоба",
    prompt:
      "You recently moved into a rented flat, and the heating does not work properly.\n\nWrite a letter to your landlord. In your letter:\n• describe the problem\n• explain how it is affecting you\n• say what you would like the landlord to do\n\nWrite at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear Mr Collins,",
    minWords: 150,
    minutes: 20,
    structure: LETTER_STRUCTURE,
    phrases: [
      "I am writing to inform you about …",
      "Unfortunately, since I moved in, …",
      "This has caused a number of problems. For example, …",
      "I would be grateful if you could …",
      "I look forward to hearing from you.",
      "Yours sincerely,",
    ],
  },
  {
    id: "w1g-friend-visit",
    task: 1,
    module: "general",
    title: "A friend's first visit to your country",
    kindTitle: "Неофициальное письмо другу",
    prompt:
      "A friend from another country is planning to visit your country for the first time.\n\nWrite a letter to your friend. In your letter:\n• suggest the best time of year to visit\n• recommend some places to see\n• offer to help during the visit\n\nWrite at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear …,",
    minWords: 150,
    minutes: 20,
    structure: LETTER_STRUCTURE,
    phrases: [
      "It was great to hear that you're coming!",
      "If I were you, I'd come in …",
      "You really should see …",
      "Why don't you …? / How about …?",
      "I'd be happy to show you around.",
      "Can't wait to see you! Best wishes,",
    ],
  },
  {
    id: "w1g-evening-course",
    task: 1,
    module: "general",
    title: "Asking about an evening course",
    kindTitle: "Полуофициальное письмо-запрос",
    prompt:
      "You would like to take an evening course at a local college.\n\nWrite a letter to the college. In your letter:\n• say which course you are interested in\n• explain why you want to take this course\n• ask for information about the fees and timetable\n\nWrite at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: Dear Sir or Madam,",
    minWords: 150,
    minutes: 20,
    structure: LETTER_STRUCTURE,
    phrases: [
      "I am writing to enquire about …",
      "I am particularly interested in …",
      "The main reason is that …",
      "Could you please tell me …?",
      "I would also like to know whether …",
      "Yours faithfully,",
    ],
  },

  /* ─────────────── Task 2 (оба модуля) ─────────────── */
  {
    id: "w2-subjects",
    task: 2,
    module: "both",
    title: "Studying subjects outside your field",
    kindTitle: "Эссе-мнение (agree / disagree)",
    prompt:
      "Some people believe that university students should be required to study subjects outside their main field, such as art for engineering students or science for history students.\n\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.",
    minWords: 250,
    minutes: 40,
    structure: ESSAY_STRUCTURE,
    phrases: ESSAY_PHRASES,
  },
  {
    id: "w2-remote-work",
    task: 2,
    module: "both",
    title: "Working from home or in an office",
    kindTitle: "Эссе-обсуждение (discuss both views)",
    prompt:
      "Some people think that working from home is better for employees, while others believe that working in an office is more beneficial.\n\nDiscuss both these views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.",
    minWords: 250,
    minutes: 40,
    structure: [
      ESSAY_STRUCTURE[0],
      { title: "2. Первая точка зрения", text: "Почему некоторые считают, что работать из дома лучше: 1–2 причины с примерами." },
      { title: "3. Вторая точка зрения", text: "Почему другие предпочитают офис: 1–2 причины с примерами." },
      { title: "4. Заключение и твоё мнение", text: "Своё мнение нужно высказать ясно — во вступлении и в заключении." },
    ],
    phrases: ESSAY_PHRASES,
  },
  {
    id: "w2-traffic",
    task: 2,
    module: "both",
    title: "Traffic congestion in cities",
    kindTitle: "Эссе «причины и решения»",
    prompt:
      "In many cities around the world, traffic congestion is becoming a serious problem.\n\nWhat are the main causes of this problem, and what measures could be taken to solve it?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.",
    minWords: 250,
    minutes: 40,
    structure: [
      { title: "1. Вступление", text: "Перефразируй проблему и скажи, что обсудишь причины и решения." },
      { title: "2. Причины", text: "2 главные причины, каждая с объяснением и примером." },
      { title: "3. Решения", text: "Решения, которые отвечают на названные причины. Хорошо, если каждое решение связано с конкретной причиной." },
      { title: "4. Заключение", text: "Коротко повтори главные причины и решения." },
    ],
    phrases: [
      "One of the main causes of … is …",
      "This is largely due to …",
      "As a result, … / Consequently, …",
      "One effective solution would be to …",
      "Governments could also …",
      "In conclusion, …",
    ],
  },
  {
    id: "w2-language-apps",
    task: 2,
    module: "both",
    title: "Learning languages with apps",
    kindTitle: "Эссе «преимущества и недостатки»",
    prompt:
      "More and more people are choosing to learn foreign languages through mobile apps rather than in a classroom.\n\nDo the advantages of this development outweigh the disadvantages?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.",
    minWords: 250,
    minutes: 40,
    structure: [
      { title: "1. Вступление", text: "Перефразируй тему и дай прямой ответ: что перевешивает — плюсы или минусы." },
      { title: "2. Преимущества", text: "1–2 преимущества с объяснением и примером." },
      { title: "3. Недостатки", text: "1–2 недостатка. Покажи, почему они весомее или слабее преимуществ." },
      { title: "4. Заключение", text: "Повтори свой ответ на вопрос задания другими словами." },
    ],
    phrases: [
      "The main benefit of … is that …",
      "Another advantage is …",
      "However, a significant drawback is …",
      "While … , I believe that …",
      "On balance, the advantages outweigh / do not outweigh …",
      "In conclusion, …",
    ],
  },
];

export function getWritingTask(id: string): WritingTask | undefined {
  return WRITING_TASKS.find((task) => task.id === id);
}

/** Короткое письменное задание для диагностики (80–120 слов). */
export const DIAGNOSTIC_WRITING = {
  id: "wd-diagnostic",
  prompt:
    "Some people prefer to spend their free time alone, while others prefer to spend it with other people. Which do you prefer and why? Write 80–120 words.",
  minWords: 80,
  maxWords: 160,
  minutes: 12,
};
