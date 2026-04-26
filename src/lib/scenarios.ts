import type { Grade } from "@/types";

export interface RoleplayScenario {
  id: string;
  grade: Grade;
  moduleNumber: number;
  title: string;
  description: string;
  studentRole: string;
  aiRole: string;
  firstTurn: string;
  icon: string; // lucide name
}

// 4-5 scenarios per grade — varied roles so a class can pick the freshest one.
export const SCENARIOS: RoleplayScenario[] = [
  // Grade 2
  { id: "s-g2-family", grade: 2, moduleNumber: 1, title: "Meet my family", description: "Покажи AI свою семью на фото.", studentRole: "a child showing a family photo", aiRole: "a friendly foreign kid", firstTurn: "Hi! Wow, who is that in the picture?", icon: "Users" },
  { id: "s-g2-birthday", grade: 2, moduleNumber: 2, title: "My birthday party", description: "Пригласи друга на день рождения.", studentRole: "a child inviting a friend to a birthday", aiRole: "a friend who wants to come", firstTurn: "Hi! Are you having a birthday party?", icon: "Cake" },
  { id: "s-g2-pet", grade: 2, moduleNumber: 3, title: "Show me your pet", description: "Расскажи другу о своём питомце.", studentRole: "a child with a pet", aiRole: "a curious classmate", firstTurn: "Wow, you have a pet! What is it?", icon: "PawPrint" },
  { id: "s-g2-toys", grade: 2, moduleNumber: 4, title: "Toy swap", description: "Обменяйся игрушками с другом.", studentRole: "a child with many toys", aiRole: "a friend who wants to swap", firstTurn: "Hi! Can I see your toys? I want to swap something.", icon: "Gamepad2" },

  // Grade 3
  { id: "s-g3-school", grade: 3, moduleNumber: 1, title: "First day at school", description: "Познакомься с новым одноклассником.", studentRole: "a student on the first day", aiRole: "a new classmate", firstTurn: "Hi! I'm new here. What's your name?", icon: "School" },
  { id: "s-g3-family", grade: 3, moduleNumber: 2, title: "Family photo", description: "Расскажи о своей семье.", studentRole: "a student showing a family photo", aiRole: "a curious classmate", firstTurn: "Cool picture! Is this your family?", icon: "Users" },
  { id: "s-g3-lunch", grade: 3, moduleNumber: 3, title: "Lunch in the canteen", description: "Расскажи, что любишь на обед.", studentRole: "a student in the school canteen", aiRole: "a hungry friend", firstTurn: "Yum! What's that on your plate?", icon: "UtensilsCrossed" },
  { id: "s-g3-playdate", grade: 3, moduleNumber: 4, title: "Come over and play", description: "Пригласи друга поиграть после школы.", studentRole: "a host inviting a friend over", aiRole: "a friend deciding what to play", firstTurn: "Cool, I can come! What can we play?", icon: "Home" },

  // Grade 4
  { id: "s-g4-friends", grade: 4, moduleNumber: 1, title: "Describe a friend", description: "Опиши лучшего друга по фото.", studentRole: "a student showing a friend's photo", aiRole: "a curious classmate", firstTurn: "Wow, who is that? Can you describe him?", icon: "UserRound" },
  { id: "s-g4-food", grade: 4, moduleNumber: 2, title: "At the cafe", description: "Закажи любимое блюдо в кафе.", studentRole: "a customer at a cafe", aiRole: "a waiter taking the order", firstTurn: "Hello! Welcome to our cafe. What can I get you today?", icon: "UtensilsCrossed" },
  { id: "s-g4-bake", grade: 4, moduleNumber: 3, title: "Bake a cake together", description: "Готовьте пирог по рецепту.", studentRole: "a child following a recipe", aiRole: "a sibling helping in the kitchen", firstTurn: "Okay, what do we need first for the cake?", icon: "Cake" },
  { id: "s-g4-animals", grade: 4, moduleNumber: 4, title: "At the zoo", description: "Обсуди животных в зоопарке с другом.", studentRole: "a student visiting the zoo", aiRole: "a friend at the zoo", firstTurn: "Look at the lion! Is it your favourite animal?", icon: "PawPrint" },

  // Grade 5
  { id: "s-g5-school", grade: 5, moduleNumber: 1, title: "Timetable talk", description: "Обсуди своё расписание с другом.", studentRole: "a student", aiRole: "a British pen-friend", firstTurn: "Hi! What subjects do you have today?", icon: "Calendar" },
  { id: "s-g5-home", grade: 5, moduleNumber: 2, title: "Show me your room", description: "Покажи новому другу свою комнату.", studentRole: "a host showing a room", aiRole: "a guest asking about the house", firstTurn: "Hi! Your home is so nice. Where is your bedroom?", icon: "Home" },
  { id: "s-g5-country", grade: 5, moduleNumber: 2, title: "Penpal letter", description: "Расскажи о своей стране пенпалу.", studentRole: "a student writing back", aiRole: "a penpal from another country", firstTurn: "Hi! I want to know — what's your country like?", icon: "Mail" },
  { id: "s-g5-family", grade: 5, moduleNumber: 4, title: "Family tree", description: "Расскажи о своей большой семье.", studentRole: "a student showing a family tree", aiRole: "a curious cousin", firstTurn: "Cool, who is on this branch of the tree?", icon: "TreeDeciduous" },

  // Grade 6
  { id: "s-g6-id", grade: 6, moduleNumber: 1, title: "Sign-up form", description: "Помоги другу заполнить анкету для клуба.", studentRole: "a student helping with a form", aiRole: "a friend filling in personal info", firstTurn: "Hi! Can you help me fill in this form? What goes here first?", icon: "ClipboardList" },
  { id: "s-g6-city", grade: 6, moduleNumber: 1, title: "Directions please", description: "Объясни прохожему дорогу.", studentRole: "a local resident", aiRole: "a tourist asking for directions", firstTurn: "Excuse me, how do I get to the nearest museum?", icon: "MapPin" },
  { id: "s-g6-shopping", grade: 6, moduleNumber: 2, title: "At the clothes shop", description: "Купи одежду в магазине.", studentRole: "a shop customer", aiRole: "a shop assistant", firstTurn: "Hello! Can I help you find something?", icon: "ShoppingBag" },
  { id: "s-g6-trip", grade: 6, moduleNumber: 3, title: "Buy a train ticket", description: "Купи билет на поезд в Британии.", studentRole: "a traveller", aiRole: "a station ticket seller", firstTurn: "Good afternoon, where are you travelling to today?", icon: "Train" },
  { id: "s-g6-routine", grade: 6, moduleNumber: 4, title: "Compare routines", description: "Сравни свой день с другом.", studentRole: "a student", aiRole: "a friend with a different routine", firstTurn: "What time do you usually wake up?", icon: "Clock" },

  // Grade 7
  { id: "s-g7-lifestyle", grade: 7, moduleNumber: 1, title: "City vs countryside", description: "Поспорь о городе и деревне.", studentRole: "a city teen", aiRole: "a countryside teen", firstTurn: "Honestly, isn't living in a small village boring?", icon: "Trees" },
  { id: "s-g7-hobby", grade: 7, moduleNumber: 1, title: "Talk about your hobby", description: "Расскажи о хобби новому другу.", studentRole: "a student", aiRole: "a pen-friend from London", firstTurn: "Hi! I've heard you have an interesting hobby. What is it?", icon: "Palette" },
  { id: "s-g7-story", grade: 7, moduleNumber: 2, title: "Recommend a book", description: "Расскажи другу о любимой книге.", studentRole: "a student who just finished a book", aiRole: "a friend looking for a recommendation", firstTurn: "I need a new book to read. What do you recommend?", icon: "BookOpen" },
  { id: "s-g7-weekend", grade: 7, moduleNumber: 3, title: "Plan a weekend", description: "Договоритесь, куда пойти в выходные.", studentRole: "a friend", aiRole: "another friend", firstTurn: "Hey! What do you want to do this weekend?", icon: "CalendarDays" },
  { id: "s-g7-news", grade: 7, moduleNumber: 4, title: "School newspaper interview", description: "Возьми интервью для школьной газеты.", studentRole: "a student journalist", aiRole: "an interesting classmate", firstTurn: "Hi, can I ask you a few questions for the school newspaper?", icon: "Newspaper" },

  // Grade 8
  { id: "s-g8-meet", grade: 8, moduleNumber: 1, title: "First impressions", description: "Познакомьтесь на международном лагере.", studentRole: "a student at an international camp", aiRole: "a new camp friend", firstTurn: "Hi! I don't think we've met. Where are you from?", icon: "Sparkles" },
  { id: "s-g8-trip", grade: 8, moduleNumber: 2, title: "Travel story", description: "Расскажи о поездке, которая тебе понравилась.", studentRole: "a student who just returned from a trip", aiRole: "a curious classmate", firstTurn: "Hi! I heard you were away. Where did you go?", icon: "Plane" },
  { id: "s-g8-shop", grade: 8, moduleNumber: 2, title: "Refund at the store", description: "Верни покупку в магазине.", studentRole: "a customer asking for a refund", aiRole: "a shop assistant", firstTurn: "Hello, how can I help you today?", icon: "RotateCcw" },
  { id: "s-g8-invent", grade: 8, moduleNumber: 3, title: "My invention", description: "Презентуй своё изобретение.", studentRole: "a young inventor", aiRole: "a curious investor", firstTurn: "So, tell me about this invention of yours. What does it do?", icon: "Lightbulb" },
  { id: "s-g8-interview", grade: 8, moduleNumber: 4, title: "Interview for a school club", description: "Пройди собеседование в школьный клуб.", studentRole: "a candidate for the school drama club", aiRole: "the club president", firstTurn: "Hi! Thanks for coming. Why do you want to join our club?", icon: "Mic2" },
];

export function scenariosByGrade(grade: Grade): RoleplayScenario[] {
  return SCENARIOS.filter((s) => s.grade === grade);
}
