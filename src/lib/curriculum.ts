import type { CurriculumModule, Grade } from "@/types";

// Compact rendering of the Spotlight 2-8 grade curriculum.
// Source: Express Publishing / «Просвещение» Spotlight textbook series. Approximate.
export const CURRICULUM: CurriculumModule[] = [
  // Grade 2
  {
    id: "g2-m1",
    grade: 2,
    number: 1,
    title: "My Home",
    topics: ["Дом и комната", "Члены семьи"],
    grammar: ["Глагол to be (am/is/are)", "This is / These are"],
    vocabulary: ["bedroom", "kitchen", "bathroom", "garden", "dining room"],
  },
  {
    id: "g2-m2",
    grade: 2,
    number: 2,
    title: "My Birthday",
    topics: ["День рождения", "Цифры 1-10", "Еда"],
    grammar: ["How many …?", "I like / I don't like"],
    vocabulary: ["cake", "candles", "ice cream", "chocolate", "lemonade"],
  },
  {
    id: "g2-m3",
    grade: 2,
    number: 3,
    title: "My Animals",
    topics: ["Любимые животные", "Способности"],
    grammar: ["Can / can't для способностей", "Have got / has got"],
    vocabulary: ["fish", "bird", "frog", "horse", "chimp"],
  },
  {
    id: "g2-m4",
    grade: 2,
    number: 4,
    title: "My Toys",
    topics: ["Игрушки", "Предлоги места"],
    grammar: ["Предлоги (in, on, under)", "Множественное число"],
    vocabulary: ["teddy bear", "toy soldier", "ballerina", "shelf", "musical box"],
  },
  // Grade 3
  {
    id: "g3-m1",
    grade: 3,
    number: 1,
    title: "School Days",
    topics: ["Школьные предметы", "Правила школы"],
    grammar: ["Present Simple (утверждение)", "Команды (Imperative)"],
    vocabulary: ["Maths", "English", "PE", "Science", "Art"],
  },
  {
    id: "g3-m2",
    grade: 3,
    number: 2,
    title: "Family Moments",
    topics: ["Семья", "Чувства и эмоции"],
    grammar: ["Possessive adjectives (my, your, his, her)", "Who is this?"],
    vocabulary: ["grandma", "grandpa", "cousin", "uncle", "aunt"],
  },
  {
    id: "g3-m3",
    grade: 3,
    number: 3,
    title: "All the Things I Like!",
    topics: ["Еда и напитки", "Предпочтения"],
    grammar: ["Present Simple (вопросы и отрицания)", "Some / any"],
    vocabulary: ["pasta", "rice", "meat", "fish", "vegetables"],
  },
  {
    id: "g3-m4",
    grade: 3,
    number: 4,
    title: "Come In and Play!",
    topics: ["Игрушки дома", "Комнаты"],
    grammar: ["There is / there are", "Whose is it?"],
    vocabulary: ["doll", "plane", "train", "musical box", "rocking horse"],
  },
  // Grade 4
  {
    id: "g4-m1",
    grade: 4,
    number: 1,
    title: "Back Together",
    topics: ["Внешность", "Друзья"],
    grammar: ["Present Simple (повторение)", "Вопросы What / Who / Where"],
    vocabulary: ["tall", "short", "funny", "kind", "shy"],
  },
  {
    id: "g4-m2",
    grade: 4,
    number: 2,
    title: "Working Day",
    topics: ["Профессии", "Время суток"],
    grammar: ["Present Simple (3-е лицо)", "Наречия частотности"],
    vocabulary: ["doctor", "dentist", "farmer", "waiter", "mechanic"],
  },
  {
    id: "g4-m3",
    grade: 4,
    number: 3,
    title: "Tasty Treats",
    topics: ["Еда на кухне", "Рецепты"],
    grammar: ["Much / many / a lot of", "A cup of / a glass of"],
    vocabulary: ["bread", "butter", "cheese", "honey", "lemonade"],
  },
  {
    id: "g4-m4",
    grade: 4,
    number: 4,
    title: "At the Zoo",
    topics: ["Животные в зоопарке", "Характер"],
    grammar: ["Present Continuous", "Сравнение Present Simple и Continuous"],
    vocabulary: ["lion", "elephant", "giraffe", "peacock", "seal"],
  },
  // Grade 5
  {
    id: "g5-m1",
    grade: 5,
    number: 1,
    title: "School Days",
    topics: ["Школа", "Расписание"],
    grammar: ["Present Simple", "Глаголы состояния"],
    vocabulary: ["timetable", "schoolbag", "pupil", "headmaster", "subject"],
  },
  {
    id: "g5-m2",
    grade: 5,
    number: 2,
    title: "That's Me!",
    topics: ["Личная информация", "Страны"],
    grammar: ["Have got / has got", "Possessive case"],
    vocabulary: ["Russia", "Britain", "Spain", "passport", "nationality"],
  },
  {
    id: "g5-m3",
    grade: 5,
    number: 3,
    title: "My Home, My Castle",
    topics: ["Дом", "Мебель"],
    grammar: ["There is / there are", "Предлоги места"],
    vocabulary: ["armchair", "carpet", "fridge", "mirror", "wardrobe"],
  },
  {
    id: "g5-m4",
    grade: 5,
    number: 4,
    title: "Family Ties",
    topics: ["Семья", "Описание людей"],
    grammar: ["Object pronouns", "Can / can't"],
    vocabulary: ["brave", "clever", "kind", "noisy", "patient"],
  },
  // Grade 6
  {
    id: "g6-m1",
    grade: 6,
    number: 1,
    title: "Who's Who?",
    topics: ["Знакомства", "Документы"],
    grammar: ["Have got / Has got", "Question words"],
    vocabulary: ["ID card", "nickname", "address", "postcode", "signature"],
  },
  {
    id: "g6-m2",
    grade: 6,
    number: 2,
    title: "Here We Are",
    topics: ["Время", "Месяцы и даты"],
    grammar: ["Предлоги времени (at/in/on)", "Ordinal numbers"],
    vocabulary: ["calendar", "celebration", "month", "season", "festival"],
  },
  {
    id: "g6-m3",
    grade: 6,
    number: 3,
    title: "Getting Around",
    topics: ["Транспорт", "Дорожные знаки"],
    grammar: ["Imperative", "Can / must"],
    vocabulary: ["bicycle", "underground", "helicopter", "tram", "motorbike"],
  },
  {
    id: "g6-m4",
    grade: 6,
    number: 4,
    title: "Day After Day",
    topics: ["Распорядок дня", "Свободное время"],
    grammar: ["Present Simple", "Наречия частотности"],
    vocabulary: ["routine", "spare time", "hobby", "weekend", "habit"],
  },
  // Grade 7
  {
    id: "g7-m1",
    grade: 7,
    number: 1,
    title: "Lifestyles",
    topics: ["Город и деревня", "Образ жизни"],
    grammar: ["Present Simple vs Present Continuous"],
    vocabulary: ["countryside", "suburbs", "skyscraper", "cottage", "flat"],
  },
  {
    id: "g7-m2",
    grade: 7,
    number: 2,
    title: "Tale Time",
    topics: ["Литература", "Истории"],
    grammar: ["Past Simple (правильные/неправильные глаголы)"],
    vocabulary: ["character", "plot", "hero", "villain", "adventure"],
  },
  {
    id: "g7-m3",
    grade: 7,
    number: 3,
    title: "Profiles",
    topics: ["Черты характера", "Знаменитости"],
    grammar: ["Относительные местоимения (who, which, that)"],
    vocabulary: ["ambitious", "creative", "patient", "loyal", "generous"],
  },
  {
    id: "g7-m4",
    grade: 7,
    number: 4,
    title: "In the News",
    topics: ["СМИ", "Новости"],
    grammar: ["Past Continuous", "Past Simple vs Past Continuous"],
    vocabulary: ["headline", "broadcast", "journalist", "report", "article"],
  },
  // Grade 8
  {
    id: "g8-m1",
    grade: 8,
    number: 1,
    title: "Socialising",
    topics: ["Общение", "Первое впечатление"],
    grammar: ["Present Simple / Continuous / Perfect"],
    vocabulary: ["polite", "rude", "sociable", "outgoing", "introvert"],
  },
  {
    id: "g8-m2",
    grade: 8,
    number: 2,
    title: "Food & Shopping",
    topics: ["Магазины", "Деньги"],
    grammar: ["Past Simple / Present Perfect"],
    vocabulary: ["receipt", "discount", "refund", "grocery", "boutique"],
  },
  {
    id: "g8-m3",
    grade: 8,
    number: 3,
    title: "Great Minds",
    topics: ["Знаменитые учёные", "Изобретения"],
    grammar: ["Past Perfect", "Used to / would"],
    vocabulary: ["invention", "discover", "genius", "breakthrough", "experiment"],
  },
  {
    id: "g8-m4",
    grade: 8,
    number: 4,
    title: "Be Yourself",
    topics: ["Внешность и стиль", "Мода"],
    grammar: ["Модальные глаголы: must / can't / may"],
    vocabulary: ["outfit", "trendy", "baggy", "tight", "formal"],
  },
];

export function modulesByGrade(grade: Grade): CurriculumModule[] {
  return CURRICULUM.filter((m) => m.grade === grade).sort((a, b) => a.number - b.number);
}

export function moduleById(id: string): CurriculumModule | undefined {
  return CURRICULUM.find((m) => m.id === id);
}

export function moduleByGradeNumber(grade: Grade, number: number): CurriculumModule | undefined {
  return CURRICULUM.find((m) => m.grade === grade && m.number === number);
}

export const GRADES: Grade[] = [2, 3, 4, 5, 6, 7, 8];
