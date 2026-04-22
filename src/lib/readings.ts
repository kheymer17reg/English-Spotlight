import type { ReadingText } from "@/types";

export const READINGS: ReadingText[] = [
  {
    id: "r-g3-school",
    grade: 3,
    title: "Lisa's School Day",
    level: "A1",
    text: `Lisa is eight years old. She lives in London. Every morning, she wakes up at seven o'clock.
She has cereal and milk for breakfast. Then she goes to school by bus with her best friend Tom.
Lisa's favourite subject is Art. She likes drawing cats and flowers. Today, Lisa is painting a big red bus!`,
    glossary: [
      { word: "wake up", translation: "просыпаться" },
      { word: "cereal", translation: "хлопья" },
      { word: "paint", translation: "рисовать красками" },
      { word: "subject", translation: "предмет" },
    ],
    questions: [
      { q: "How old is Lisa?", a: "She is eight years old." },
      { q: "What is Lisa's favourite subject?", a: "Art." },
      { q: "What is she painting today?", a: "A big red bus." },
    ],
  },
  {
    id: "r-g5-home",
    grade: 5,
    title: "My Dream House",
    level: "A2",
    text: `I live with my family in a cosy flat in Moscow. My dream house, however, is a cottage in the countryside.
It has two floors, a garden with apple trees and a cat named Whiskers. Downstairs, there is a big kitchen and a sunny dining room.
Upstairs, I have my own bedroom with a telescope by the window. At night, I watch the stars and dream about traveling.`,
    glossary: [
      { word: "cosy", translation: "уютный" },
      { word: "countryside", translation: "сельская местность" },
      { word: "telescope", translation: "телескоп" },
      { word: "downstairs", translation: "внизу (этажом ниже)" },
    ],
    questions: [
      { q: "Where does the author live now?", a: "In a flat in Moscow." },
      { q: "What is in the garden?", a: "Apple trees and a cat named Whiskers." },
      { q: "What does the author watch at night?", a: "The stars." },
    ],
  },
  {
    id: "r-g7-adventure",
    grade: 7,
    title: "The Secret of Raven's Peak",
    level: "B1",
    text: `When Oliver opened the dusty envelope, a faded map fell onto his desk. The map showed an old trail leading to Raven's Peak — a lonely mountain nobody had climbed for decades.
Oliver showed the map to his sister Nina. "We should go," she whispered. "Before anyone else finds it."
Two weeks later, they stood at the foot of the mountain. The air was cold, the sky was grey, and a single raven circled above them.
"Whatever happens," Oliver said, "we stick together."
They took a deep breath — and began to climb.`,
    glossary: [
      { word: "dusty", translation: "пыльный" },
      { word: "faded", translation: "выцветший" },
      { word: "trail", translation: "тропа" },
      { word: "stick together", translation: "держаться вместе" },
    ],
    questions: [
      { q: "What fell out of the envelope?", a: "A faded map." },
      { q: "Who did Oliver show the map to?", a: "His sister Nina." },
      { q: "What does Oliver say before they start climbing?", a: "That they stick together." },
    ],
  },
  {
    id: "r-g8-invention",
    grade: 8,
    title: "The Girl Who Invented a Lunchbox",
    level: "B1",
    text: `Most inventions begin with a small problem. For 14-year-old Anya from St Petersburg, the problem was simple: by lunchtime at school, her sandwich was always cold.
So she built a solar-powered lunchbox. Using a second-hand thermal bag, a solar panel from an old garden lamp, and a tiny heater, she kept her food warm until 1 p.m.
Her teacher was impressed. "This is real engineering," he said. A month later, Anya presented her project at the city science fair and won first prize.
"Great ideas," she told the judges, "don't need a lot of money. They just need curiosity."`,
    glossary: [
      { word: "solar-powered", translation: "на солнечных батареях" },
      { word: "second-hand", translation: "подержанный" },
      { word: "thermal", translation: "термо-" },
      { word: "curiosity", translation: "любопытство" },
    ],
    questions: [
      { q: "What problem did Anya want to solve?", a: "Her sandwich was cold by lunchtime." },
      { q: "What three parts did she use?", a: "A thermal bag, a solar panel, a tiny heater." },
      { q: "What did she say great ideas need?", a: "Curiosity." },
    ],
  },
];

export function readingsByGrade(grade: number): ReadingText[] {
  return READINGS.filter((r) => r.grade === grade);
}
