// Curated external English-learning resources.
// All entries checked to be free, officially run by an education
// organization or well-known publisher, and appropriate for
// school-aged learners. No paid-only or ad-heavy sites.

export type ResourceCategory =
  | "listening"
  | "reading"
  | "games"
  | "video"
  | "grammar"
  | "vocabulary"
  | "exams"
  | "dialogues";

export interface Resource {
  id: string;
  title: string;
  url: string;
  description: string;
  categories: ResourceCategory[];
  /** Inclusive grade range, e.g. [2, 5] for 2-5 classes */
  grade: [number, number];
  /** Short origin label shown on card */
  source: string;
  /** Lang of UI on the target site */
  uiLang: "en" | "ru" | "both";
  /** Highlight as editor's pick (shown with star and gradient border) */
  featured?: boolean;
  /** Extra per-card hint */
  note?: string;
}

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  listening: "Аудирование",
  reading: "Чтение",
  games: "Игры",
  video: "Видео",
  grammar: "Грамматика",
  vocabulary: "Лексика",
  exams: "Экзамены",
  dialogues: "Диалоги",
};

export const RESOURCES: Resource[] = [
  // -------- Official English learning (British Council / Cambridge / BBC) --------
  {
    id: "bc-kids",
    title: "LearnEnglish Kids",
    url: "https://learnenglishkids.britishcouncil.org/",
    description:
      "Песни, истории, игры и печатные материалы от British Council для младших школьников.",
    categories: ["listening", "games", "video", "vocabulary"],
    grade: [2, 5],
    source: "British Council",
    uiLang: "en",
    featured: true,
  },
  {
    id: "bc-teens",
    title: "LearnEnglish Teens",
    url: "https://learnenglishteens.britishcouncil.org/",
    description:
      "Grammar Snack видео, reading/listening по уровням A1-B2, подготовка к экзаменам.",
    categories: ["listening", "reading", "grammar", "exams"],
    grade: [5, 8],
    source: "British Council",
    uiLang: "en",
    featured: true,
  },
  {
    id: "bbc-learning",
    title: "BBC Learning English",
    url: "https://www.bbc.co.uk/learningenglish",
    description:
      "Короткие видео, подкасты, 6 Minute English — аутентичная речь с транскриптами.",
    categories: ["listening", "video", "vocabulary"],
    grade: [5, 8],
    source: "BBC",
    uiLang: "en",
    featured: true,
  },
  {
    id: "cambridge-learning",
    title: "Cambridge Learning English",
    url: "https://www.cambridgeenglish.org/learning-english/",
    description:
      "Официальные практические тесты A1-C1 от Cambridge Assessment: listening, reading, writing.",
    categories: ["exams", "listening", "reading"],
    grade: [5, 8],
    source: "Cambridge English",
    uiLang: "en",
  },

  // -------- Games & interactive --------
  {
    id: "starfall",
    title: "Starfall",
    url: "https://www.starfall.com/h/",
    description:
      "Фонетика, алфавит, короткие истории с озвучкой. Идеально для 2-3 классов.",
    categories: ["games", "reading", "listening"],
    grade: [2, 3],
    source: "Starfall",
    uiLang: "en",
  },
  {
    id: "abcya",
    title: "ABCya",
    url: "https://www.abcya.com/",
    description:
      "Образовательные игры по уровням класса (Grades K-6): буквы, слова, грамматика.",
    categories: ["games", "vocabulary", "grammar"],
    grade: [2, 5],
    source: "ABCya",
    uiLang: "en",
  },
  {
    id: "wordwall",
    title: "Wordwall",
    url: "https://wordwall.net/",
    description:
      "Библиотека интерактивных упражнений-шаблонов (match, wheel, quiz) — можно сделать свою игру за 3 минуты.",
    categories: ["games", "vocabulary", "grammar"],
    grade: [2, 8],
    source: "Wordwall",
    uiLang: "en",
    featured: true,
  },
  {
    id: "quizlet",
    title: "Quizlet",
    url: "https://quizlet.com/",
    description:
      "Карточки, 5 режимов (match, learn, test, spell) — миллионы готовых наборов по Spotlight.",
    categories: ["vocabulary", "games"],
    grade: [2, 8],
    source: "Quizlet",
    uiLang: "both",
  },
  {
    id: "lyricstraining",
    title: "LyricsTraining",
    url: "https://lyricstraining.com/",
    description:
      "Караоке-тренажёр: слушаешь песню и печатаешь пропущенные слова. 4 уровня сложности.",
    categories: ["listening", "games", "vocabulary"],
    grade: [5, 8],
    source: "LyricsTraining",
    uiLang: "en",
    featured: true,
  },

  // -------- Listening --------
  {
    id: "esl-lab",
    title: "Randall's ESL Cyber Listening Lab",
    url: "https://www.esl-lab.com/",
    description:
      "Больше 700 аудиодиалогов по уровням с вопросами. Реальные ситуации.",
    categories: ["listening", "dialogues"],
    grade: [5, 8],
    source: "esl-lab.com",
    uiLang: "en",
  },
  {
    id: "elllo",
    title: "ELLLO — English Listening Lesson Library",
    url: "https://elllo.org/",
    description:
      "3000+ бесплатных аудиоуроков с транскриптами. Реальные собеседники из разных стран.",
    categories: ["listening", "dialogues"],
    grade: [5, 8],
    source: "elllo.org",
    uiLang: "en",
  },
  {
    id: "breaking-news",
    title: "Breaking News English",
    url: "https://breakingnewsenglish.com/",
    description:
      "Новости адаптированы на 7 уровней сложности. Аудио + упражнения автоматом.",
    categories: ["listening", "reading"],
    grade: [6, 8],
    source: "BNE",
    uiLang: "en",
  },
  {
    id: "storynory",
    title: "Storynory",
    url: "https://www.storynory.com/",
    description:
      "Аудиосказки и стихи с чёткой британской озвучкой. Текст рядом для чтения.",
    categories: ["listening", "reading"],
    grade: [2, 5],
    source: "Storynory",
    uiLang: "en",
  },

  // -------- Reading --------
  {
    id: "oxford-owl",
    title: "Oxford Owl eBooks",
    url: "https://www.oxfordowl.co.uk/for-home/find-a-book/library-page",
    description:
      "250+ бесплатных электронных книг с озвучкой по возрастам. Нужна регистрация.",
    categories: ["reading", "listening"],
    grade: [2, 5],
    source: "Oxford",
    uiLang: "en",
    featured: true,
  },
  {
    id: "newsinlevels",
    title: "News in Levels",
    url: "https://www.newsinlevels.com/",
    description:
      "Новости на 3 уровнях сложности с аудио и переводом незнакомых слов.",
    categories: ["reading", "listening"],
    grade: [5, 8],
    source: "News in Levels",
    uiLang: "en",
  },
  {
    id: "commonlit",
    title: "CommonLit",
    url: "https://www.commonlit.org/",
    description:
      "Подборка текстов с вопросами по чтению от школ США. Свободный доступ.",
    categories: ["reading"],
    grade: [6, 8],
    source: "CommonLit",
    uiLang: "en",
  },

  // -------- Video --------
  {
    id: "tededed",
    title: "TED-Ed",
    url: "https://ed.ted.com/",
    description:
      "Короткие анимированные уроки на любую тему. Английские субтитры + quiz под видео.",
    categories: ["video", "listening"],
    grade: [5, 8],
    source: "TED-Ed",
    uiLang: "en",
  },
  {
    id: "eng-with-lucy",
    title: "English with Lucy (YouTube)",
    url: "https://www.youtube.com/@EnglishwithLucy",
    description:
      "Британский английский: произношение, грамматика, словарь. Очень чёткая подача.",
    categories: ["video", "grammar", "vocabulary"],
    grade: [6, 8],
    source: "YouTube",
    uiLang: "en",
  },
  {
    id: "peppa-pig",
    title: "Peppa Pig Official (YouTube)",
    url: "https://www.youtube.com/@PeppaPigOfficial",
    description:
      "Короткие эпизоды с простым английским. Классика для 2-4 классов.",
    categories: ["video", "listening"],
    grade: [2, 4],
    source: "YouTube",
    uiLang: "en",
  },

  // -------- Grammar / Vocabulary --------
  {
    id: "perfect-english-grammar",
    title: "Perfect English Grammar",
    url: "https://www.perfect-english-grammar.com/",
    description:
      "Чёткие объяснения и онлайн-упражнения по каждой теме: времена, условные, модальные.",
    categories: ["grammar"],
    grade: [5, 8],
    source: "PEG",
    uiLang: "en",
  },
  {
    id: "english-page",
    title: "EnglishPage",
    url: "https://www.englishpage.com/",
    description:
      "Полный справочник глагольных времён с примерами + бесплатные тесты.",
    categories: ["grammar"],
    grade: [5, 8],
    source: "EnglishPage",
    uiLang: "en",
  },
  {
    id: "memrise",
    title: "Memrise",
    url: "https://www.memrise.com/",
    description:
      "Лексика через реальные видеоклипы носителей. Бесплатный режим с ежедневной практикой.",
    categories: ["vocabulary", "video"],
    grade: [5, 8],
    source: "Memrise",
    uiLang: "both",
  },
  {
    id: "vocabulary-com",
    title: "Vocabulary.com",
    url: "https://www.vocabulary.com/",
    description:
      "Адаптивная тренировка лексики. Крутой тест (Challenge) и списки под темы/уровни.",
    categories: ["vocabulary"],
    grade: [6, 8],
    source: "Vocabulary.com",
    uiLang: "en",
  },

  // -------- Exams & placement --------
  {
    id: "ef-set",
    title: "EF SET",
    url: "https://www.efset.org/",
    description:
      "Бесплатный тест уровня (50 минут) с сертификатом. Признаётся многими.",
    categories: ["exams"],
    grade: [7, 8],
    source: "EF",
    uiLang: "both",
  },
  {
    id: "test-english",
    title: "Test-English.com",
    url: "https://test-english.com/",
    description:
      "Тесты по уровням A1-C1 по грамматике и лексике. Моментальная обратная связь.",
    categories: ["exams", "grammar"],
    grade: [5, 8],
    source: "Test-English",
    uiLang: "en",
  },
  {
    id: "flo-joe",
    title: "Flo-Joe (FCE/CAE practice)",
    url: "https://www.flo-joe.co.uk/",
    description:
      "Тренажёр к Cambridge B2 First и C1 Advanced. Полезно для топ-учеников 8 класса.",
    categories: ["exams"],
    grade: [8, 8],
    source: "Flo-Joe",
    uiLang: "en",
  },

  // -------- Dialogues & speaking prompts --------
  {
    id: "eslfast",
    title: "ESL Fast Dialogues",
    url: "https://www.eslfast.com/robot/",
    description:
      "1500+ простых диалогов с аудио на реальные темы: школа, семья, магазин.",
    categories: ["dialogues", "listening"],
    grade: [5, 8],
    source: "ESL Fast",
    uiLang: "en",
  },
  {
    id: "dialogs-basic",
    title: "Real English Conversations",
    url: "https://realenglishconversations.com/free-english-lessons/",
    description:
      "Бесплатные диалоги носителей с разбором фраз и акцентов.",
    categories: ["dialogues", "listening"],
    grade: [6, 8],
    source: "RealEnglishConv.",
    uiLang: "en",
  },

  // -------- Russian-friendly --------
  {
    id: "puzzle-english",
    title: "Puzzle English",
    url: "https://puzzle-english.com/",
    description:
      "Пазлы на слух по видеоклипам, подкасты, грамматика. Много бесплатного для школьников.",
    categories: ["listening", "video", "grammar"],
    grade: [5, 8],
    source: "Puzzle English",
    uiLang: "ru",
  },
  {
    id: "engblog",
    title: "Engblog.ru",
    url: "https://engblog.ru/",
    description:
      "Русскоязычный блог: разбор грамматики, слов, идиом. Хорошие статьи для учителей.",
    categories: ["grammar", "vocabulary"],
    grade: [5, 8],
    source: "Engblog",
    uiLang: "ru",
  },
  {
    id: "lingust",
    title: "Лингуст",
    url: "https://lingust.ru/english",
    description:
      "Бесплатные базовые курсы и аудио для начинающих. Удобно с 2-3 класса.",
    categories: ["listening", "grammar"],
    grade: [2, 5],
    source: "Лингуст",
    uiLang: "ru",
  },
];

export const FEATURED_RESOURCES = RESOURCES.filter((r) => r.featured);

export function filterResources(
  items: Resource[],
  opts: { grade?: number; categories?: ResourceCategory[]; query?: string },
): Resource[] {
  const q = opts.query?.trim().toLowerCase();
  return items.filter((r) => {
    if (opts.grade != null) {
      if (opts.grade < r.grade[0] || opts.grade > r.grade[1]) return false;
    }
    if (opts.categories && opts.categories.length > 0) {
      if (!opts.categories.some((c) => r.categories.includes(c))) return false;
    }
    if (q) {
      const hay = `${r.title} ${r.description} ${r.source}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
