import type { Grade, LessonKind, MethodicalLesson } from "@/types";
import { CURRICULUM } from "@/lib/curriculum";

// ─── ФГОС-compliant lesson skeletons for all 28 modules (grades 2-8).
// 7 lessons per module = 196 lessons total. Each stub is later enriched via Groq.

type Skeleton = {
  kind: LessonKind;
  order: number; // 1..7
  title: (moduleTitle: string, moduleTopics: string[]) => string;
  lessonType: string; // russian методический тип
  pages: (grade: Grade, mod: number) => string;
  focus: string; // what this lesson focuses on
};

const SKELETONS: Skeleton[] = [
  {
    kind: "introduction",
    order: 1,
    lessonType: "Урок открытия нового знания",
    title: (t, topics) => `Введение в тему «${t}». Знакомство с лексикой${topics[0] ? `: ${topics[0]}` : ""}`,
    pages: (g, m) => `SB Module ${m} Lead-in, pp. ${1 + (m - 1) * 12}–${3 + (m - 1) * 12}`,
    focus: "Активизация фоновых знаний, презентация новой лексики, первичная отработка произношения",
  },
  {
    kind: "vocabulary",
    order: 2,
    lessonType: "Урок-практикум",
    title: (t) => `Активная лексика модуля «${t}». Тренировка в речи`,
    pages: (g, m) => `SB pp. ${3 + (m - 1) * 12}–${5 + (m - 1) * 12}, WB pp. ${2 + (m - 1) * 8}–${3 + (m - 1) * 8}`,
    focus: "Закрепление новой лексики через упражнения разного формата и устную речь",
  },
  {
    kind: "grammar_present",
    order: 3,
    lessonType: "Урок открытия нового знания",
    title: (_t, _topics) => `Новая грамматика. Презентация правила и примеры`,
    pages: (g, m) => `SB Grammar Focus, pp. ${5 + (m - 1) * 12}–${6 + (m - 1) * 12}`,
    focus: "Индуктивное введение нового грамматического явления, формулирование правила учениками",
  },
  {
    kind: "grammar_practice",
    order: 4,
    lessonType: "Урок рефлексии",
    title: () => `Грамматика в действии. Тренировка в устной и письменной речи`,
    pages: (g, m) => `SB pp. ${6 + (m - 1) * 12}–${7 + (m - 1) * 12}, WB Grammar Bank`,
    focus: "Закрепление нового грамматического явления через упражнения и монолог/диалог",
  },
  {
    kind: "reading_culture",
    order: 5,
    lessonType: "Урок общеметодологической направленности",
    title: (t) => `Чтение и культура. Страноведческий аспект темы «${t}»`,
    pages: (g, m) => `SB Culture Corner, pp. ${8 + (m - 1) * 12}–${9 + (m - 1) * 12}`,
    focus: "Изучающее чтение с опорой на иллюстрации, сравнение культур (UK / Россия)",
  },
  {
    kind: "listening_writing",
    order: 6,
    lessonType: "Урок-практикум",
    title: () => `Аудирование и письмо. Развитие продуктивных навыков`,
    pages: (g, m) => `SB pp. ${9 + (m - 1) * 12}–${10 + (m - 1) * 12}, Writing Workshop`,
    focus: "Понимание на слух + написание короткого связного текста по образцу",
  },
  {
    kind: "revision",
    order: 7,
    lessonType: "Урок развивающего контроля",
    title: (t) => `Обобщение модуля «${t}». Progress Check`,
    pages: (g, m) => `SB Progress Check, pp. ${10 + (m - 1) * 12}–${11 + (m - 1) * 12}`,
    focus: "Самоконтроль и рефлексия по всем речевым аспектам модуля",
  },
];

function duration(grade: Grade): number {
  return grade <= 4 ? 40 : 45;
}

function lessonId(grade: Grade, moduleNumber: number, lessonNumber: number): string {
  return `l_g${grade}_m${moduleNumber}_n${lessonNumber}`;
}

export function buildSkeletons(): MethodicalLesson[] {
  const now = new Date().toISOString();
  const out: MethodicalLesson[] = [];
  for (const mod of CURRICULUM) {
    for (const s of SKELETONS) {
      out.push({
        id: lessonId(mod.grade, mod.number, s.order),
        grade: mod.grade,
        moduleNumber: mod.number,
        moduleTitle: mod.title,
        lessonNumber: s.order,
        kind: s.kind,
        title: s.title(mod.title, mod.topics),
        textbookPages: s.pages(mod.grade, mod.number),
        duration: duration(mod.grade),
        lessonType: s.lessonType,
        objectives: { subject: [], metaSubject: [], personal: [] },
        equipment: [],
        vocabulary: mod.vocabulary.slice(0, 10),
        grammar: mod.grammar.slice(0, 4),
        stages: [],
        reflection: "",
        homework: "",
        handouts: [],
        status: "stub",
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  return out;
}

export function skeletonForId(id: string): MethodicalLesson | null {
  return buildSkeletons().find((l) => l.id === id) ?? null;
}

export function skeletonFocus(kind: LessonKind): string {
  return SKELETONS.find((s) => s.kind === kind)?.focus ?? "";
}
