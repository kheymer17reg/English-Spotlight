import type { CurriculumModule, Grade } from "@/types";

// Compact rendering of the Spotlight 2-8 grade curriculum.
// Source: Express Publishing / «Просвещение» Spotlight textbook series. Approximate.
// Vocabulary lists are deliberately wide — see src/lib/vocabulary.ts for the
// translations dictionary; modules link to it via the lemma strings below.
export const CURRICULUM: CurriculumModule[] = [
  // === Grade 2 ===
  {
    id: "g2-m1",
    grade: 2,
    number: 1,
    title: "My Home",
    topics: ["Дом и комната", "Мебель", "Члены семьи"],
    grammar: ["Глагол to be (am/is/are)", "This is / These are", "Артикли a/an/the"],
    vocabulary: [
      "bedroom", "kitchen", "bathroom", "garden", "dining room",
      "living room", "hall", "stairs", "door", "window",
      "roof", "chair", "table", "bed", "sofa",
      "lamp", "TV", "clock", "picture", "carpet",
    ],
  },
  {
    id: "g2-m2",
    grade: 2,
    number: 2,
    title: "My Birthday",
    topics: ["День рождения", "Цифры 1-10", "Любимая еда"],
    grammar: ["How many …?", "I like / I don't like", "Множественное число существительных"],
    vocabulary: [
      "cake", "candles", "ice cream", "chocolate", "lemonade",
      "balloon", "present", "party", "friend", "song",
      "dance", "happy", "year", "old", "number",
      "one", "two", "three", "four", "five",
    ],
  },
  {
    id: "g2-m3",
    grade: 2,
    number: 3,
    title: "My Animals",
    topics: ["Любимые животные", "Способности", "Глаголы движения"],
    grammar: ["Can / can't для способностей", "Have got / has got"],
    vocabulary: [
      "fish", "bird", "frog", "horse", "chimp",
      "dog", "cat", "rabbit", "mouse", "hen",
      "cow", "sheep", "pig", "duck", "swan",
      "jump", "swim", "fly", "run", "climb",
    ],
  },
  {
    id: "g2-m4",
    grade: 2,
    number: 4,
    title: "My Toys",
    topics: ["Игрушки", "Предлоги места", "Цвета"],
    grammar: ["Предлоги (in, on, under, behind, near)", "Множественное число (-s, -es)"],
    vocabulary: [
      "teddy bear", "toy soldier", "ballerina", "shelf", "musical box",
      "doll", "ball", "kite", "drum", "puzzle",
      "robot", "car", "bike", "plane", "train",
      "in", "on", "under", "behind", "near",
    ],
  },

  // === Grade 3 ===
  {
    id: "g3-m1",
    grade: 3,
    number: 1,
    title: "School Days",
    topics: ["Школьные предметы", "Расписание", "Школьные принадлежности"],
    grammar: ["Present Simple (утверждение)", "Команды (Imperative)", "Дни недели"],
    vocabulary: [
      "Maths", "English", "PE", "Science", "Art",
      "Music", "History", "Geography", "Russian", "IT",
      "lesson", "class", "pupil", "teacher", "school",
      "book", "pen", "pencil", "ruler", "rubber",
    ],
  },
  {
    id: "g3-m2",
    grade: 3,
    number: 2,
    title: "Family Moments",
    topics: ["Семья", "Чувства и эмоции"],
    grammar: ["Possessive adjectives (my, your, his, her)", "Who is this?"],
    vocabulary: [
      "grandma", "grandpa", "cousin", "uncle", "aunt",
      "mum", "dad", "sister", "brother", "parent",
      "baby", "family", "photo", "love", "hug",
      "kiss", "son", "daughter", "wife", "husband",
    ],
  },
  {
    id: "g3-m3",
    grade: 3,
    number: 3,
    title: "All the Things I Like!",
    topics: ["Еда и напитки", "Предпочтения", "За столом"],
    grammar: ["Present Simple (вопросы и отрицания)", "Some / any"],
    vocabulary: [
      "pasta", "rice", "meat", "fish", "vegetables",
      "fruit", "apple", "banana", "orange", "tomato",
      "potato", "sandwich", "soup", "salad", "pizza",
      "milk", "juice", "water", "tea", "coffee",
    ],
  },
  {
    id: "g3-m4",
    grade: 3,
    number: 4,
    title: "Come In and Play!",
    topics: ["Игрушки дома", "Комнаты", "Совместные игры"],
    grammar: ["There is / there are", "Whose is it?"],
    vocabulary: [
      "doll", "plane", "train", "musical box", "rocking horse",
      "computer", "phone", "camera", "book", "magazine",
      "board game", "card", "dice", "chess", "lego",
      "toy", "game", "room", "play", "fun",
    ],
  },

  // === Grade 4 ===
  {
    id: "g4-m1",
    grade: 4,
    number: 1,
    title: "Back Together",
    topics: ["Внешность", "Друзья", "Эмоции"],
    grammar: ["Present Simple (повторение)", "Вопросы What / Who / Where", "Описание людей"],
    vocabulary: [
      "tall", "short", "funny", "kind", "shy",
      "friendly", "happy", "sad", "angry", "tired",
      "hair", "eyes", "nose", "mouth", "face",
      "smile", "laugh", "talk", "listen", "friend",
    ],
  },
  {
    id: "g4-m2",
    grade: 4,
    number: 2,
    title: "Working Day",
    topics: ["Профессии", "Время суток", "Места работы"],
    grammar: ["Present Simple (3-е лицо -s/-es)", "Наречия частотности"],
    vocabulary: [
      "doctor", "dentist", "farmer", "waiter", "mechanic",
      "nurse", "teacher", "pilot", "postman", "baker",
      "vet", "fireman", "policeman", "driver", "cleaner",
      "work", "job", "hospital", "restaurant", "factory",
    ],
  },
  {
    id: "g4-m3",
    grade: 4,
    number: 3,
    title: "Tasty Treats",
    topics: ["Еда на кухне", "Рецепты", "Покупки в магазине"],
    grammar: ["Much / many / a lot of", "A cup of / a glass of"],
    vocabulary: [
      "bread", "butter", "cheese", "honey", "lemonade",
      "cereal", "jam", "biscuit", "sweet", "chocolate",
      "sugar", "salt", "pepper", "oil", "flour",
      "egg", "lemon", "strawberry", "grape", "melon",
    ],
  },
  {
    id: "g4-m4",
    grade: 4,
    number: 4,
    title: "At the Zoo",
    topics: ["Животные в зоопарке", "Характер", "Среда обитания"],
    grammar: ["Present Continuous", "Сравнение Present Simple и Continuous"],
    vocabulary: [
      "lion", "elephant", "giraffe", "peacock", "seal",
      "tiger", "monkey", "bear", "kangaroo", "zebra",
      "panda", "crocodile", "snake", "parrot", "eagle",
      "wing", "paw", "tail", "fur", "feather",
    ],
  },

  // === Grade 5 ===
  {
    id: "g5-m1",
    grade: 5,
    number: 1,
    title: "School Days",
    topics: ["Школа", "Расписание", "Школьная жизнь"],
    grammar: ["Present Simple", "Глаголы состояния"],
    vocabulary: [
      "timetable", "schoolbag", "pupil", "headmaster", "subject",
      "term", "break", "library", "gym", "canteen",
      "uniform", "lesson", "homework", "exam", "mark",
      "classroom", "blackboard", "chalk", "desk", "locker",
    ],
  },
  {
    id: "g5-m2",
    grade: 5,
    number: 2,
    title: "That's Me!",
    topics: ["Личная информация", "Страны", "Национальности"],
    grammar: ["Have got / has got", "Possessive case ('s, of)"],
    vocabulary: [
      "Russia", "Britain", "Spain", "passport", "nationality",
      "France", "Germany", "Italy", "USA", "Canada",
      "British", "French", "German", "Italian", "language",
      "country", "capital", "flag", "citizen",
    ],
  },
  {
    id: "g5-m3",
    grade: 5,
    number: 3,
    title: "My Home, My Castle",
    topics: ["Дом", "Мебель", "Бытовая техника"],
    grammar: ["There is / there are", "Предлоги места"],
    vocabulary: [
      "armchair", "carpet", "fridge", "mirror", "wardrobe",
      "sofa", "cushion", "bookcase", "desk", "lamp",
      "curtains", "painting", "vase", "bath", "shower",
      "sink", "oven", "cooker", "dishwasher", "washing machine",
    ],
  },
  {
    id: "g5-m4",
    grade: 5,
    number: 4,
    title: "Family Ties",
    topics: ["Семья", "Описание людей", "Отношения"],
    grammar: ["Object pronouns", "Can / can't"],
    vocabulary: [
      "brave", "clever", "kind", "noisy", "patient",
      "lazy", "helpful", "polite", "rude", "honest",
      "twin", "only child", "niece", "nephew", "stepfather",
      "stepmother", "grandparent", "relative", "cousin", "family tree",
    ],
  },

  // === Grade 6 ===
  {
    id: "g6-m1",
    grade: 6,
    number: 1,
    title: "Who's Who?",
    topics: ["Знакомства", "Документы", "Контактные данные"],
    grammar: ["Have got / Has got", "Question words"],
    vocabulary: [
      "ID card", "nickname", "address", "postcode", "signature",
      "age", "birthday", "hobby", "contact", "email",
      "phone number", "full name", "surname", "first name", "middle name",
      "country", "city", "street", "house", "flat",
    ],
  },
  {
    id: "g6-m2",
    grade: 6,
    number: 2,
    title: "Here We Are",
    topics: ["Время", "Месяцы и даты", "Праздники"],
    grammar: ["Предлоги времени (at/in/on)", "Ordinal numbers"],
    vocabulary: [
      "calendar", "celebration", "month", "season", "festival",
      "weekday", "weekend", "holiday", "anniversary", "ceremony",
      "January", "February", "March", "July", "autumn",
      "summer", "winter", "spring", "century", "decade",
    ],
  },
  {
    id: "g6-m3",
    grade: 6,
    number: 3,
    title: "Getting Around",
    topics: ["Транспорт", "Дорожные знаки", "Путешествия"],
    grammar: ["Imperative", "Can / must"],
    vocabulary: [
      "bicycle", "underground", "helicopter", "tram", "motorbike",
      "bus", "car", "train", "plane", "ferry",
      "taxi", "ship", "boat", "lorry", "van",
      "station", "airport", "port", "road", "traffic light",
    ],
  },
  {
    id: "g6-m4",
    grade: 6,
    number: 4,
    title: "Day After Day",
    topics: ["Распорядок дня", "Свободное время", "Привычки"],
    grammar: ["Present Simple", "Наречия частотности"],
    vocabulary: [
      "routine", "spare time", "hobby", "weekend", "habit",
      "alarm clock", "breakfast", "lunch", "dinner", "bath",
      "brush", "dress", "sleep", "wake up", "get up",
      "go to bed", "daily", "often", "sometimes",
    ],
  },

  // === Grade 7 ===
  {
    id: "g7-m1",
    grade: 7,
    number: 1,
    title: "Lifestyles",
    topics: ["Город и деревня", "Образ жизни", "Окружение"],
    grammar: ["Present Simple vs Present Continuous"],
    vocabulary: [
      "countryside", "suburbs", "skyscraper", "cottage", "flat",
      "neighborhood", "downtown", "village", "town", "city",
      "urban", "rural", "busy", "quiet", "peaceful",
      "crowded", "polluted", "traffic", "building", "neighbour",
    ],
  },
  {
    id: "g7-m2",
    grade: 7,
    number: 2,
    title: "Tale Time",
    topics: ["Литература", "Истории", "Жанры"],
    grammar: ["Past Simple (правильные/неправильные глаголы)"],
    vocabulary: [
      "character", "plot", "hero", "villain", "adventure",
      "fairy tale", "novel", "poem", "legend", "myth",
      "fiction", "non-fiction", "narrator", "dialogue", "scene",
      "chapter", "page", "library", "author", "title",
    ],
  },
  {
    id: "g7-m3",
    grade: 7,
    number: 3,
    title: "Profiles",
    topics: ["Черты характера", "Знаменитости", "Биографии"],
    grammar: ["Относительные местоимения (who, which, that)"],
    vocabulary: [
      "ambitious", "creative", "patient", "loyal", "generous",
      "hard-working", "talented", "gifted", "confident", "modest",
      "humble", "optimistic", "pessimistic", "energetic", "lazy",
      "reliable", "stubborn", "strict", "friendly", "sensitive",
    ],
  },
  {
    id: "g7-m4",
    grade: 7,
    number: 4,
    title: "In the News",
    topics: ["СМИ", "Новости", "Журналистика"],
    grammar: ["Past Continuous", "Past Simple vs Past Continuous"],
    vocabulary: [
      "headline", "broadcast", "journalist", "report", "article",
      "news", "weather", "interview", "magazine", "newspaper",
      "channel", "anchor", "microphone", "camera", "studio",
      "breaking news", "gossip", "scandal", "story", "source",
    ],
  },

  // === Grade 8 ===
  {
    id: "g8-m1",
    grade: 8,
    number: 1,
    title: "Socialising",
    topics: ["Общение", "Первое впечатление", "Этикет"],
    grammar: ["Present Simple / Continuous / Perfect"],
    vocabulary: [
      "polite", "rude", "sociable", "outgoing", "introvert",
      "extrovert", "friendly", "unfriendly", "formal", "informal",
      "manners", "etiquette", "greeting", "smile", "handshake",
      "gesture", "body language", "conversation", "small talk", "communication",
    ],
  },
  {
    id: "g8-m2",
    grade: 8,
    number: 2,
    title: "Food & Shopping",
    topics: ["Магазины", "Деньги", "Покупки"],
    grammar: ["Past Simple / Present Perfect"],
    vocabulary: [
      "receipt", "discount", "refund", "grocery", "boutique",
      "supermarket", "mall", "market", "cashier", "shop assistant",
      "customer", "brand", "label", "price", "sale",
      "bargain", "queue", "basket", "trolley", "change",
    ],
  },
  {
    id: "g8-m3",
    grade: 8,
    number: 3,
    title: "Great Minds",
    topics: ["Знаменитые учёные", "Изобретения", "Открытия"],
    grammar: ["Past Perfect", "Used to / would"],
    vocabulary: [
      "invention", "discover", "genius", "breakthrough", "experiment",
      "scientist", "inventor", "philosopher", "mathematician", "physicist",
      "chemist", "theory", "formula", "laboratory", "microscope",
      "telescope", "technology", "research", "knowledge", "evidence",
    ],
  },
  {
    id: "g8-m4",
    grade: 8,
    number: 4,
    title: "Be Yourself",
    topics: ["Внешность и стиль", "Мода", "Одежда"],
    grammar: ["Модальные глаголы: must / can't / may"],
    vocabulary: [
      "outfit", "trendy", "baggy", "tight", "formal",
      "casual", "elegant", "stylish", "fashionable", "jeans",
      "jacket", "scarf", "gloves", "boots", "sneakers",
      "dress", "suit", "shirt", "t-shirt", "design",
    ],
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
