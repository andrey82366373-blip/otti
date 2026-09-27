/**
 * Темы разговоров с Отти. Первая реплика Отти — готовая (не тратит запрос к ИИ),
 * дальше разговор ведёт ИИ по инструкции темы.
 */
import type { LearningGoal } from "@/lib/learning";

export const SCENARIO_IDS = ["free", "about-me", "my-day", "cafe", "travel", "interview", "words"] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export type Scenario = {
  id: ScenarioId;
  title: string;
  description: string;
  /** Для каких целей тема подходит лучше всего — их показываем первыми. */
  goals: LearningGoal[];
  /** Что делать ИИ в этом разговоре. */
  instruction: string;
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  free: {
    id: "free",
    title: "Свободный разговор",
    description: "Болтаем о чём угодно: настроение, планы, увлечения",
    goals: ["conversation"],
    instruction:
      "Свободная беседа на повседневные темы. Задавай простые вопросы об интересах, планах и делах ученика.",
  },
  "about-me": {
    id: "about-me",
    title: "Расскажи о себе",
    description: "Откуда ты, чем занимаешься, что любишь",
    goals: ["conversation", "study", "exam"],
    instruction:
      "Тема — знакомство: откуда ученик, где учится или работает, семья, увлечения. Задавай по одному вопросу.",
  },
  "my-day": {
    id: "my-day",
    title: "Мой день",
    description: "Распорядок дня и привычки — тренируем Present Simple",
    goals: ["conversation", "grammar", "study"],
    instruction:
      "Тема — распорядок дня и привычки ученика. Тренируй Present Simple: во сколько встаёт, что делает утром, днём, вечером.",
  },
  cafe: {
    id: "cafe",
    title: "В кафе",
    description: "Ролевая игра: ты — посетитель, Отти — официант",
    goals: ["travel", "conversation"],
    instruction:
      "Ролевая игра: ты официант в кафе, ученик — посетитель. Веди заказ по шагам: напитки, еда, вопросы о меню, счёт.",
  },
  travel: {
    id: "travel",
    title: "В отеле",
    description: "Ролевая игра: заселение и вопросы администратору",
    goals: ["travel"],
    instruction:
      "Ролевая игра: ты администратор отеля, ученик — гость. Заселение, бронь, вопросы об отеле и городе, просьбы и проблемы в номере.",
  },
  interview: {
    id: "interview",
    title: "Собеседование",
    description: "Отти задаёт типичные вопросы интервьюера",
    goals: ["work"],
    instruction:
      "Ролевая игра: ты интервьюер, ученик — кандидат на работу. Задавай типичные вопросы собеседования по одному: о себе, опыте, сильных сторонах, планах.",
  },
  words: {
    id: "words",
    title: "Практика слов",
    description: "Составляем предложения со словами из твоего словаря",
    goals: ["grammar", "exam", "study"],
    instruction:
      "Цель — потренировать слова ученика из первого сообщения Отти. Проси составлять с ними предложения, по одному слову за раз, и хвали удачные примеры.",
  },
};

export function isScenarioId(value: string | null | undefined): value is ScenarioId {
  return SCENARIO_IDS.some((id) => id === value);
}

export function getScenario(id: string | null | undefined): Scenario {
  return isScenarioId(id) ? SCENARIOS[id] : SCENARIOS.free;
}

/** Темы в порядке: сначала подходящие для цели ученика. */
export function scenariosForGoal(goal: LearningGoal): Scenario[] {
  const all = SCENARIO_IDS.map((id) => SCENARIOS[id]);
  return [...all.filter((item) => item.goals.includes(goal)), ...all.filter((item) => !item.goals.includes(goal))];
}

/** Первая реплика Отти для темы. words — слова для «Практики слов». */
export function scenarioOpener(id: ScenarioId, fullName: string, words: string[]): { en: string; ru: string } {
  // Для приветствия хватает первого слова имени
  const name = fullName.trim().split(/\s+/)[0]?.slice(0, 30) || "friend";
  switch (id) {
    case "free":
      return { en: `Hi, ${name}! I'm Otti. How are you today?`, ru: `Привет, ${name}! Я Отти. Как ты сегодня?` };
    case "about-me":
      return {
        en: "Hi! I'd like to know you better. Where are you from?",
        ru: "Привет! Хочу узнать тебя получше. Откуда ты?",
      };
    case "my-day":
      return {
        en: "Let's talk about your day. What time do you usually get up?",
        ru: "Давай поговорим о твоём дне. Во сколько ты обычно встаёшь?",
      };
    case "cafe":
      return {
        en: "Welcome to our café! I'm your waiter today. What would you like to drink?",
        ru: "Добро пожаловать в наше кафе! Я сегодня ваш официант. Что будете пить?",
      };
    case "travel":
      return {
        en: "Good evening! Welcome to the Sunny Hotel. Do you have a reservation?",
        ru: "Добрый вечер! Добро пожаловать в отель «Санни». У вас есть бронь?",
      };
    case "interview":
      return {
        en: "Hello, and thank you for coming. Could you tell me a little about yourself?",
        ru: "Здравствуйте, спасибо, что пришли. Расскажите, пожалуйста, немного о себе.",
      };
    case "words": {
      const list = words.slice(0, 3);
      if (list.length === 0) {
        return {
          en: "Let's practise some words! What do you like to do at the weekend?",
          ru: "Давай потренируем слова! Что ты любишь делать на выходных?",
        };
      }
      const joined = list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
      const joinedRu = list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} и ${list[list.length - 1]}`;
      return {
        en: `Let's practise your words: ${joined}. Can you make a sentence with "${list[0]}"?`,
        ru: `Потренируем твои слова: ${joinedRu}. Составишь предложение со словом «${list[0]}»?`,
      };
    }
  }
}
