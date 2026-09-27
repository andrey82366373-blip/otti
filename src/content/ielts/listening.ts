/**
 * IELTS Listening: оригинальные сценарии в формате четырёх частей экзамена.
 * Звук — учебная демонстрация: текст озвучивает синтезатор речи браузера.
 * Это не настоящая экзаменационная запись: темп, акценты и паузы отличаются.
 */
import type { ListeningSection } from "@/content/ielts/types";

const FORM_TIP =
  "До прослушивания прочитай форму и подумай, что нужно вписать: число, имя, дату. Имена по буквам и числа часто диктуют — записывай сразу.";
const MCQ_TIP =
  "Прочитай вопросы заранее. Говорящие часто упоминают несколько вариантов, а потом поправляют себя — жди окончательного ответа.";
const MATCH_TIP =
  "Варианты идут в том же порядке, что и в записи, а вот варианты ответа — нет. Лишние варианты обычно тоже звучат, но про другое место или человека.";
const NOTES_TIP =
  "Заметки идут по порядку лекции. Смотри на слова до и после пропуска — лектор скажет их почти так же, а ответ прозвучит рядом.";

export const LISTENING_SECTIONS: ListeningSection[] = [
  /* ───────────────────────────── Part 1 ───────────────────────────── */
  {
    id: "l1-rowing-club",
    part: 1,
    title: "Joining the Riverside Rowing Club",
    about: "Разговор по телефону: мужчина записывается в клуб гребли.",
    level: "Band 4.5–6",
    minutes: 8,
    script: [
      { speaker: "Receptionist", voice: "female", text: "Good morning, Riverside Rowing Club. How can I help you?" },
      { speaker: "Daniel", voice: "male", text: "Hi, I'd like to join the club, if that's possible. I saw your poster in the library." },
      { speaker: "Receptionist", voice: "female", text: "Of course. I'll just take a few details. Could I have your full name, please?" },
      { speaker: "Daniel", voice: "male", text: "Yes, it's Daniel Harlow." },
      { speaker: "Receptionist", voice: "female", text: "How do you spell your surname?" },
      { speaker: "Daniel", voice: "male", text: "H, A, R, L, O, W." },
      { speaker: "Receptionist", voice: "female", text: "Thank you. And your address?" },
      { speaker: "Daniel", voice: "male", text: "It's 42 Station Road, in Millbrook." },
      { speaker: "Receptionist", voice: "female", text: "42 Station Road. Have you done any rowing before?" },
      {
        speaker: "Daniel",
        voice: "male",
        text: "A little. I tried it on holiday last year, but I'd say I'm still a beginner.",
      },
      {
        speaker: "Receptionist",
        voice: "female",
        text: "That's fine. We have a beginners' course on Saturday mornings, which runs for six weeks. Or there's an evening group on Thursdays.",
      },
      { speaker: "Daniel", voice: "male", text: "Saturday would be better. I work late on Thursdays." },
      {
        speaker: "Receptionist",
        voice: "female",
        text: "No problem. The Saturday course starts at half past eight. Is that too early?",
      },
      { speaker: "Daniel", voice: "male", text: "No, that's fine." },
      {
        speaker: "Receptionist",
        voice: "female",
        text: "Now, membership. The standard annual fee is two hundred and ten pounds, but there's a reduced rate of one hundred and forty pounds for students.",
      },
      { speaker: "Daniel", voice: "male", text: "I'm not a student any more, so the standard fee, then." },
      {
        speaker: "Receptionist",
        voice: "female",
        text: "Right. The fee includes the use of the boats and the changing rooms. The only things you'll need are suitable clothing, nothing made of cotton, because it stays wet, and a water bottle.",
      },
      { speaker: "Daniel", voice: "male", text: "OK. Is there anything else I need to do before the first session?" },
      {
        speaker: "Receptionist",
        voice: "female",
        text: "Yes, all new members have to pass a short swimming test. It's at the leisure centre on Friday evening at six. You just need to swim fifty metres.",
      },
      { speaker: "Daniel", voice: "male", text: "Fifty metres. That should be all right." },
    ],
    groups: [
      {
        id: "l1-g1",
        kind: "gap",
        instructions: "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        tip: FORM_TIP,
        questions: [
          {
            id: "l1-1",
            kind: "gap",
            prompt: "Surname: ___",
            answers: ["harlow"],
            maxWords: 2,
            explanation: "Фамилию продиктовали по буквам: H, A, R, L, O, W — Harlow. В IELTS ошибка в написании = неверный ответ.",
            evidence: "H, A, R, L, O, W.",
          },
          {
            id: "l1-2",
            kind: "gap",
            prompt: "Address: ___ Station Road, Millbrook",
            answers: ["42", "forty-two", "forty two"],
            maxWords: 2,
            explanation: "«It's 42 Station Road» — номер дома 42.",
            evidence: "It's 42 Station Road, in Millbrook.",
          },
          {
            id: "l1-3",
            kind: "gap",
            prompt: "Preferred course: beginners, on ___ mornings",
            answers: ["saturday", "saturdays"],
            maxWords: 2,
            explanation: "Дэниел выбирает субботу: «Saturday would be better». Четверг — ловушка: он упоминается, но не подходит.",
            evidence: "Saturday would be better. I work late on Thursdays.",
          },
          {
            id: "l1-4",
            kind: "gap",
            prompt: "Course start time: ___ am",
            answers: ["8.30", "8:30", "half past eight", "eight thirty", "830"],
            maxWords: 3,
            explanation: "«Starts at half past eight» — 8.30. Записать можно цифрами: 8.30 или 8:30.",
            evidence: "The Saturday course starts at half past eight.",
          },
          {
            id: "l1-5",
            kind: "gap",
            prompt: "Annual fee: £___",
            answers: ["210", "two hundred and ten", "two hundred ten"],
            maxWords: 3,
            explanation:
              "Стандартный взнос — 210 фунтов. 140 — льготная цена для студентов, но Дэниел уже не студент.",
            evidence: "The standard annual fee is two hundred and ten pounds… I'm not a student any more…",
          },
          {
            id: "l1-6",
            kind: "gap",
            prompt: "Bring: suitable clothing (not cotton) and a ___",
            answers: ["water bottle", "bottle", "bottle of water"],
            maxWords: 2,
            explanation: "Нужно взять подходящую одежду и бутылку для воды — «a water bottle».",
            evidence: "The only things you'll need are suitable clothing… and a water bottle.",
          },
          {
            id: "l1-7",
            kind: "gap",
            prompt: "Swimming test: swim ___",
            answers: ["50 metres", "50 meters", "50m", "50 m", "fifty metres", "fifty meters", "50"],
            maxWords: 2,
            explanation: "Нужно проплыть 50 метров: «You just need to swim fifty metres».",
            evidence: "You just need to swim fifty metres.",
          },
        ],
      },
      {
        id: "l1-g2",
        kind: "mcq",
        instructions: "Choose the correct letter, A, B, C or D.",
        tip: MCQ_TIP,
        questions: [
          {
            id: "l1-8",
            kind: "mcq",
            prompt: "Why does Daniel choose the Saturday course?",
            options: ["He prefers mornings.", "He works late on Thursdays.", "The Thursday group is full.", "It is cheaper."],
            answer: 1,
            explanation: "Он сам объясняет: «I work late on Thursdays» — по четвергам он поздно работает.",
            evidence: "Saturday would be better. I work late on Thursdays.",
          },
          {
            id: "l1-9",
            kind: "mcq",
            prompt: "What must all new members do before the first session?",
            options: ["buy their own boat", "attend a safety talk", "pass a swimming test", "bring a photograph"],
            answer: 2,
            explanation: "Все новые участники должны сдать короткий тест по плаванию.",
            evidence: "…all new members have to pass a short swimming test.",
          },
        ],
      },
    ],
  },

  /* ───────────────────────────── Part 2 ───────────────────────────── */
  {
    id: "l2-nature-reserve",
    part: 2,
    title: "Welcome to Heron Marsh Nature Reserve",
    about: "Монолог: экскурсовод рассказывает о заповеднике.",
    level: "Band 5–6.5",
    minutes: 8,
    script: [
      {
        speaker: "Guide",
        voice: "female",
        text: "Good morning, everyone, and welcome to Heron Marsh Nature Reserve. My name's Claire, and I'm one of the volunteer guides here. Before you set off, I'd like to give you a quick introduction to the reserve.",
      },
      {
        speaker: "Guide",
        voice: "female",
        text: "The reserve was created in 1987 on land that had previously been used for extracting gravel. When the gravel pits filled with water, birds began to arrive, and a local wildlife trust bought the site to protect them. Today it covers about three hundred hectares.",
      },
      {
        speaker: "Guide",
        voice: "female",
        text: "Now, a few practical points. The main path is about four kilometres long and takes most people around two hours, if you stop to watch the birds. It's flat and suitable for wheelchairs, although the section beside the reed beds can be muddy after rain. Please keep dogs on a lead at all times. They're allowed on the main path, but not in the hides.",
      },
      {
        speaker: "Guide",
        voice: "female",
        text: "Let me tell you about some of the places on your map. Just after you leave the visitor centre, you'll reach the Kingfisher Hide. It's small, but it's the best place to see kingfishers, especially early in the morning, so be patient and keep your voice low.",
      },
      {
        speaker: "Guide",
        voice: "female",
        text: "Further along, there's the Otter Bridge. Otters are shy and mostly active at night, so you're unlikely to see one, but look out for their footprints in the soft mud below the bridge.",
      },
      {
        speaker: "Guide",
        voice: "female",
        text: "At the halfway point, you'll come to the Meadow. In summer it's full of wild flowers, and it's our most popular spot for picnics. There are tables and a small shelter in case it rains.",
      },
      {
        speaker: "Guide",
        voice: "female",
        text: "Finally, near the end of the walk, there's the Watchtower. It's the highest point on the reserve, and from the top you can see across the whole marsh. We keep telescopes up there that visitors can use free of charge. Enjoy your walk!",
      },
    ],
    groups: [
      {
        id: "l2-g1",
        kind: "mcq",
        instructions: "Choose the correct letter, A, B, C or D.",
        tip: MCQ_TIP,
        questions: [
          {
            id: "l2-1",
            kind: "mcq",
            prompt: "Before it became a nature reserve, the land was used for",
            options: ["farming.", "extracting gravel.", "building houses.", "fishing."],
            answer: 1,
            explanation: "Раньше здесь добывали гравий: «land that had previously been used for extracting gravel».",
            evidence: "…on land that had previously been used for extracting gravel.",
          },
          {
            id: "l2-2",
            kind: "mcq",
            prompt: "What does Claire say about the main path?",
            options: [
              "It is not suitable for wheelchairs.",
              "It takes about four hours.",
              "One section can be muddy after rain.",
              "It is closed in wet weather.",
            ],
            answer: 2,
            explanation:
              "Тропа подходит для колясок, занимает около двух часов (4 — это километры, а не часы), а участок у камышей бывает грязным после дождя.",
            evidence: "…the section beside the reed beds can be muddy after rain.",
          },
          {
            id: "l2-3",
            kind: "mcq",
            prompt: "Dogs are",
            options: [
              "not allowed on the reserve.",
              "allowed in the hides.",
              "allowed on the main path on a lead.",
              "allowed off the lead in the Meadow.",
            ],
            answer: 2,
            explanation: "Собак держат на поводке; на главной тропе можно, в укрытиях (hides) — нельзя.",
            evidence: "Please keep dogs on a lead at all times. They're allowed on the main path, but not in the hides.",
          },
        ],
      },
      {
        id: "l2-g2",
        kind: "match",
        instructions: "What can visitors do at each of the following places? Choose FOUR answers from the list, A–F.",
        tip: MATCH_TIP,
        options: [
          { id: "A", text: "look for an animal's footprints" },
          { id: "B", text: "use telescopes for free" },
          { id: "C", text: "have a picnic" },
          { id: "D", text: "see a particular bird early in the day" },
          { id: "E", text: "buy food and drinks" },
          { id: "F", text: "hire binoculars" },
        ],
        questions: [
          {
            id: "l2-4",
            kind: "match",
            prompt: "Kingfisher Hide",
            answer: "D",
            explanation: "Здесь лучше всего видно зимородков (kingfishers), особенно рано утром.",
            evidence: "…the best place to see kingfishers, especially early in the morning…",
          },
          {
            id: "l2-5",
            kind: "match",
            prompt: "Otter Bridge",
            answer: "A",
            explanation: "Выдру вряд ли увидишь, но под мостом можно найти её следы в грязи.",
            evidence: "…look out for their footprints in the soft mud below the bridge.",
          },
          {
            id: "l2-6",
            kind: "match",
            prompt: "The Meadow",
            answer: "C",
            explanation: "Луг — самое популярное место для пикников: там столы и навес.",
            evidence: "…it's our most popular spot for picnics.",
          },
          {
            id: "l2-7",
            kind: "match",
            prompt: "The Watchtower",
            answer: "B",
            explanation: "На смотровой башне есть телескопы, которыми можно пользоваться бесплатно (free of charge).",
            evidence: "We keep telescopes up there that visitors can use free of charge.",
          },
        ],
      },
    ],
  },

  /* ───────────────────────────── Part 3 ───────────────────────────── */
  {
    id: "l3-presentation",
    part: 3,
    title: "Planning a Presentation on Plastic Waste",
    about: "Двое студентов, Майя и Том, готовят презентацию.",
    level: "Band 5.5–7",
    minutes: 8,
    script: [
      {
        speaker: "Maya",
        voice: "female",
        text: "So, Tom, we need to decide how to organise our presentation on reducing plastic waste on campus. It's due in two weeks.",
      },
      { speaker: "Tom", voice: "male", text: "Right. I was thinking we could start with the survey results. That's the most original part." },
      {
        speaker: "Maya",
        voice: "female",
        text: "I agree the survey is interesting, but I think we should begin with the bigger picture, some figures about plastic production worldwide, and then focus on the university.",
      },
      {
        speaker: "Tom",
        voice: "male",
        text: "Hmm, OK. That makes sense, as long as the introduction is short. The tutor said she didn't want too much background.",
      },
      { speaker: "Maya", voice: "female", text: "Fine. Two minutes at most. Now, the survey. We asked a hundred and twenty students, didn't we?" },
      {
        speaker: "Tom",
        voice: "male",
        text: "A hundred and twenty-five, actually. Five more replied after the deadline, but I included them.",
      },
      {
        speaker: "Maya",
        voice: "female",
        text: "Good. The most surprising result for me was that most students said they'd use a refillable bottle if there were more places to fill it.",
      },
      {
        speaker: "Tom",
        voice: "male",
        text: "Yes, seventy per cent. The price of reusable bottles wasn't really a problem. It was mainly about convenience: there aren't enough water fountains.",
      },
      {
        speaker: "Tom",
        voice: "male",
        text: "And the canteen still gives out plastic cutlery with every takeaway meal. We could suggest that they only give it if customers ask for it.",
      },
      {
        speaker: "Maya",
        voice: "female",
        text: "That's a good idea. It's cheap and easy to introduce. Now, who does what? I'm happy to prepare the slides, because I've got the design software.",
      },
      { speaker: "Tom", voice: "male", text: "Great. Then I'll analyse the survey data and make the charts." },
      {
        speaker: "Maya",
        voice: "female",
        text: "And the talk itself? Shall we split it? You could present the survey, and I'll do the introduction and the recommendations.",
      },
      { speaker: "Tom", voice: "male", text: "Yes, let's both speak. And we should practise together at least once." },
      {
        speaker: "Maya",
        voice: "female",
        text: "How about Wednesday afternoon, in the library?",
      },
      {
        speaker: "Tom",
        voice: "male",
        text: "Wednesday's fine, but the library group rooms are always booked. Let's use the student union instead.",
      },
      { speaker: "Maya", voice: "female", text: "OK, the student union on Wednesday, at three." },
    ],
    groups: [
      {
        id: "l3-g1",
        kind: "mcq",
        instructions: "Choose the correct letter, A, B, C or D.",
        tip: MCQ_TIP,
        questions: [
          {
            id: "l3-1",
            kind: "mcq",
            prompt: "What do Maya and Tom agree about the introduction?",
            options: [
              "It should focus on the survey.",
              "It should give global figures but be short.",
              "It is not necessary.",
              "The tutor will give it.",
            ],
            answer: 1,
            explanation:
              "Майя предлагает начать с мировых цифр, Том соглашается при условии, что вступление будет коротким — не больше двух минут.",
            evidence: "That makes sense, as long as the introduction is short… Two minutes at most.",
          },
          {
            id: "l3-2",
            kind: "mcq",
            prompt: "How many students took part in the survey?",
            options: ["100", "120", "125", "170"],
            answer: 2,
            explanation: "Майя говорит 120, но Том поправляет: 125 — ещё пятеро ответили после срока. Типичная ловушка: верный ответ звучит после поправки.",
            evidence: "A hundred and twenty-five, actually.",
          },
          {
            id: "l3-3",
            kind: "mcq",
            prompt: "According to the survey, what stops students using refillable bottles?",
            options: [
              "The bottles are too expensive.",
              "There are not enough places to fill them.",
              "They do not like the taste of tap water.",
              "They forget to bring them.",
            ],
            answer: 1,
            explanation: "Цена не проблема, дело в удобстве: мало питьевых фонтанчиков, где можно наполнить бутылку.",
            evidence: "The price of reusable bottles wasn't really a problem… there aren't enough water fountains.",
          },
        ],
      },
      {
        id: "l3-g2",
        kind: "match",
        instructions: "Who will do each task? Write M for Maya, T for Tom or B for both.",
        tip: MATCH_TIP,
        options: [
          { id: "M", text: "Maya" },
          { id: "T", text: "Tom" },
          { id: "B", text: "Both" },
        ],
        questions: [
          {
            id: "l3-4",
            kind: "match",
            prompt: "prepare the slides",
            answer: "M",
            explanation: "Слайды делает Майя — у неё есть программа для дизайна.",
            evidence: "I'm happy to prepare the slides, because I've got the design software.",
          },
          {
            id: "l3-5",
            kind: "match",
            prompt: "make the charts",
            answer: "T",
            explanation: "Том анализирует данные опроса и делает графики.",
            evidence: "Then I'll analyse the survey data and make the charts.",
          },
          {
            id: "l3-6",
            kind: "match",
            prompt: "speak during the presentation",
            answer: "B",
            explanation: "Выступают оба: «let's both speak».",
            evidence: "Yes, let's both speak.",
          },
        ],
      },
      {
        id: "l3-g3",
        kind: "gap",
        instructions: "Complete the notes. Write ONE WORD ONLY for each answer.",
        tip: NOTES_TIP,
        questions: [
          {
            id: "l3-7",
            kind: "gap",
            prompt: "Recommendation: the canteen should give plastic cutlery only if customers ___ for it.",
            answers: ["ask"],
            maxWords: 1,
            explanation: "«Only give it if customers ask for it» — только если покупатель попросит.",
            evidence: "…they only give it if customers ask for it.",
          },
          {
            id: "l3-8",
            kind: "gap",
            prompt: "Practice: Wednesday at 3 pm in the student ___",
            answers: ["union"],
            maxWords: 1,
            explanation: "Библиотека — ловушка: там всё занято. Репетируют в студенческом союзе — «the student union».",
            evidence: "Let's use the student union instead.",
          },
        ],
      },
    ],
  },

  /* ───────────────────────────── Part 4 ───────────────────────────── */
  {
    id: "l4-heat-islands",
    part: 4,
    title: "Lecture: Urban Heat Islands",
    about: "Лекция о том, почему в городах теплее, чем за городом.",
    level: "Band 6–7.5",
    minutes: 8,
    script: [
      {
        speaker: "Lecturer",
        voice: "male",
        text: "Good afternoon. Today I'm going to talk about a phenomenon known as the urban heat island: the fact that cities are often noticeably warmer than the countryside around them.",
      },
      {
        speaker: "Lecturer",
        voice: "male",
        text: "The difference can be surprisingly large. On a calm, clear night, the centre of a big city may be five or even ten degrees warmer than nearby rural areas. Interestingly, the effect is usually strongest at night rather than during the day.",
      },
      {
        speaker: "Lecturer",
        voice: "male",
        text: "So what causes it? The first factor is the materials we build with. Concrete, brick and asphalt absorb energy from the sun during the day and release heat slowly after dark. The second factor is the shortage of vegetation. Trees and plants cool the air by releasing water, and this process uses energy from the surrounding air. A third factor is waste heat from human activity: vehicles, air conditioners and factories all add warmth to the city.",
      },
      {
        speaker: "Lecturer",
        voice: "male",
        text: "Why does this matter? Higher temperatures increase the demand for electricity, particularly for cooling in summer. More importantly, heat waves are more dangerous in cities. Elderly people and those with heart problems are at the greatest risk.",
      },
      {
        speaker: "Lecturer",
        voice: "male",
        text: "What can be done? One approach is to use lighter colours. So-called cool roofs, painted white or covered with reflective material, send much of the sun's energy back into the atmosphere. Another approach is to increase green space, by planting trees along streets and creating parks. Some cities have also experimented with water features, such as fountains and small canals, which cool the air around them.",
      },
      {
        speaker: "Lecturer",
        voice: "male",
        text: "Finally, planning matters. Narrow streets between tall buildings can trap heat, whereas wider streets that follow the direction of the wind allow cooler air to flow in.",
      },
    ],
    groups: [
      {
        id: "l4-g1",
        kind: "gap",
        instructions: "Complete the notes below. Write ONE WORD ONLY for each answer.",
        tip: NOTES_TIP,
        questions: [
          {
            id: "l4-1",
            kind: "gap",
            prompt: "The heat island effect is usually strongest at ___.",
            answers: ["night"],
            maxWords: 1,
            explanation: "«The effect is usually strongest at night rather than during the day».",
            evidence: "…the effect is usually strongest at night rather than during the day.",
          },
          {
            id: "l4-2",
            kind: "gap",
            prompt: "Concrete, brick and asphalt release ___ slowly after dark.",
            answers: ["heat"],
            maxWords: 1,
            explanation: "Материалы днём поглощают энергию солнца, а после заката медленно отдают тепло — «release heat».",
            evidence: "…absorb energy from the sun during the day and release heat slowly after dark.",
          },
          {
            id: "l4-3",
            kind: "gap",
            prompt: "Cause: a shortage of ___",
            answers: ["vegetation"],
            maxWords: 1,
            explanation: "Вторая причина — нехватка растительности: «the shortage of vegetation».",
            evidence: "The second factor is the shortage of vegetation.",
          },
          {
            id: "l4-4",
            kind: "gap",
            prompt: "Cause: ___ heat from vehicles, air conditioners and factories",
            answers: ["waste"],
            maxWords: 1,
            explanation: "Третья причина — «waste heat», лишнее тепло от машин, кондиционеров и заводов.",
            evidence: "A third factor is waste heat from human activity…",
          },
          {
            id: "l4-5",
            kind: "gap",
            prompt: "Effect: greater demand for ___",
            answers: ["electricity"],
            maxWords: 1,
            explanation: "Жара увеличивает спрос на электричество, особенно для охлаждения летом.",
            evidence: "Higher temperatures increase the demand for electricity…",
          },
          {
            id: "l4-6",
            kind: "gap",
            prompt: "People most at risk: the elderly and those with ___ problems",
            answers: ["heart"],
            maxWords: 1,
            explanation: "В группе риска пожилые люди и люди с проблемами сердца — «heart problems».",
            evidence: "Elderly people and those with heart problems are at the greatest risk.",
          },
          {
            id: "l4-7",
            kind: "gap",
            prompt: "Cool roofs are painted ___ or covered with reflective material.",
            answers: ["white"],
            maxWords: 1,
            explanation: "«Cool roofs, painted white or covered with reflective material».",
            evidence: "So-called cool roofs, painted white or covered with reflective material…",
          },
          {
            id: "l4-8",
            kind: "gap",
            prompt: "Water features: fountains and small ___",
            answers: ["canals"],
            maxWords: 1,
            explanation: "Примеры водных объектов — фонтаны и небольшие каналы (small canals).",
            evidence: "…water features, such as fountains and small canals…",
          },
          {
            id: "l4-9",
            kind: "gap",
            prompt: "Wider streets should follow the direction of the ___.",
            answers: ["wind"],
            maxWords: 1,
            explanation: "Широкие улицы по направлению ветра пропускают прохладный воздух.",
            evidence: "…wider streets that follow the direction of the wind allow cooler air to flow in.",
          },
        ],
      },
    ],
  },
];

/** Короткая запись для диагностики. */
export const DIAGNOSTIC_LISTENING: ListeningSection = {
  id: "ld-diagnostic",
  part: 1,
  title: "Adult Swimming Lessons",
  about: "Короткий разговор для диагностики: мужчина узнаёт о занятиях плаванием.",
  level: "Band 4.5–6",
  minutes: 5,
  script: [
    { speaker: "Receptionist", voice: "female", text: "Parkside Sports Centre, good afternoon." },
    { speaker: "Mark", voice: "male", text: "Hello. I'm calling about adult swimming lessons. Do you still have places?" },
    {
      speaker: "Receptionist",
      voice: "female",
      text: "We do. There are two groups: Monday evenings at seven, and Friday mornings at ten.",
    },
    { speaker: "Mark", voice: "male", text: "Monday evening, please. I work during the day." },
    { speaker: "Receptionist", voice: "female", text: "The course lasts eight weeks and costs sixty-four pounds in total." },
    { speaker: "Mark", voice: "male", text: "Sixty-four. Is that the price for members?" },
    {
      speaker: "Receptionist",
      voice: "female",
      text: "No, that's the price for everyone. Members get a free towel, but the fee is the same.",
    },
    { speaker: "Mark", voice: "male", text: "OK. What do I need to bring?" },
    { speaker: "Receptionist", voice: "female", text: "Just a swimming cap. Goggles are optional." },
    { speaker: "Mark", voice: "male", text: "And where do I go on the first evening?" },
    { speaker: "Receptionist", voice: "female", text: "Come to the main reception, and the instructor will meet you there." },
  ],
  groups: [
    {
      id: "ld-g1",
      kind: "gap",
      instructions: "Complete the notes. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
      tip: FORM_TIP,
      questions: [
        {
          id: "ld-1",
          kind: "gap",
          prompt: "Day of lessons: ___ evening",
          answers: ["monday", "mondays"],
          maxWords: 2,
          explanation: "Марк выбирает понедельник вечером: «Monday evening, please».",
          evidence: "Monday evening, please. I work during the day.",
        },
        {
          id: "ld-2",
          kind: "gap",
          prompt: "Length of course: ___ weeks",
          answers: ["8", "eight"],
          maxWords: 2,
          explanation: "«The course lasts eight weeks» — восемь недель.",
          evidence: "The course lasts eight weeks…",
        },
        {
          id: "ld-3",
          kind: "gap",
          prompt: "Total cost: £___",
          answers: ["64", "sixty-four", "sixty four"],
          maxWords: 2,
          explanation: "Стоимость — 64 фунта, одинаковая для всех.",
          evidence: "…costs sixty-four pounds in total.",
        },
        {
          id: "ld-5",
          kind: "gap",
          prompt: "First evening: go to the main ___",
          answers: ["reception"],
          maxWords: 2,
          explanation: "«Come to the main reception» — к главной стойке администратора.",
          evidence: "Come to the main reception…",
        },
      ],
    },
    {
      id: "ld-g2",
      kind: "mcq",
      instructions: "Choose the correct letter, A, B, C or D.",
      tip: MCQ_TIP,
      questions: [
        {
          id: "ld-4",
          kind: "mcq",
          prompt: "What must Mark bring to the lessons?",
          options: ["goggles", "a towel", "a swimming cap", "a membership card"],
          answer: 2,
          explanation: "Нужна только шапочка (swimming cap). Очки — по желанию, полотенце дают членам клуба.",
          evidence: "Just a swimming cap. Goggles are optional.",
        },
      ],
    },
  ],
};

export function getListeningSection(id: string): ListeningSection | undefined {
  if (id === DIAGNOSTIC_LISTENING.id) return DIAGNOSTIC_LISTENING;
  return LISTENING_SECTIONS.find((section) => section.id === id);
}
