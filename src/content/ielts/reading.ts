/**
 * IELTS Reading: оригинальные тексты в экзаменационном формате.
 * Написаны для Otti; с материалами настоящих экзаменов не совпадают.
 */
import type { ReadingPassage } from "@/content/ielts/types";

const TFNG_TIP =
  "TRUE — текст говорит то же самое; FALSE — текст говорит противоположное; NOT GIVEN — в тексте об этом нет информации. Не додумывай: отвечай только по тексту.";
const YNNG_TIP =
  "YES — автор согласен с утверждением; NO — автор думает иначе; NOT GIVEN — мнение автора об этом неизвестно. Ищи оценочные слова: I believe, in my view, largely right.";
const HEADINGS_TIP =
  "Сначала прочитай все заголовки. Потом для каждого абзаца найди главную мысль (часто в первом или последнем предложении). Лишних заголовков больше, чем абзацев.";
const SENTENCE_TIP =
  "Слова для ответа берутся из текста без изменений. Проверь ограничение по количеству слов и грамматику: ответ должен встать в предложение.";
const SUMMARY_TIP =
  "Прочитай краткое содержание целиком и подумай, какая часть речи нужна в каждом пропуске (существительное, прилагательное…). Потом найди нужное место в тексте.";
const MCQ_TIP =
  "Найди в тексте место, о котором вопрос, и сравни каждый вариант с текстом. Неверные варианты часто используют слова из текста, но меняют смысл.";

export const READING_PASSAGES: ReadingPassage[] = [
  /* ─────────────────────────── Academic 1 ─────────────────────────── */
  {
    id: "ra-beavers",
    module: "academic",
    title: "Engineers with Fur: The Return of the Beaver",
    about: "Как бобры вернулись в реки Европы и почему к ним относятся по-разному.",
    level: "Band 5.5–7",
    minutes: 20,
    paragraphs: [
      {
        label: "A",
        text: "For most of the twentieth century, the Eurasian beaver was absent from large parts of the continent it had once shaped. Hunted for its fur, its meat and a scented oil used in medicine and perfume, the animal had disappeared from Britain by the end of the sixteenth century and survived elsewhere only in a handful of isolated river systems. By 1900, scientists estimate, fewer than 1,200 individuals remained across the whole of Europe and Asia.",
      },
      {
        label: "B",
        text: "The recovery began with legal protection. From the 1920s, several countries banned beaver hunting, and a number of governments started moving animals from surviving populations into rivers where they had been lost. These early programmes were modest in scale and attracted little public attention, yet they proved remarkably successful. Today the population is thought to exceed one million, and beavers can once again be found from Spain to Mongolia.",
      },
      {
        label: "C",
        text: "What makes the beaver unusual is not its numbers but its influence on the landscape. By building dams from branches, mud and stones, a single family can turn a fast-flowing stream into a chain of ponds and wetlands within a year or two. Ecologists call such species 'ecosystem engineers', because the changes they make create habitats for many other organisms. Studies in Scotland found that beaver ponds contained significantly more species of water beetles and aquatic plants than nearby streams without dams.",
      },
      {
        label: "D",
        text: "The effects are not only biological. Beaver dams slow the movement of water through a catchment, holding back part of the flow after heavy rain and releasing it gradually over the following days. Researchers monitoring a small river in south-west England recorded that peak flows downstream of a beaver site were, on average, around thirty per cent lower than before the animals arrived. Some towns that suffer from repeated flooding are now considering whether beavers could form part of their defence, alongside conventional engineering.",
      },
      {
        label: "E",
        text: "Not everyone welcomes the returning rodents, however. Farmers whose fields lie next to beaver territories have reported flooded land, blocked drainage ditches and valuable trees cut down overnight. In some regions, conflicts have become so serious that authorities issue licences allowing problem animals to be removed. Conservation groups argue that most disputes can be avoided with simple measures, such as protective wire around important trees or pipes that allow water to pass through a dam at a controlled level.",
      },
      {
        label: "F",
        text: "The beaver's comeback therefore raises a wider question about how people share space with wild animals that change the environment. Supporters see the species as a low-cost ally in the fight against flooding and the loss of biodiversity. Critics point out that the costs of living alongside beavers often fall on a small number of landowners, while the benefits are enjoyed by society as a whole. Finding a fair way to divide these costs and benefits may prove more difficult than bringing the animals back in the first place.",
      },
    ],
    groups: [
      {
        id: "ra-beavers-g1",
        kind: "heading",
        instructions:
          "Reading Passage has six paragraphs, A–F. Choose the correct heading for paragraphs B–F from the list of headings below. Paragraph A has been done as an example: i.",
        tip: HEADINGS_TIP,
        headings: [
          { id: "i", text: "A dramatic decline" },
          { id: "ii", text: "How beavers reduce the risk of floods" },
          { id: "iii", text: "The price paid by a few for the benefit of many" },
          { id: "iv", text: "Why beavers prefer slow rivers" },
          { id: "v", text: "Rebuilding populations through protection and relocation" },
          { id: "vi", text: "Creating homes for other species" },
          { id: "vii", text: "Tension with neighbouring landowners" },
          { id: "viii", text: "The high cost of reintroduction programmes" },
        ],
        questions: [
          {
            id: "ra-beavers-1",
            kind: "heading",
            paragraph: "B",
            answer: "v",
            explanation:
              "Абзац B рассказывает, как популяцию восстановили: запрет охоты (legal protection) и перевоз животных в другие реки (moving animals… into rivers). Это и есть «protection and relocation». Заголовок viii неверен: о стоимости программ в тексте нет ни слова, сказано лишь, что они были скромными (modest in scale).",
            evidence:
              "The recovery began with legal protection… governments started moving animals from surviving populations into rivers where they had been lost.",
          },
          {
            id: "ra-beavers-2",
            kind: "heading",
            paragraph: "C",
            answer: "vi",
            explanation:
              "Главная мысль абзаца C — бобры меняют ландшафт и создают места обитания для других организмов (create habitats for many other organisms). Пример с жуками и растениями в прудах это подтверждает. Заголовок iv — ловушка: медленные реки появляются из-за бобров, а не потому, что бобры их предпочитают.",
            evidence: "Ecologists call such species 'ecosystem engineers', because the changes they make create habitats for many other organisms.",
          },
          {
            id: "ra-beavers-3",
            kind: "heading",
            paragraph: "D",
            answer: "ii",
            explanation:
              "Абзац D — о том, как плотины задерживают воду после ливня, пиковый поток ниже на 30%, а города думают использовать бобров для защиты от наводнений. Это заголовок ii.",
            evidence: "Beaver dams slow the movement of water through a catchment, holding back part of the flow after heavy rain…",
          },
          {
            id: "ra-beavers-4",
            kind: "heading",
            paragraph: "E",
            answer: "vii",
            explanation:
              "Абзац E начинается со слов «Not everyone welcomes…» и описывает жалобы фермеров, чьи поля рядом с территорией бобров, — это конфликт с соседями-землевладельцами. Простые решения упомянуты в конце, но это не главная мысль абзаца.",
            evidence: "Farmers whose fields lie next to beaver territories have reported flooded land, blocked drainage ditches…",
          },
          {
            id: "ra-beavers-5",
            kind: "heading",
            paragraph: "F",
            answer: "iii",
            explanation:
              "В абзаце F главное — расходы несут немногие землевладельцы, а пользу получает всё общество. «The price paid by a few for the benefit of many» — пересказ этой мысли другими словами (перефразирование — типичный приём IELTS).",
            evidence:
              "…the costs of living alongside beavers often fall on a small number of landowners, while the benefits are enjoyed by society as a whole.",
          },
        ],
      },
      {
        id: "ra-beavers-g2",
        kind: "tfng",
        instructions:
          "Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
        tip: TFNG_TIP,
        questions: [
          {
            id: "ra-beavers-6",
            kind: "tfng",
            statement: "Beavers were still living in the wild in Britain in the 1700s.",
            answer: "FALSE",
            explanation:
              "В тексте: бобры исчезли из Британии к концу XVI века (by the end of the sixteenth century), то есть до 1600 года. Значит, в 1700-х их там уже не было — утверждение противоречит тексту.",
            evidence: "…the animal had disappeared from Britain by the end of the sixteenth century…",
          },
          {
            id: "ra-beavers-7",
            kind: "tfng",
            statement: "The first programmes to move beavers received a lot of media coverage.",
            answer: "FALSE",
            explanation:
              "Текст прямо говорит обратное: ранние программы почти не привлекли внимания публики (attracted little public attention). «A lot of media coverage» противоречит этому.",
            evidence: "These early programmes were modest in scale and attracted little public attention…",
          },
          {
            id: "ra-beavers-8",
            kind: "tfng",
            statement: "Beavers now live in more countries than at any other time in history.",
            answer: "NOT GIVEN",
            explanation:
              "Сказано, что бобров снова можно встретить от Испании до Монголии, но сравнения с прошлыми эпохами нет. Мы не знаем, больше ли стран сейчас, чем, например, 500 лет назад, — значит NOT GIVEN.",
            evidence: "…beavers can once again be found from Spain to Mongolia.",
          },
          {
            id: "ra-beavers-9",
            kind: "tfng",
            statement: "In Scotland, ponds made by beavers had more kinds of water beetle than streams without dams.",
            answer: "TRUE",
            explanation:
              "Исследования в Шотландии показали, что в прудах бобров значительно больше видов водных жуков, чем в ручьях без плотин. «More kinds» = «more species».",
            evidence:
              "…beaver ponds contained significantly more species of water beetles and aquatic plants than nearby streams without dams.",
          },
          {
            id: "ra-beavers-10",
            kind: "tfng",
            statement: "Protective wire is the most effective way of stopping beavers from cutting down trees.",
            answer: "NOT GIVEN",
            explanation:
              "Проволока упомянута как одна из простых мер (such as protective wire), но нигде не сказано, что она самая эффективная. Сравнения способов нет — NOT GIVEN.",
            evidence: "…simple measures, such as protective wire around important trees…",
          },
        ],
      },
      {
        id: "ra-beavers-g3",
        kind: "sentence",
        instructions: "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        tip: SENTENCE_TIP,
        questions: [
          {
            id: "ra-beavers-11",
            kind: "sentence",
            prompt: "Ecologists describe animals like beavers as ___ because they create habitats for other organisms.",
            answers: ["ecosystem engineers"],
            maxWords: 2,
            explanation:
              "В абзаце C: экологи называют такие виды «ecosystem engineers». Это ровно два слова, как требует задание.",
            evidence: "Ecologists call such species 'ecosystem engineers'…",
          },
          {
            id: "ra-beavers-12",
            kind: "sentence",
            prompt: "After heavy rain, beaver dams hold back some water and release it ___ over the following days.",
            answers: ["gradually"],
            maxWords: 2,
            explanation: "В абзаце D: плотины задерживают часть потока и отпускают его постепенно — «releasing it gradually».",
            evidence: "…holding back part of the flow after heavy rain and releasing it gradually over the following days.",
          },
          {
            id: "ra-beavers-13",
            kind: "sentence",
            prompt: "Critics say that the costs of beavers are mainly carried by a small number of ___.",
            answers: ["landowners"],
            maxWords: 2,
            explanation: "В абзаце F: расходы ложатся на небольшое число землевладельцев — «a small number of landowners».",
            evidence: "…the costs of living alongside beavers often fall on a small number of landowners…",
          },
        ],
      },
    ],
  },

  /* ─────────────────────────── Academic 2 ─────────────────────────── */
  {
    id: "ra-sleep",
    module: "academic",
    title: "Sleep and the Student Brain",
    about: "Что наука знает о сне, памяти и учёбе.",
    level: "Band 5.5–7",
    minutes: 20,
    paragraphs: [
      {
        label: "A",
        text: "Ask a group of university students how many hours they sleep, and many will admit to fewer than seven on a typical weeknight. Late-night study sessions, part-time jobs and the constant pull of mobile phones all compete with rest. For decades, sleep was treated as a luxury that ambitious students could sacrifice. Research over the past twenty years suggests that this view is not only wrong but counterproductive.",
      },
      {
        label: "B",
        text: "The key discovery concerns memory. During the day, new information is stored temporarily in a region of the brain called the hippocampus. While we sleep, particularly during the deep, slow-wave stages that dominate the early part of the night, this information is replayed and gradually transferred to the cortex, where it can be kept for the long term. In one well-known type of experiment, volunteers learn a list of word pairs in the evening. Those who are allowed a full night's sleep recall significantly more pairs the next morning than those who stay awake for the same period.",
      },
      {
        label: "C",
        text: "Sleep also appears to prepare the brain for learning. After a night without sleep, the hippocampus responds less strongly when people try to memorise new material, as if its storage capacity has been reduced. The practical consequence is striking: a student who stays up all night revising may arrive at an examination less able to recall what was studied and less able to learn anything new on the day itself.",
      },
      {
        label: "D",
        text: "Timing matters as well as quantity. Many teenagers and young adults experience a natural shift in their body clock, which makes them feel alert late in the evening and sleepy in the morning. When classes start early, these students are forced to wake during what is, for their bodies, the middle of the night. Several schools that moved their starting time later by around an hour reported improvements in attendance and, in some cases, in test results, although researchers caution that such studies are difficult to control.",
      },
      {
        label: "E",
        text: "None of this means that students must follow a rigid timetable. Short naps of twenty minutes or less can restore alertness without causing the heavy feeling that often follows longer daytime sleep. Regular times for going to bed and getting up, reduced screen use in the final hour before sleep, and avoiding large amounts of caffeine in the afternoon are all changes that most students can make without difficulty.",
      },
    ],
    groups: [
      {
        id: "ra-sleep-g1",
        kind: "mcq",
        instructions: "Choose the correct letter, A, B, C or D.",
        tip: MCQ_TIP,
        questions: [
          {
            id: "ra-sleep-1",
            kind: "mcq",
            prompt: "According to paragraph A, for many years students believed that sleep",
            options: [
              "was essential for academic success.",
              "could be reduced in order to achieve more.",
              "was mainly affected by mobile phones.",
              "was less important than part-time work.",
            ],
            answer: 1,
            explanation:
              "«Sleep was treated as a luxury that ambitious students could sacrifice» — сон считали роскошью, которой можно пожертвовать ради успеха. Это вариант B. Телефоны и работа упомянуты лишь как то, что конкурирует со сном.",
            evidence: "For decades, sleep was treated as a luxury that ambitious students could sacrifice.",
          },
          {
            id: "ra-sleep-2",
            kind: "mcq",
            prompt: "In the word-pair experiments described in paragraph B, the volunteers who slept",
            options: [
              "learned the list more quickly.",
              "remembered more of the list the next day.",
              "studied the list for a longer period.",
              "made fewer mistakes while learning.",
            ],
            answer: 1,
            explanation:
              "Те, кто спал, утром вспомнили значительно больше пар слов (recall significantly more pairs the next morning). Про скорость заучивания и ошибки при обучении ничего не сказано.",
            evidence: "Those who are allowed a full night's sleep recall significantly more pairs the next morning…",
          },
          {
            id: "ra-sleep-3",
            kind: "mcq",
            prompt: "What does paragraph C suggest about staying awake all night before an exam?",
            options: [
              "It helps students to remember recently studied material.",
              "It has no effect on the ability to learn new information.",
              "It can reduce the ability both to recall and to learn.",
              "It only affects students who are already tired.",
            ],
            answer: 2,
            explanation:
              "Студент после бессонной ночи хуже вспоминает выученное (less able to recall) и хуже усваивает новое (less able to learn anything new). Обе части — в варианте C.",
            evidence: "…less able to recall what was studied and less able to learn anything new on the day itself.",
          },
          {
            id: "ra-sleep-4",
            kind: "mcq",
            prompt: "The writer mentions schools that changed their starting time in order to",
            options: [
              "prove that early classes are harmful.",
              "give an example of a possible benefit of later starts.",
              "show that teenagers dislike mornings.",
              "criticise the quality of sleep research.",
            ],
            answer: 1,
            explanation:
              "Школы, сдвинувшие начало занятий, — пример возможной пользы (улучшилась посещаемость, иногда результаты). «Prove» — слишком сильно: автор сам оговаривается, что такие исследования трудно контролировать.",
            evidence: "Several schools that moved their starting time later… reported improvements in attendance…",
          },
        ],
      },
      {
        id: "ra-sleep-g2",
        kind: "summary",
        instructions:
          "Complete the summary using the list of words, A–I, below. Write the correct letter, A–I, for each answer.",
        tip: SUMMARY_TIP,
        summary:
          "During the day, new information is held for a short time in the {ra-sleep-5}. At night, especially in the {ra-sleep-6} stages of sleep, it is moved to the cortex for {ra-sleep-7} storage. Without sleep, the brain seems to have less {ra-sleep-8} for new material. Short naps can improve {ra-sleep-9}, as long as they are not too long.",
        options: [
          { id: "A", text: "hippocampus" },
          { id: "B", text: "deep" },
          { id: "C", text: "long-term" },
          { id: "D", text: "capacity" },
          { id: "E", text: "alertness" },
          { id: "F", text: "dream" },
          { id: "G", text: "temporary" },
          { id: "H", text: "cortex" },
          { id: "I", text: "memory" },
        ],
        questions: [
          {
            id: "ra-sleep-5",
            kind: "summary",
            answer: "A",
            explanation: "Днём новая информация временно хранится в гиппокампе: «stored temporarily in… the hippocampus».",
            evidence: "During the day, new information is stored temporarily in a region of the brain called the hippocampus.",
          },
          {
            id: "ra-sleep-6",
            kind: "summary",
            answer: "B",
            explanation:
              "Перенос происходит особенно в глубоких стадиях сна: «deep, slow-wave stages». F (dream) — ловушка: о сновидениях в тексте нет.",
            evidence: "…particularly during the deep, slow-wave stages that dominate the early part of the night…",
          },
          {
            id: "ra-sleep-7",
            kind: "summary",
            answer: "C",
            explanation: "В коре информация хранится долго: «kept for the long term» → long-term storage.",
            evidence: "…transferred to the cortex, where it can be kept for the long term.",
          },
          {
            id: "ra-sleep-8",
            kind: "summary",
            answer: "D",
            explanation: "После бессонной ночи как будто уменьшается «storage capacity» — ёмкость для нового материала.",
            evidence: "…as if its storage capacity has been reduced.",
          },
          {
            id: "ra-sleep-9",
            kind: "summary",
            answer: "E",
            explanation: "Короткий сон до 20 минут восстанавливает бодрость: «restore alertness».",
            evidence: "Short naps of twenty minutes or less can restore alertness…",
          },
        ],
      },
      {
        id: "ra-sleep-g3",
        kind: "sentence",
        instructions: "Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.",
        tip: SENTENCE_TIP,
        questions: [
          {
            id: "ra-sleep-10",
            kind: "sentence",
            prompt: "A natural shift in their body ___ makes many young people feel alert late at night.",
            answers: ["clock"],
            maxWords: 1,
            explanation: "«A natural shift in their body clock» — сдвиг внутренних часов организма.",
            evidence: "Many teenagers and young adults experience a natural shift in their body clock…",
          },
          {
            id: "ra-sleep-11",
            kind: "sentence",
            prompt: "Researchers warn that studies of school starting times are difficult to ___.",
            answers: ["control"],
            maxWords: 1,
            explanation: "«Researchers caution that such studies are difficult to control».",
            evidence: "…although researchers caution that such studies are difficult to control.",
          },
          {
            id: "ra-sleep-12",
            kind: "sentence",
            prompt: "Students are advised not to consume large amounts of ___ in the afternoon.",
            answers: ["caffeine"],
            maxWords: 1,
            explanation: "Совет — избегать большого количества кофеина после обеда: «avoiding large amounts of caffeine in the afternoon».",
            evidence: "…avoiding large amounts of caffeine in the afternoon…",
          },
        ],
      },
    ],
  },

  /* ─────────────────────────── Academic 3 ─────────────────────────── */
  {
    id: "ra-slow-travel",
    module: "academic",
    title: "Slow Travel: A Better Way to See the World?",
    about: "Статья-мнение: автор рассуждает о «медленных путешествиях».",
    level: "Band 6–7.5",
    minutes: 20,
    paragraphs: [
      {
        label: "A",
        text: "Over the past half-century, international travel has become faster and cheaper than ever before. A weekend in a foreign capital, once a rare treat, is now routine for millions of people. Yet I believe that the speed of modern tourism has come at a cost that we rarely stop to consider: we see more places than any previous generation, but we understand them less.",
      },
      {
        label: "B",
        text: "The typical short break follows a familiar pattern. Visitors arrive by plane, check into a hotel in the historic centre, photograph the same famous buildings as everyone else and leave two or three days later. The local economy benefits, of course, but much of the money spent goes to international hotel chains and booking platforms rather than to the residents whose neighbourhoods have become attractions.",
      },
      {
        label: "C",
        text: "'Slow travel', a term borrowed from the slow food movement, proposes a different approach. Instead of collecting destinations, the slow traveller stays longer in one place, uses trains, buses or bicycles where possible, and spends time in ordinary streets as well as famous ones. Supporters claim that this style of travel is more relaxing, more sustainable and more rewarding, and in my experience they are largely right.",
      },
      {
        label: "D",
        text: "The environmental argument is the most straightforward. Aviation accounts for a growing share of global emissions, and short flights produce a particularly high amount of carbon per kilometre. Taking the train for journeys of under a thousand kilometres is, in many parts of Europe, a practical alternative, and journey times are often competitive once waiting at airports is included.",
      },
      {
        label: "E",
        text: "Critics object that slow travel is a luxury for people with long holidays and flexible jobs. This is a fair point. A worker with ten days of annual leave cannot easily spend a month in a mountain village. However, slowness is a matter of attitude as much as time. Even a four-day trip can be slow if the traveller chooses one neighbourhood rather than five, eats where local people eat, and leaves some hours without any plan at all.",
      },
      {
        label: "F",
        text: "Nor should we romanticise the idea. Staying longer in popular places can contribute to rising rents if visitors occupy flats that would otherwise house local families. Responsible slow travel therefore means choosing accommodation carefully and, ideally, spreading visits across less famous towns and seasons.",
      },
    ],
    groups: [
      {
        id: "ra-slow-g1",
        kind: "ynng",
        instructions:
          "Do the following statements agree with the views of the writer? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
        tip: YNNG_TIP,
        questions: [
          {
            id: "ra-slow-1",
            kind: "ynng",
            statement: "Modern tourists generally understand the places they visit better than travellers in the past.",
            answer: "NO",
            explanation:
              "Автор считает наоборот: мы видим больше мест, чем любое предыдущее поколение, но понимаем их хуже (we understand them less).",
            evidence: "…we see more places than any previous generation, but we understand them less.",
          },
          {
            id: "ra-slow-2",
            kind: "ynng",
            statement: "International hotel chains should be banned from historic city centres.",
            answer: "NOT GIVEN",
            explanation:
              "Автор отмечает, что деньги уходят международным сетям, но не предлагает их запрещать. Его мнение о запрете неизвестно.",
            evidence: "…much of the money spent goes to international hotel chains and booking platforms…",
          },
          {
            id: "ra-slow-3",
            kind: "ynng",
            statement: "The claims made by supporters of slow travel are mostly correct.",
            answer: "YES",
            explanation: "«In my experience they are largely right» — автор в целом согласен со сторонниками. «Mostly correct» = «largely right».",
            evidence: "…and in my experience they are largely right.",
          },
          {
            id: "ra-slow-4",
            kind: "ynng",
            statement: "Travelling by train is always cheaper than flying for short journeys.",
            answer: "NOT GIVEN",
            explanation:
              "Автор сравнивает поезд и самолёт по выбросам и времени в пути (journey times are often competitive), но о цене не говорит. Слово «always» тоже должно насторожить.",
            evidence: "…journey times are often competitive once waiting at airports is included.",
          },
          {
            id: "ra-slow-5",
            kind: "ynng",
            statement: "People with short holidays cannot travel slowly in any way.",
            answer: "NO",
            explanation:
              "Автор признаёт, что критики отчасти правы, но возражает: «slowness is a matter of attitude», и даже четырёхдневная поездка может быть «медленной».",
            evidence: "Even a four-day trip can be slow if the traveller chooses one neighbourhood rather than five…",
          },
        ],
      },
      {
        id: "ra-slow-g2",
        kind: "mcq",
        instructions: "Choose the correct letter, A, B, C or D.",
        tip: MCQ_TIP,
        questions: [
          {
            id: "ra-slow-6",
            kind: "mcq",
            prompt: "In paragraph B, the writer suggests that the money spent by visitors on short breaks",
            options: [
              "mostly benefits local residents.",
              "is lower than it was in the past.",
              "often goes to large international companies.",
              "is used to protect historic buildings.",
            ],
            answer: 2,
            explanation: "Значительная часть денег уходит международным сетям отелей и платформам бронирования, а не жителям — вариант C.",
            evidence: "…much of the money spent goes to international hotel chains and booking platforms rather than to the residents…",
          },
          {
            id: "ra-slow-7",
            kind: "mcq",
            prompt: "Why does the writer mention waiting at airports?",
            options: [
              "to explain why trains are more comfortable",
              "to show that train journeys can take a similar total time",
              "to criticise airport security",
              "to argue that short flights are dangerous",
            ],
            answer: 1,
            explanation:
              "Если учесть ожидание в аэропортах, время поездки на поезде часто сопоставимо (competitive) — то есть общее время примерно одинаковое.",
            evidence: "…journey times are often competitive once waiting at airports is included.",
          },
          {
            id: "ra-slow-8",
            kind: "mcq",
            prompt: "What is the main purpose of paragraph F?",
            options: [
              "to reject the idea of slow travel",
              "to point out a possible negative effect of slow travel",
              "to recommend staying in hotels rather than flats",
              "to describe the benefits of travelling out of season",
            ],
            answer: 1,
            explanation:
              "«Nor should we romanticise the idea» — автор показывает возможный минус: рост арендной платы для местных семей. От идеи он не отказывается, а предлагает делать это ответственно.",
            evidence: "Staying longer in popular places can contribute to rising rents…",
          },
        ],
      },
      {
        id: "ra-slow-g3",
        kind: "sentence",
        instructions: "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        tip: SENTENCE_TIP,
        questions: [
          {
            id: "ra-slow-9",
            kind: "sentence",
            prompt: "The expression 'slow travel' was taken from the ___ movement.",
            answers: ["slow food"],
            maxWords: 2,
            explanation: "«A term borrowed from the slow food movement» — термин заимствован у движения slow food.",
            evidence: "'Slow travel', a term borrowed from the slow food movement…",
          },
          {
            id: "ra-slow-10",
            kind: "sentence",
            prompt: "Short flights produce a lot of carbon for each ___ travelled.",
            answers: ["kilometre", "kilometer", "km"],
            maxWords: 2,
            explanation: "«A particularly high amount of carbon per kilometre» — много углерода на каждый километр.",
            evidence: "…short flights produce a particularly high amount of carbon per kilometre.",
          },
          {
            id: "ra-slow-11",
            kind: "sentence",
            prompt: "Visitors staying in flats can push up ___ for local families.",
            answers: ["rents"],
            maxWords: 2,
            explanation: "«Can contribute to rising rents» — туристы в квартирах могут повышать арендную плату.",
            evidence: "Staying longer in popular places can contribute to rising rents…",
          },
        ],
      },
    ],
  },

  /* ─────────────────────── General Training 1 ─────────────────────── */
  {
    id: "rg-courses",
    module: "general",
    title: "Riverside Community Centre: Autumn Courses",
    about: "Объявление о курсах в местном центре досуга (Section 1).",
    level: "Band 4.5–6",
    minutes: 15,
    paragraphs: [
      {
        label: "A",
        text: "Welcome to our autumn programme. All courses run for ten weeks, starting in the week of 15 September. Unless stated otherwise, classes take place in the main building on Mill Lane. Registration opens on 1 August and can be completed online or at the reception desk between 9 am and 5 pm, Monday to Friday. Places are limited, so early booking is recommended.",
      },
      {
        label: "B",
        text: "Beginners' Photography (Tuesdays, 7–9 pm). Learn how to get the best from your camera or smartphone. The course covers composition, lighting and simple editing. Participants must bring their own device. Fee: £95. A 20% discount is available for students and people over 65.",
      },
      {
        label: "C",
        text: "Conversational Spanish (Wednesdays, 6–7.30 pm). A relaxed course for people with little or no knowledge of Spanish, focusing on everyday situations such as ordering food and asking for directions. All materials are included in the fee of £120. Please note that this course takes place in the library annexe, next to the car park.",
      },
      {
        label: "D",
        text: "Family Kayaking (Saturdays, 10 am–12 noon). Enjoy the river with the whole family under the supervision of qualified instructors. Children must be at least eight years old and accompanied by an adult. Life jackets and kayaks are provided, but participants should bring a change of clothes. In case of bad weather, sessions will be moved to the following Sunday. Fee: £60 per adult, £30 per child.",
      },
      {
        label: "E",
        text: "Home Repairs for Beginners (Thursdays, 7–9 pm). Gain the confidence to deal with small jobs around the house, from fixing a dripping tap to putting up shelves. Tools are provided during the class. This course is especially popular, and a waiting list is kept for anyone who cannot get a place. Fee: £110.",
      },
    ],
    groups: [
      {
        id: "rg-courses-g1",
        kind: "tfng",
        instructions:
          "Do the following statements agree with the information given in the text? Write TRUE, FALSE or NOT GIVEN.",
        tip: TFNG_TIP,
        questions: [
          {
            id: "rg-courses-1",
            kind: "tfng",
            statement: "Registration for the autumn courses begins in September.",
            answer: "FALSE",
            explanation: "Запись открывается 1 августа (Registration opens on 1 August). В сентябре начинаются сами курсы.",
            evidence: "Registration opens on 1 August…",
          },
          {
            id: "rg-courses-2",
            kind: "tfng",
            statement: "Students pay less than other people for the photography course.",
            answer: "TRUE",
            explanation: "Для студентов и людей старше 65 лет скидка 20% — значит, они платят меньше.",
            evidence: "A 20% discount is available for students and people over 65.",
          },
          {
            id: "rg-courses-3",
            kind: "tfng",
            statement: "The Spanish course is suitable for people who have never studied Spanish.",
            answer: "TRUE",
            explanation: "Курс для тех, у кого мало знаний испанского или их нет совсем (little or no knowledge).",
            evidence: "A relaxed course for people with little or no knowledge of Spanish…",
          },
          {
            id: "rg-courses-4",
            kind: "tfng",
            statement: "The Spanish classes are held in the main building on Mill Lane.",
            answer: "FALSE",
            explanation:
              "Обычно занятия в главном здании, но про испанский есть оговорка: он проходит в пристройке библиотеки (library annexe).",
            evidence: "Please note that this course takes place in the library annexe, next to the car park.",
          },
          {
            id: "rg-courses-5",
            kind: "tfng",
            statement: "Children aged six can join the kayaking course if an adult comes with them.",
            answer: "FALSE",
            explanation: "Детям должно быть не меньше восьми лет (at least eight years old). Шестилетние не могут участвовать даже со взрослым.",
            evidence: "Children must be at least eight years old and accompanied by an adult.",
          },
          {
            id: "rg-courses-6",
            kind: "tfng",
            statement: "More people have signed up for Home Repairs than for any other course.",
            answer: "NOT GIVEN",
            explanation:
              "Сказано, что курс особенно популярен и есть лист ожидания, но числа участников и сравнения с другими курсами нет.",
            evidence: "This course is especially popular, and a waiting list is kept…",
          },
        ],
      },
      {
        id: "rg-courses-g2",
        kind: "sentence",
        instructions: "Complete the notes below. Choose NO MORE THAN TWO WORDS from the text for each answer.",
        tip: SENTENCE_TIP,
        questions: [
          {
            id: "rg-courses-7",
            kind: "sentence",
            prompt: "Photography: participants need their own ___.",
            answers: ["device"],
            maxWords: 2,
            explanation: "«Participants must bring their own device» — фотоаппарат или смартфон.",
            evidence: "Participants must bring their own device.",
          },
          {
            id: "rg-courses-8",
            kind: "sentence",
            prompt: "Kayaking: bring a ___ of clothes.",
            answers: ["change"],
            maxWords: 2,
            explanation: "«Participants should bring a change of clothes» — сменную одежду.",
            evidence: "…participants should bring a change of clothes.",
          },
          {
            id: "rg-courses-9",
            kind: "sentence",
            prompt: "Kayaking in bad weather: moved to the following ___.",
            answers: ["sunday"],
            maxWords: 2,
            explanation: "При плохой погоде занятие переносят на следующее воскресенье.",
            evidence: "In case of bad weather, sessions will be moved to the following Sunday.",
          },
          {
            id: "rg-courses-10",
            kind: "sentence",
            prompt: "Home Repairs: people without a place can join a ___.",
            answers: ["waiting list"],
            maxWords: 2,
            explanation: "Для тех, кому не хватило места, ведётся лист ожидания — «a waiting list».",
            evidence: "…a waiting list is kept for anyone who cannot get a place.",
          },
        ],
      },
    ],
  },

  /* ─────────────────────── General Training 2 ─────────────────────── */
  {
    id: "rg-workplace",
    module: "general",
    title: "Northgate Logistics: A Guide for New Employees",
    about: "Памятка для новых сотрудников компании (Section 2).",
    level: "Band 5–6.5",
    minutes: 15,
    paragraphs: [
      {
        label: "A",
        text: "During your first five working days, you will be accompanied by an experienced colleague, known as your 'buddy', who will show you how our systems work and introduce you to the rest of the team. Please do not hesitate to ask your buddy questions, however simple they may seem.",
      },
      {
        label: "B",
        text: "Office staff normally work from 8.30 am to 5 pm, with a one-hour lunch break that can be taken at any time between 12 and 2 pm. Warehouse staff work in shifts; your shift pattern will be confirmed by your supervisor by the end of your first week. All staff are entitled to two fifteen-minute breaks in addition to lunch.",
      },
      {
        label: "C",
        text: "If you are unable to come to work because of illness, you must phone your manager before 9 am on the first day of absence. Text messages and emails are not acceptable. For absences of more than five days, a doctor's note is required.",
      },
      {
        label: "D",
        text: "High-visibility jackets and safety boots must be worn at all times in the warehouse, including by office staff who are only visiting briefly. Visitors from outside the company must be accompanied. Any accident, however minor, must be recorded in the accident book kept at the warehouse entrance.",
      },
      {
        label: "E",
        text: "All new employees complete an online safety course during their first month. After six months, you will have a meeting with your manager to discuss your progress and any training you would like to receive. The company pays for approved external courses related to your role.",
      },
      {
        label: "F",
        text: "Employees can use the on-site gym free of charge and receive a discount at the staff canteen. After one year of service, you will also be able to join the company pension scheme.",
      },
    ],
    groups: [
      {
        id: "rg-workplace-g1",
        kind: "heading",
        instructions:
          "The guide has six sections, A–F. Choose the correct heading for sections B–F from the list below. Section A has been done as an example: i.",
        tip: HEADINGS_TIP,
        headings: [
          { id: "i", text: "Support when you start" },
          { id: "ii", text: "Reporting that you cannot work" },
          { id: "iii", text: "When you will work and rest" },
          { id: "iv", text: "Protecting yourself and others" },
          { id: "v", text: "Improving your skills" },
          { id: "vi", text: "Extra advantages of working here" },
          { id: "vii", text: "How to apply for promotion" },
          { id: "viii", text: "Travelling to the workplace" },
        ],
        questions: [
          {
            id: "rg-workplace-1",
            kind: "heading",
            paragraph: "B",
            answer: "iii",
            explanation: "Раздел B — о часах работы, сменах и перерывах: когда работать и когда отдыхать.",
            evidence: "Office staff normally work from 8.30 am to 5 pm, with a one-hour lunch break…",
          },
          {
            id: "rg-workplace-2",
            kind: "heading",
            paragraph: "C",
            answer: "ii",
            explanation: "Раздел C объясняет, как сообщить о болезни: позвонить менеджеру до 9 утра.",
            evidence: "If you are unable to come to work because of illness, you must phone your manager…",
          },
          {
            id: "rg-workplace-3",
            kind: "heading",
            paragraph: "D",
            answer: "iv",
            explanation: "Раздел D — о безопасности на складе: спецодежда, сопровождение гостей, журнал происшествий.",
            evidence: "High-visibility jackets and safety boots must be worn at all times in the warehouse…",
          },
          {
            id: "rg-workplace-4",
            kind: "heading",
            paragraph: "E",
            answer: "v",
            explanation:
              "Раздел E — об обучении и развитии: онлайн-курс, встреча через полгода, оплата внешних курсов. Заголовок vii (повышение) — ловушка: о повышении в тексте нет.",
            evidence: "The company pays for approved external courses related to your role.",
          },
          {
            id: "rg-workplace-5",
            kind: "heading",
            paragraph: "F",
            answer: "vi",
            explanation: "Раздел F перечисляет льготы: бесплатный спортзал, скидка в столовой, пенсионная программа.",
            evidence: "Employees can use the on-site gym free of charge…",
          },
        ],
      },
      {
        id: "rg-workplace-g2",
        kind: "mcq",
        instructions: "Choose the correct letter, A, B, C or D.",
        tip: MCQ_TIP,
        questions: [
          {
            id: "rg-workplace-6",
            kind: "mcq",
            prompt: "Office staff can take their lunch break",
            options: [
              "only at 12 pm.",
              "at any time they choose between 12 and 2 pm.",
              "after their two short breaks.",
              "at a time decided by their buddy.",
            ],
            answer: 1,
            explanation: "Обеденный перерыв можно взять в любое время с 12 до 14 (at any time between 12 and 2 pm).",
            evidence: "…a one-hour lunch break that can be taken at any time between 12 and 2 pm.",
          },
          {
            id: "rg-workplace-7",
            kind: "mcq",
            prompt: "If you are ill on a working day, you should",
            options: [
              "send an email to your manager.",
              "phone your manager before 9 am.",
              "bring a doctor's note on the first day.",
              "ask your buddy to tell the team.",
            ],
            answer: 1,
            explanation:
              "Нужно позвонить менеджеру до 9 утра. Письма и сообщения не принимаются, а справка от врача нужна только если болеешь дольше пяти дней.",
            evidence: "…you must phone your manager before 9 am on the first day of absence.",
          },
          {
            id: "rg-workplace-8",
            kind: "mcq",
            prompt: "Who must wear safety boots in the warehouse?",
            options: [
              "only warehouse staff",
              "only visitors from outside the company",
              "everyone, including office staff",
              "only staff who have finished the safety course",
            ],
            answer: 2,
            explanation: "Спецобувь обязательна для всех, в том числе для офисных сотрудников, зашедших ненадолго.",
            evidence: "…including by office staff who are only visiting briefly.",
          },
        ],
      },
      {
        id: "rg-workplace-g3",
        kind: "sentence",
        instructions: "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the text for each answer.",
        tip: SENTENCE_TIP,
        questions: [
          {
            id: "rg-workplace-9",
            kind: "sentence",
            prompt: "Even small accidents must be written in the ___.",
            answers: ["accident book"],
            maxWords: 2,
            explanation: "Любое происшествие записывают в журнал — «the accident book» у входа на склад.",
            evidence: "Any accident, however minor, must be recorded in the accident book…",
          },
          {
            id: "rg-workplace-10",
            kind: "sentence",
            prompt: "Staff can join the pension scheme after one ___.",
            answers: ["year"],
            maxWords: 2,
            explanation:
              "«After one year of service» — после года работы. Правильный ответ — «year»: «year of service» — это три слова, а по условию можно не больше двух.",
            evidence: "After one year of service, you will also be able to join the company pension scheme.",
          },
        ],
      },
    ],
  },

  /* ─────────────────────── General Training 3 ─────────────────────── */
  {
    id: "rg-couriers",
    module: "general",
    title: "From Messengers to Delivery Apps: The Bicycle Courier",
    about: "История велокурьеров — длинный текст (Section 3).",
    level: "Band 5.5–7",
    minutes: 20,
    paragraphs: [
      {
        label: "A",
        text: "Long before smartphones, cities relied on young messengers to carry letters, parcels and urgent documents across town. In the late nineteenth century, telegraph companies in London and New York employed thousands of boys, some as young as twelve, to deliver telegrams on foot. When the safety bicycle — with two wheels of equal size and a chain drive — became affordable in the 1890s, many of these messengers began to ride, and the bicycle courier was born.",
      },
      {
        label: "B",
        text: "Throughout the twentieth century, couriers remained a familiar sight in business districts. Banks, law firms and advertising agencies needed contracts and designs delivered within the hour, and in heavy traffic a skilled cyclist was usually quicker than any car or van. By the 1980s, courier companies in major cities employed hundreds of riders, who were often paid for each delivery rather than by the hour.",
      },
      {
        label: "C",
        text: "The arrival of the fax machine and, later, email seemed to threaten the profession. Documents could now be sent in seconds, and many observers predicted that bicycle couriers would disappear. The number of document deliveries did fall sharply, but the industry adapted. Couriers began to carry items that could not be sent electronically: medical samples, spare parts, keys and, increasingly, food.",
      },
      {
        label: "D",
        text: "Today, app-based delivery platforms have created a new generation of cycling couriers. Anyone with a bicycle and a smartphone can sign up in a matter of days. The flexibility appeals to students and people looking for extra income, but critics point out that riders are usually classed as self-employed, which means they do not receive holiday pay or sick pay.",
      },
      {
        label: "E",
        text: "Cities, meanwhile, are beginning to see cargo bikes — bicycles with large boxes at the front or back — as a way to reduce traffic and pollution. A trial in one European city found that cargo bikes delivered parcels in the centre about sixty per cent faster than vans, partly because they did not need to search for parking spaces.",
      },
    ],
    groups: [
      {
        id: "rg-couriers-g1",
        kind: "summary",
        instructions:
          "Complete the summary using the list of words, A–H, below. Write the correct letter, A–H, for each answer.",
        tip: SUMMARY_TIP,
        summary:
          "The first cycling couriers were {rg-couriers-1} who had previously delivered telegrams on foot. During the twentieth century, businesses used couriers because they were {rg-couriers-2} than motor vehicles in city traffic. Email and fax reduced the demand for delivering {rg-couriers-3}, but couriers started carrying other goods, such as medical samples and {rg-couriers-4}. Today's app-based riders value the {rg-couriers-5} of the work, but they usually do not get holiday pay.",
        options: [
          { id: "A", text: "boys" },
          { id: "B", text: "quicker" },
          { id: "C", text: "documents" },
          { id: "D", text: "food" },
          { id: "E", text: "flexibility" },
          { id: "F", text: "cheaper" },
          { id: "G", text: "safety" },
          { id: "H", text: "salaries" },
        ],
        questions: [
          {
            id: "rg-couriers-1",
            kind: "summary",
            answer: "A",
            explanation: "Телеграммы разносили мальчики (boys), некоторым было по двенадцать лет; потом они пересели на велосипеды.",
            evidence: "…employed thousands of boys, some as young as twelve, to deliver telegrams on foot.",
          },
          {
            id: "rg-couriers-2",
            kind: "summary",
            answer: "B",
            explanation: "В пробках велосипедист обычно был быстрее машины (quicker). О цене (cheaper) в тексте нет.",
            evidence: "…in heavy traffic a skilled cyclist was usually quicker than any car or van.",
          },
          {
            id: "rg-couriers-3",
            kind: "summary",
            answer: "C",
            explanation: "Число доставок документов резко упало (the number of document deliveries did fall sharply).",
            evidence: "The number of document deliveries did fall sharply…",
          },
          {
            id: "rg-couriers-4",
            kind: "summary",
            answer: "D",
            explanation: "Курьеры стали возить то, что не отправишь по почте: медицинские пробы, запчасти, ключи и всё чаще еду.",
            evidence: "…medical samples, spare parts, keys and, increasingly, food.",
          },
          {
            id: "rg-couriers-5",
            kind: "summary",
            answer: "E",
            explanation: "Гибкость (flexibility) привлекает студентов и тех, кто ищет подработку.",
            evidence: "The flexibility appeals to students and people looking for extra income…",
          },
        ],
      },
      {
        id: "rg-couriers-g2",
        kind: "tfng",
        instructions:
          "Do the following statements agree with the information given in the text? Write TRUE, FALSE or NOT GIVEN.",
        tip: TFNG_TIP,
        questions: [
          {
            id: "rg-couriers-6",
            kind: "tfng",
            statement: "Some telegraph messengers in the nineteenth century were only twelve years old.",
            answer: "TRUE",
            explanation: "«Some as young as twelve» — некоторым было всего двенадцать.",
            evidence: "…thousands of boys, some as young as twelve…",
          },
          {
            id: "rg-couriers-7",
            kind: "tfng",
            statement: "In the 1980s, courier riders usually received a fixed hourly wage.",
            answer: "FALSE",
            explanation: "Им часто платили за каждую доставку, а не почасово (paid for each delivery rather than by the hour).",
            evidence: "…who were often paid for each delivery rather than by the hour.",
          },
          {
            id: "rg-couriers-8",
            kind: "tfng",
            statement: "Courier companies preferred fax machines to email.",
            answer: "NOT GIVEN",
            explanation: "Факс и email упомянуты как угроза профессии, но о том, что предпочитали курьерские компании, ничего не сказано.",
            evidence: "The arrival of the fax machine and, later, email seemed to threaten the profession.",
          },
          {
            id: "rg-couriers-9",
            kind: "tfng",
            statement: "People who want to work for a delivery app have to wait several months before starting.",
            answer: "FALSE",
            explanation: "Зарегистрироваться можно за несколько дней (in a matter of days), а не месяцев.",
            evidence: "Anyone with a bicycle and a smartphone can sign up in a matter of days.",
          },
        ],
      },
      {
        id: "rg-couriers-g3",
        kind: "mcq",
        instructions: "Choose the correct letter, A, B, C or D.",
        tip: MCQ_TIP,
        questions: [
          {
            id: "rg-couriers-10",
            kind: "mcq",
            prompt: "Many messengers started riding bicycles in the 1890s because the safety bicycle",
            options: ["was faster than a horse.", "had become affordable.", "was designed for messengers.", "was lighter than earlier models."],
            answer: 1,
            explanation: "Велосипед стал доступным по цене (became affordable) — и посыльные пересели на него.",
            evidence: "When the safety bicycle… became affordable in the 1890s, many of these messengers began to ride…",
          },
          {
            id: "rg-couriers-11",
            kind: "mcq",
            prompt: "In the trial described in the last paragraph, cargo bikes were faster partly because they",
            options: [
              "used special cycle lanes.",
              "carried smaller parcels.",
              "did not need to look for parking.",
              "started work earlier in the morning.",
            ],
            answer: 2,
            explanation: "Грузовые велосипеды доставляли быстрее отчасти потому, что им не нужно было искать парковку.",
            evidence: "…partly because they did not need to search for parking spaces.",
          },
        ],
      },
    ],
  },
];

/** Короткий текст для диагностики (подходит и для Academic, и для General Training). */
export const DIAGNOSTIC_READING: ReadingPassage = {
  id: "rd-diagnostic",
  module: "academic",
  title: "Community Gardens in the City",
  about: "Короткий текст для диагностики.",
  level: "Band 4.5–6.5",
  minutes: 8,
  paragraphs: [
    {
      label: "A",
      text: "Community gardens — shared plots of land where local people grow vegetables, fruit and flowers — have spread rapidly in many cities over the last two decades. Some occupy empty building sites; others are created on rooftops or along railway lines.",
    },
    {
      label: "B",
      text: "Research suggests that the benefits go beyond fresh food. A survey of gardeners in three cities found that over half had made new friends through their garden, and many reported lower levels of stress. For older residents living alone, the gardens often provide a reason to leave home and a regular chance to talk to neighbours.",
    },
    {
      label: "C",
      text: "However, the future of many gardens is uncertain. Because they are often located on land that is only rented for a short period, they can be closed when the owner decides to sell or build. Campaigners argue that city councils should give successful gardens long-term protection, as they do for parks.",
    },
  ],
  groups: [
    {
      id: "rd-diag-g1",
      kind: "tfng",
      instructions: "Write TRUE, FALSE or NOT GIVEN.",
      tip: TFNG_TIP,
      questions: [
        {
          id: "rd-diag-1",
          kind: "tfng",
          statement: "Some community gardens are on the roofs of buildings.",
          answer: "TRUE",
          explanation: "«Others are created on rooftops» — некоторые сады устроены на крышах.",
          evidence: "Some occupy empty building sites; others are created on rooftops…",
        },
        {
          id: "rd-diag-2",
          kind: "tfng",
          statement: "Most people join community gardens to save money on food.",
          answer: "NOT GIVEN",
          explanation: "О причинах, по которым люди приходят в сады, и об экономии денег в тексте ничего нет.",
        },
        {
          id: "rd-diag-3",
          kind: "tfng",
          statement: "The survey found that fewer than half of the gardeners had made new friends.",
          answer: "FALSE",
          explanation: "Больше половины (over half) нашли новых друзей — это противоречит «fewer than half».",
          evidence: "…over half had made new friends through their garden…",
        },
      ],
    },
    {
      id: "rd-diag-g2",
      kind: "mcq",
      instructions: "Choose the correct letter, A, B, C or D.",
      tip: MCQ_TIP,
      questions: [
        {
          id: "rd-diag-4",
          kind: "mcq",
          prompt: "According to paragraph B, gardens are especially helpful for older people who",
          options: ["have health problems.", "live alone.", "have their own garden.", "want to earn money."],
          answer: 1,
          explanation: "«For older residents living alone» — для пожилых, живущих одни, сады дают повод выйти из дома.",
          evidence: "For older residents living alone, the gardens often provide a reason to leave home…",
        },
        {
          id: "rd-diag-5",
          kind: "mcq",
          prompt: "Why is the future of many gardens uncertain?",
          options: [
            "They are too expensive to maintain.",
            "The land they use may be sold or built on.",
            "Fewer people want to join them.",
            "Councils have decided to close them.",
          ],
          answer: 1,
          explanation: "Землю часто арендуют ненадолго, и сад могут закрыть, если владелец решит продать участок или строить.",
          evidence: "…they can be closed when the owner decides to sell or build.",
        },
      ],
    },
    {
      id: "rd-diag-g3",
      kind: "sentence",
      instructions: "Complete the sentence. Choose ONE WORD ONLY from the text.",
      tip: SENTENCE_TIP,
      questions: [
        {
          id: "rd-diag-6",
          kind: "sentence",
          prompt: "Campaigners want councils to protect successful gardens in the same way as ___.",
          answers: ["parks"],
          maxWords: 1,
          explanation: "«As they do for parks» — так же, как парки.",
          evidence: "…city councils should give successful gardens long-term protection, as they do for parks.",
        },
      ],
    },
  ],
};

export function getReadingPassage(id: string): ReadingPassage | undefined {
  if (id === DIAGNOSTIC_READING.id) return DIAGNOSTIC_READING;
  return READING_PASSAGES.find((passage) => passage.id === id);
}
