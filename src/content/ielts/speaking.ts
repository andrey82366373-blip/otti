/**
 * IELTS Speaking: оригинальные вопросы и карточки тем для трёх частей экзамена.
 */
import type { SpeakingTask } from "@/content/ielts/types";

export const SPEAKING_TASKS: SpeakingTask[] = [
  /* ─────────────── Part 1: короткие вопросы о себе ─────────────── */
  {
    id: "s1-hometown",
    part: 1,
    topic: "Your hometown",
    questions: [
      "Where is your hometown?",
      "What do you like most about living there?",
      "Has your hometown changed much in recent years?",
      "Would you like to live somewhere else in the future? Why?",
    ],
    prepSeconds: 0,
    answerSeconds: 40,
    ideas: [
      "Отвечай 2–3 предложениями: ответ + причина + пример.",
      "It's a medium-sized city in … , about … from …",
      "What I like most is … because …",
      "It has changed quite a lot. For example, …",
    ],
  },
  {
    id: "s1-free-time",
    part: 1,
    topic: "Free time",
    questions: [
      "What do you usually do in your free time?",
      "Do you prefer spending free time indoors or outdoors?",
      "Did you have more free time when you were a child?",
      "Is there a new hobby you would like to try?",
    ],
    prepSeconds: 0,
    answerSeconds: 40,
    ideas: [
      "I'm really into … / I spend most of my free time …",
      "It depends on the weather, but generally …",
      "When I was a child, I definitely had more … because …",
      "I've always wanted to try … because …",
    ],
  },
  {
    id: "s1-food",
    part: 1,
    topic: "Food and cooking",
    questions: [
      "What kind of food do you enjoy most?",
      "Do you often cook at home?",
      "Is there any food you didn't like as a child but enjoy now?",
      "Do people in your country usually eat together as a family?",
    ],
    prepSeconds: 0,
    answerSeconds: 40,
    ideas: [
      "I'm a big fan of … , especially …",
      "Not very often, to be honest, because …",
      "Funnily enough, I used to hate … , but now …",
      "In my country, it's quite common to …",
    ],
  },
  {
    id: "s1-technology",
    part: 1,
    topic: "Technology",
    questions: [
      "Which piece of technology do you use most every day?",
      "Do you think you spend too much time on your phone?",
      "How did you learn to use a computer?",
      "Is there any technology you would like to learn more about?",
    ],
    prepSeconds: 0,
    answerSeconds: 40,
    ideas: [
      "Without a doubt, it's my … because …",
      "Probably yes. I tend to …",
      "I remember that … taught me when …",
      "I'd love to learn more about … since …",
    ],
  },

  /* ─────────────── Part 2: монолог по карточке ─────────────── */
  {
    id: "s2-skill",
    part: 2,
    topic: "A skill you would like to learn",
    questions: [],
    cueCard: {
      prompt: "Describe a skill you would like to learn.",
      points: ["what the skill is", "why you want to learn it", "how you would learn it"],
      closing: "and explain how this skill could be useful to you in the future.",
    },
    prepSeconds: 60,
    answerSeconds: 120,
    ideas: [
      "За минуту подготовки запиши 3–4 ключевых слова на каждый пункт, а не целые предложения.",
      "I'd like to talk about … , which is something I've wanted to learn for a long time.",
      "The main reason is that …",
      "I think the best way to learn it would be to …",
      "In the future, it could help me to …",
    ],
  },
  {
    id: "s2-water-place",
    part: 2,
    topic: "A place near water",
    questions: [],
    cueCard: {
      prompt: "Describe a place near water (a river, lake or sea) that you enjoy visiting.",
      points: ["where it is", "how often you go there", "what you do there"],
      closing: "and explain why you enjoy visiting this place.",
    },
    prepSeconds: 60,
    answerSeconds: 120,
    ideas: [
      "The place I'd like to describe is … , located …",
      "I usually go there … , especially in …",
      "When I'm there, I like to …",
      "What I love most about it is the feeling of …",
    ],
  },
  {
    id: "s2-helped-someone",
    part: 2,
    topic: "A time you helped someone",
    questions: [],
    cueCard: {
      prompt: "Describe a time when you helped someone.",
      points: ["who you helped", "what the situation was", "how you helped"],
      closing: "and explain how you felt about helping this person.",
    },
    prepSeconds: 60,
    answerSeconds: 120,
    ideas: [
      "Рассказывай в прошедшем времени: Past Simple и Past Continuous.",
      "I'm going to talk about a time when I helped …",
      "It happened about … ago, when …",
      "What I did was …",
      "I felt really … because …",
    ],
  },
  {
    id: "s2-thoughtful-story",
    part: 2,
    topic: "A book, film or series that made you think",
    questions: [],
    cueCard: {
      prompt: "Describe a book, film or series that made you think.",
      points: ["what it was", "what it was about", "when you read or watched it"],
      closing: "and explain why it made you think.",
    },
    prepSeconds: 60,
    answerSeconds: 120,
    ideas: [
      "The … I'd like to talk about is … , which I watched / read …",
      "It tells the story of …",
      "What really struck me was …",
      "It made me reconsider …",
    ],
  },

  /* ─────────────── Part 3: обсуждение ─────────────── */
  {
    id: "s3-learning",
    part: 3,
    topic: "Learning new skills",
    questions: [
      "Why do some adults find it difficult to learn new skills?",
      "Is it better to learn a skill from a teacher or by yourself online?",
      "Which skills will be most important for young people in the future?",
      "Should employers pay for their workers to learn new skills?",
    ],
    prepSeconds: 0,
    answerSeconds: 60,
    ideas: [
      "В Part 3 отвечай развёрнуто: мнение → причина → пример → иногда другая точка зрения.",
      "I think there are a few reasons for this. First, …",
      "It depends on … . For example, …",
      "Some people would argue that … , but in my view …",
    ],
  },
  {
    id: "s3-environment",
    part: 3,
    topic: "Rivers, lakes and the environment",
    questions: [
      "Why are places near water often popular with tourists?",
      "What are the main causes of water pollution in your country?",
      "Who should be responsible for keeping rivers and lakes clean: governments or individuals?",
      "Do you think people will care more about nature in the future?",
    ],
    prepSeconds: 0,
    answerSeconds: 60,
    ideas: [
      "One reason is that … . Another is …",
      "The main problem, in my opinion, is …",
      "I believe it should be a shared responsibility, because …",
      "It's hard to predict, but I suspect that …",
    ],
  },
  {
    id: "s3-community",
    part: 3,
    topic: "Helping others",
    questions: [
      "Why do some people enjoy doing volunteer work?",
      "Are people today less helpful than they were in the past?",
      "Should schools teach children to help others in the community?",
      "How can technology help people support each other?",
    ],
    prepSeconds: 0,
    answerSeconds: 60,
    ideas: [
      "I'd say the main reason is …",
      "Not necessarily. Although … , …",
      "Absolutely, because …",
      "A good example is …",
    ],
  },
  {
    id: "s3-media",
    part: 3,
    topic: "Books, films and ideas",
    questions: [
      "Do films and series influence the way young people think?",
      "Why do some people prefer reading books to watching films?",
      "Should governments control what is shown on television and online?",
      "Will people still read printed books in twenty years?",
    ],
    prepSeconds: 0,
    answerSeconds: 60,
    ideas: [
      "To a certain extent, yes. For instance, …",
      "People who prefer books often say that …",
      "This is a complex issue. On the one hand, … On the other hand, …",
      "I suspect that printed books will …",
    ],
  },
];

export function getSpeakingTask(id: string): SpeakingTask | undefined {
  return SPEAKING_TASKS.find((task) => task.id === id);
}

/** Вопросы Part 1 для диагностики. */
export const DIAGNOSTIC_SPEAKING = {
  id: "sd-diagnostic",
  questions: [
    "Tell me about the place where you live.",
    "What do you enjoy doing at the weekend?",
    "Why are you preparing for IELTS?",
  ],
  answerSeconds: 40,
};
