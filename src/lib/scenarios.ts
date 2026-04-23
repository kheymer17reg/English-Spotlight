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

// Keep to ~2 scenarios per grade so the picker is easy to scan.
export const SCENARIOS: RoleplayScenario[] = [
  // Grade 2
  { id: "s-g2-family", grade: 2, moduleNumber: 1, title: "Meet my family", description: "Покажи AI свою семью на фото.", studentRole: "a child showing a family photo", aiRole: "a friendly foreign kid", firstTurn: "Hi! Wow, who is that in the picture?", icon: "Users" },
  { id: "s-g2-birthday", grade: 2, moduleNumber: 2, title: "My birthday party", description: "Пригласи друга на день рождения.", studentRole: "a child inviting a friend to a birthday", aiRole: "a friend who wants to come", firstTurn: "Hi! Are you having a birthday party?", icon: "Cake" },
  // Grade 3
  { id: "s-g3-school", grade: 3, moduleNumber: 1, title: "First day at school", description: "Познакомься с новым одноклассником.", studentRole: "a student on the first day", aiRole: "a new classmate", firstTurn: "Hi! I'm new here. What's your name?", icon: "School" },
  { id: "s-g3-family", grade: 3, moduleNumber: 2, title: "Family photo", description: "Расскажи о своей семье.", studentRole: "a student showing a family photo", aiRole: "a curious classmate", firstTurn: "Cool picture! Is this your family?", icon: "Users" },
  // Grade 4
  { id: "s-g4-food", grade: 4, moduleNumber: 2, title: "At the cafe", description: "Закажи любимое блюдо в кафе.", studentRole: "a customer at a cafe", aiRole: "a waiter taking the order", firstTurn: "Hello! Welcome to our cafe. What can I get you today?", icon: "UtensilsCrossed" },
  { id: "s-g4-animals", grade: 4, moduleNumber: 4, title: "At the zoo", description: "Обсуди животных в зоопарке с другом.", studentRole: "a student visiting the zoo", aiRole: "a friend at the zoo", firstTurn: "Look at the lion! Is it your favourite animal?", icon: "PawPrint" },
  // Grade 5
  { id: "s-g5-school", grade: 5, moduleNumber: 1, title: "Timetable talk", description: "Обсуди своё расписание с другом.", studentRole: "a student", aiRole: "a British pen-friend", firstTurn: "Hi! What subjects do you have today?", icon: "Calendar" },
  { id: "s-g5-home", grade: 5, moduleNumber: 2, title: "Show me your room", description: "Покажи новому другу свою комнату.", studentRole: "a host showing a room", aiRole: "a guest asking about the house", firstTurn: "Hi! Your home is so nice. Where is your bedroom?", icon: "Home" },
  // Grade 6
  { id: "s-g6-city", grade: 6, moduleNumber: 1, title: "Directions please", description: "Объясни прохожему дорогу.", studentRole: "a local resident", aiRole: "a tourist asking for directions", firstTurn: "Excuse me, how do I get to the nearest museum?", icon: "MapPin" },
  { id: "s-g6-shopping", grade: 6, moduleNumber: 2, title: "At the clothes shop", description: "Купи одежду в магазине.", studentRole: "a shop customer", aiRole: "a shop assistant", firstTurn: "Hello! Can I help you find something?", icon: "ShoppingBag" },
  // Grade 7
  { id: "s-g7-hobby", grade: 7, moduleNumber: 1, title: "Talk about your hobby", description: "Расскажи о хобби новому другу.", studentRole: "a student", aiRole: "a pen-friend from London", firstTurn: "Hi! I've heard you have an interesting hobby. What is it?", icon: "Palette" },
  { id: "s-g7-weekend", grade: 7, moduleNumber: 3, title: "Plan a weekend", description: "Договоритесь, куда пойти в выходные.", studentRole: "a friend", aiRole: "another friend", firstTurn: "Hey! What do you want to do this weekend?", icon: "CalendarDays" },
  // Grade 8
  { id: "s-g8-trip", grade: 8, moduleNumber: 2, title: "Travel story", description: "Расскажи о поездке, которая тебе понравилась.", studentRole: "a student who just returned from a trip", aiRole: "a curious classmate", firstTurn: "Hi! I heard you were away. Where did you go?", icon: "Plane" },
  { id: "s-g8-interview", grade: 8, moduleNumber: 4, title: "Interview for a school club", description: "Пройди собеседование в школьный клуб.", studentRole: "a candidate for the school drama club", aiRole: "the club president", firstTurn: "Hi! Thanks for coming. Why do you want to join our club?", icon: "Mic2" },
];

export function scenariosByGrade(grade: Grade): RoleplayScenario[] {
  return SCENARIOS.filter((s) => s.grade === grade);
}
