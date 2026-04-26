import type { Grade } from "@/types";

/**
 * "Сюжетки" — short interactive stories. 4–6 scenes per story, mix of
 * narration + dialogue, one mini-interaction per scene.
 *
 * Scene text supports `**bold**` for hint emphasis and inline glossary in the
 * shape of `{word|translation}` which the player turns into tap-to-translate.
 */

export type StoryQuestionType = "cloze" | "choice" | "translate";

export interface StoryQuestion {
  type: StoryQuestionType;
  prompt: string;
  options?: string[];
  answer: string;
  hintRu?: string;
}

export interface StoryScene {
  speaker?: string;
  text: string;
  question?: StoryQuestion;
}

export interface Story {
  id: string;
  grade: Grade;
  title: string;
  titleRu: string;
  emoji: string;
  durationMin: number;
  summary: string;
  scenes: StoryScene[];
}

const STORIES: Story[] = [
  {
    id: "g2-pet-park",
    grade: 2,
    title: "A Day in the Park",
    titleRu: "День в парке",
    emoji: "🐶",
    durationMin: 3,
    summary: "Маленькая Эмма гуляет с щенком. Здороваемся, считаем мячики, прощаемся.",
    scenes: [
      {
        speaker: "Narrator",
        text: "Emma has a small {dog|собака}. His name is Max. They go to the {park|парк}.",
        question: { type: "choice", prompt: "Whose dog is Max?", options: ["Emma's", "Max's", "Tom's"], answer: "Emma's" },
      },
      {
        speaker: "Emma",
        text: "Hello, Max! Look at the {ball|мяч}!",
        question: { type: "cloze", prompt: "Hello, ___! How are you?", answer: "Max", hintRu: "имя щенка" },
      },
      {
        speaker: "Narrator",
        text: "There are {three|три} red balls and one {blue|синий} ball.",
        question: { type: "choice", prompt: "How many red balls?", options: ["one", "two", "three"], answer: "three" },
      },
      {
        speaker: "Emma",
        text: "Good boy, Max. Let's go {home|домой}.",
        question: { type: "translate", prompt: "Переведи: Let's go home.", answer: "Пойдём домой", hintRu: "let's = давай" },
      },
    ],
  },
  {
    id: "g3-birthday-cake",
    grade: 3,
    title: "Lily's Birthday",
    titleRu: "День рождения Лили",
    emoji: "🎂",
    durationMin: 4,
    summary: "У Лили день рождения. Друзья приходят, поют песню, едят торт.",
    scenes: [
      {
        speaker: "Narrator",
        text: "Today is Lily's {birthday|день рождения}. She is {nine|девять} years old.",
        question: { type: "choice", prompt: "How old is Lily?", options: ["seven", "eight", "nine"], answer: "nine" },
      },
      {
        speaker: "Friends",
        text: "Happy birthday, Lily!",
        question: { type: "cloze", prompt: "Happy ___, Lily!", answer: "birthday" },
      },
      {
        speaker: "Lily",
        text: "Thank you! I {love|люблю} the cake. It is so {sweet|сладкий}!",
        question: { type: "translate", prompt: "Переведи: I love the cake.", answer: "Я люблю торт" },
      },
      {
        speaker: "Mum",
        text: "Make a {wish|желание}, Lily!",
        question: { type: "choice", prompt: "What does Lily make?", options: ["a wish", "a cake", "a hat"], answer: "a wish" },
      },
      {
        speaker: "Narrator",
        text: "Lily {blows|задувает} the candles. Everybody {claps|хлопает}.",
        question: { type: "cloze", prompt: "Lily ___ the candles.", answer: "blows", hintRu: "задувает" },
      },
    ],
  },
  {
    id: "g4-school-monday",
    grade: 4,
    title: "Monday at School",
    titleRu: "Понедельник в школе",
    emoji: "🎒",
    durationMin: 4,
    summary: "Утро понедельника. Том собирается, идёт в школу, отвечает на уроке.",
    scenes: [
      {
        speaker: "Narrator",
        text: "It is {Monday|понедельник} morning. Tom puts on his school {uniform|форма}.",
        question: { type: "choice", prompt: "What day is it?", options: ["Sunday", "Monday", "Friday"], answer: "Monday" },
      },
      {
        speaker: "Mum",
        text: "Hurry up, Tom! Don't be {late|опаздывать}!",
        question: { type: "translate", prompt: "Переведи: Don't be late!", answer: "Не опаздывай!" },
      },
      {
        speaker: "Teacher",
        text: "Good morning, class. Open your books at page {twelve|двенадцать}.",
        question: { type: "cloze", prompt: "Open your ___ at page twelve.", answer: "books" },
      },
      {
        speaker: "Tom",
        text: "Excuse me, can I {borrow|одолжить} a pencil?",
        question: { type: "choice", prompt: "What does Tom want to borrow?", options: ["a book", "a pencil", "a ruler"], answer: "a pencil" },
      },
      {
        speaker: "Narrator",
        text: "After class Tom plays football with his {friends|друзья}.",
        question: { type: "translate", prompt: "Переведи: He plays football.", answer: "Он играет в футбол" },
      },
    ],
  },
  {
    id: "g5-london-bus",
    grade: 5,
    title: "Lost in London",
    titleRu: "Потерялись в Лондоне",
    emoji: "🚌",
    durationMin: 5,
    summary: "Аня впервые в Лондоне. Спрашивает дорогу, садится не на тот автобус.",
    scenes: [
      {
        speaker: "Anya",
        text: "Excuse me, where is {Tower Bridge|Тауэрский мост}, please?",
        question: { type: "cloze", prompt: "___ me, where is Tower Bridge?", answer: "Excuse" },
      },
      {
        speaker: "Local",
        text: "Take {bus|автобус} 15. The stop is over there.",
        question: { type: "choice", prompt: "Which bus to take?", options: ["5", "15", "50"], answer: "15" },
      },
      {
        speaker: "Anya",
        text: "Thank you very much! That's very {kind|любезно}.",
        question: { type: "translate", prompt: "Переведи: Thank you very much.", answer: "Большое спасибо" },
      },
      {
        speaker: "Narrator",
        text: "Oh no — Anya gets on bus {51|пятьдесят один} by mistake!",
        question: { type: "cloze", prompt: "She got on the ___ bus.", answer: "wrong", hintRu: "не тот" },
      },
      {
        speaker: "Anya",
        text: "Driver, am I going to {Tower Bridge|Тауэрский мост}?",
        question: { type: "choice", prompt: "What does she ask?", options: ["the way", "the time", "the price"], answer: "the way" },
      },
      {
        speaker: "Driver",
        text: "No, you should get off at the next stop and take bus 15.",
        question: { type: "translate", prompt: "Переведи: get off at the next stop.", answer: "Выйди на следующей остановке" },
      },
    ],
  },
  {
    id: "g6-cafe-order",
    grade: 6,
    title: "At a Café",
    titleRu: "В кафе",
    emoji: "☕",
    durationMin: 4,
    summary: "Заказ в кафе: меню, выбор блюда, оплата, чаевые.",
    scenes: [
      {
        speaker: "Waiter",
        text: "Good afternoon. Would you like to see the {menu|меню}?",
        question: { type: "translate", prompt: "Переведи: Would you like to see the menu?", answer: "Хотите посмотреть меню?" },
      },
      {
        speaker: "Customer",
        text: "Yes, please. What do you {recommend|рекомендовать}?",
        question: { type: "cloze", prompt: "What do you ___?", answer: "recommend" },
      },
      {
        speaker: "Waiter",
        text: "Our soup of the day is excellent.",
        question: { type: "choice", prompt: "Which dish does the waiter recommend?", options: ["the salad", "the soup", "the steak"], answer: "the soup" },
      },
      {
        speaker: "Customer",
        text: "Sounds good. I'll have the soup and an {orange juice|апельсиновый сок}.",
        question: { type: "cloze", prompt: "I'll ___ the soup, please.", answer: "have", hintRu: "брать (заказать)" },
      },
      {
        speaker: "Waiter",
        text: "Anything {else|ещё}?",
        question: { type: "translate", prompt: "Переведи: Anything else?", answer: "Что-нибудь ещё?" },
      },
      {
        speaker: "Customer",
        text: "No, thanks. Could I have the {bill|счёт}, please?",
        question: { type: "choice", prompt: "What does she ask for?", options: ["the bill", "the menu", "the key"], answer: "the bill" },
      },
    ],
  },
  {
    id: "g7-job-interview",
    grade: 7,
    title: "First Job Interview",
    titleRu: "Первое собеседование",
    emoji: "💼",
    durationMin: 5,
    summary: "Подросток идёт на собеседование на летнюю работу. Сильные стороны, ошибки, итог.",
    scenes: [
      {
        speaker: "Manager",
        text: "Tell me a bit about {yourself|о себе}, please.",
        question: { type: "cloze", prompt: "Tell me about ___.", answer: "yourself" },
      },
      {
        speaker: "Kate",
        text: "I'm sixteen and I really enjoy working with {children|дети}.",
        question: { type: "choice", prompt: "Who does Kate enjoy working with?", options: ["adults", "children", "animals"], answer: "children" },
      },
      {
        speaker: "Manager",
        text: "What are your strong points?",
        question: { type: "translate", prompt: "Переведи: I'm a fast learner.", answer: "Я быстро учусь" },
      },
      {
        speaker: "Kate",
        text: "I'm reliable and I learn quickly.",
        question: { type: "cloze", prompt: "I am ___ and I learn quickly.", answer: "reliable", hintRu: "надёжный" },
      },
      {
        speaker: "Manager",
        text: "Any weaknesses?",
        question: { type: "choice", prompt: "What does the manager ask about now?", options: ["strong points", "weaknesses", "salary"], answer: "weaknesses" },
      },
      {
        speaker: "Kate",
        text: "Sometimes I worry too much, but I am working on it.",
        question: { type: "translate", prompt: "Переведи: I'm working on it.", answer: "Я над этим работаю" },
      },
    ],
  },
  {
    id: "g8-debate-screens",
    grade: 8,
    title: "Screens at School",
    titleRu: "Экраны в школе",
    emoji: "📱",
    durationMin: 6,
    summary: "Мини-дебаты на уроке: телефоны в школе — польза или вред?",
    scenes: [
      {
        speaker: "Teacher",
        text: "Today's question: should phones be {allowed|разрешены} in class?",
        question: { type: "cloze", prompt: "Should phones be ___ in class?", answer: "allowed" },
      },
      {
        speaker: "Anna",
        text: "In my opinion, phones {distract|отвлекать} students from learning.",
        question: { type: "translate", prompt: "Переведи: In my opinion.", answer: "По-моему / На мой взгляд" },
      },
      {
        speaker: "Mark",
        text: "I disagree. We can use phones to look up new words quickly.",
        question: { type: "choice", prompt: "What is Mark's point?", options: ["phones distract", "phones help to learn", "phones are expensive"], answer: "phones help to learn" },
      },
      {
        speaker: "Anna",
        text: "However, many students just {scroll|листают} social media instead.",
        question: { type: "cloze", prompt: "However, many students just ___ social media.", answer: "scroll" },
      },
      {
        speaker: "Teacher",
        text: "Both of you make good points. Can you find a {compromise|компромисс}?",
        question: { type: "translate", prompt: "Переведи: Find a compromise.", answer: "Найти компромисс" },
      },
      {
        speaker: "Anna",
        text: "Maybe phones could be allowed only for {dictionaries|словари}.",
        question: { type: "choice", prompt: "What is the compromise?", options: ["ban phones forever", "allow only as dictionaries", "allow always"], answer: "allow only as dictionaries" },
      },
    ],
  },
  {
    id: "g4-pet-cat",
    grade: 4,
    title: "The Naughty Cat",
    titleRu: "Озорной кот",
    emoji: "🐱",
    durationMin: 3,
    summary: "Кот забрался в шкаф и спрятал любимую игрушку.",
    scenes: [
      {
        speaker: "Narrator",
        text: "Mia has a small {cat|кот}. His name is Whiskers.",
        question: { type: "cloze", prompt: "Mia has a ___.", answer: "cat" },
      },
      {
        speaker: "Mia",
        text: "Where is my {toy|игрушка}? I can't find it!",
        question: { type: "choice", prompt: "What is Mia looking for?", options: ["a book", "a toy", "a cat"], answer: "a toy" },
      },
      {
        speaker: "Mum",
        text: "Look in the {cupboard|шкаф}, dear.",
        question: { type: "translate", prompt: "Переведи: Look in the cupboard.", answer: "Посмотри в шкафу" },
      },
      {
        speaker: "Narrator",
        text: "Whiskers is sleeping on the toy! What a {funny|смешной} cat.",
        question: { type: "cloze", prompt: "What a ___ cat!", answer: "funny" },
      },
    ],
  },
  {
    id: "g6-travel-airport",
    grade: 6,
    title: "Airport Trouble",
    titleRu: "Беда в аэропорту",
    emoji: "✈️",
    durationMin: 5,
    summary: "Регистрация на рейс, проблемы с багажом, посадка.",
    scenes: [
      {
        speaker: "Agent",
        text: "Good morning. May I see your {passport|паспорт} and ticket?",
        question: { type: "cloze", prompt: "May I see your ___?", answer: "passport" },
      },
      {
        speaker: "Sam",
        text: "Sure, here you are. I'd like a window {seat|место}, please.",
        question: { type: "translate", prompt: "Переведи: Here you are.", answer: "Вот, пожалуйста" },
      },
      {
        speaker: "Agent",
        text: "I'm afraid your bag is {overweight|перевес}. It's two kilos too heavy.",
        question: { type: "choice", prompt: "What's the problem?", options: ["wrong passport", "bag overweight", "no seats"], answer: "bag overweight" },
      },
      {
        speaker: "Sam",
        text: "Oh no. Can I take some things out?",
        question: { type: "cloze", prompt: "Can I ___ some things out?", answer: "take" },
      },
      {
        speaker: "Agent",
        text: "Of course. Please {repack|переложить} and come back.",
        question: { type: "translate", prompt: "Переведи: Come back, please.", answer: "Вернитесь, пожалуйста" },
      },
    ],
  },
];

export function listStoriesByGrade(grade: Grade): Story[] {
  return STORIES.filter((s) => s.grade === grade);
}

export function getStory(id: string): Story | null {
  return STORIES.find((s) => s.id === id) ?? null;
}

export function listAllStories(): Story[] {
  return STORIES;
}

/**
 * Strip translation glossary tokens `{word|translation}` to surface only the
 * English text. Used when generating audio prompts or comparing answers.
 */
export function plainText(text: string): string {
  return text.replace(/\{([^|}]+)\|[^}]+\}/g, (_, w) => String(w));
}
