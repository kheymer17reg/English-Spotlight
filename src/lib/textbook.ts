/**
 * Maps our internal curriculum modules to actual page ranges in the official
 * Spotlight student book and workbook PDFs.
 *
 * The PDFs themselves are *not* committed to the repo — see
 * `public/textbooks/README.md`. A teacher drops their legitimate copy under
 * `public/textbooks/grade-N/` with the canonical filename, and the UI exposes
 * "Open student book p. 24" / "Open workbook p. 14" buttons that link to the
 * file with a `#page=N` fragment so browsers' built-in PDF viewer jumps
 * straight to the right spread.
 *
 * Page numbers below are the *PDF page numbers* (1-based across the whole
 * file, including covers and table of contents) so that `#page=N` lands
 * correctly. They are not the printed page numbers.
 */
import type { Grade } from "@/types";

export interface TextbookFile {
  /** Public URL — relative to site root. */
  url: string;
  /** Display label used by the UI. */
  label: string;
  /** Short tag for badges/buttons. */
  short: string;
}

export interface ModuleTextbookRefs {
  /** Curriculum module id, e.g. "g2-m1". */
  moduleId: string;
  /** Page range inside the student book (1-based PDF page numbers). */
  studentBook?: { from: number; to: number; book?: "part1" | "part2" };
  /** Page range inside the workbook. */
  workbook?: { from: number; to: number };
  /** Optional: a hand-curated list of key exercises in the workbook the
   *  teacher can highlight. Page numbers are PDF pages. */
  workbookExercises?: { page: number; exercise: string; topic: string }[];
}

export interface GradeTextbook {
  grade: Grade;
  files: {
    studentBookPart1?: TextbookFile;
    studentBookPart2?: TextbookFile;
    workbook?: TextbookFile;
    teacherBook?: TextbookFile;
  };
  modules: ModuleTextbookRefs[];
}

/**
 * Spotlight 2 (2-й класс).
 *
 * Standard module structure of the «Английский в фокусе. 2 класс»
 * («Просвещение» / Express Publishing):
 *
 *   • My Letters! — letter introduction (pre-module)
 *   • Big and Small + Numbers — phonics + counting (pre-module)
 *   • Starter: Hello! / My Family! — greeting & family (pre-module)
 *   • Module 1: My Home!
 *   • Module 2: My Birthday!
 *   • Module 3: My Animals!  (last module of Part 1)
 *   • Module 4: My Toys!     (Part 2)
 *   • Module 5: My Holidays! (Part 2)
 *
 * Part 1 of the student book stops mid-Module 3 (~p.73). The page numbers
 * below are conservative ranges — they cover the whole module section
 * including "Fun at School", "Arthur and Rascal", "Now I know" reviews.
 */
export const GRADE_2: GradeTextbook = {
  grade: 2,
  files: {
    studentBookPart1: {
      url: "/textbooks/grade-2/spotlight-2-student-book-part-1.pdf",
      label: "Spotlight 2 · Student's Book, часть 1",
      short: "Учебник, ч. 1",
    },
    studentBookPart2: {
      url: "/textbooks/grade-2/spotlight-2-student-book-part-2.pdf",
      label: "Spotlight 2 · Student's Book, часть 2",
      short: "Учебник, ч. 2",
    },
    workbook: {
      url: "/textbooks/grade-2/spotlight-2-workbook.pdf",
      label: "Spotlight 2 · Workbook",
      short: "Тетрадь",
    },
    teacherBook: {
      url: "/textbooks/grade-2/spotlight-2-teacher-book.pdf",
      label: "Spotlight 2 · Teacher's Book",
      short: "Книга учителя",
    },
  },
  modules: [
    {
      moduleId: "g2-m1",
      studentBook: { from: 26, to: 43, book: "part1" },
      workbook: { from: 14, to: 23 },
      workbookExercises: [
        { page: 14, exercise: "1", topic: "My Family — vocabulary" },
        { page: 16, exercise: "1", topic: "He / She is" },
        { page: 18, exercise: "1", topic: "Rooms in the house" },
        { page: 20, exercise: "1", topic: "Where's …? — Yes/No answers" },
        { page: 22, exercise: "1", topic: "Now I know — review" },
      ],
    },
    {
      moduleId: "g2-m2",
      studentBook: { from: 44, to: 61, book: "part1" },
      workbook: { from: 24, to: 33 },
      workbookExercises: [
        { page: 24, exercise: "1", topic: "Numbers 1-10" },
        { page: 26, exercise: "1", topic: "How old are you?" },
        { page: 28, exercise: "1", topic: "Food I like — vocabulary" },
        { page: 30, exercise: "1", topic: "I like / don't like" },
        { page: 32, exercise: "1", topic: "Now I know — review" },
      ],
    },
    {
      moduleId: "g2-m3",
      studentBook: { from: 62, to: 73, book: "part1" },
      workbook: { from: 34, to: 43 },
      workbookExercises: [
        { page: 34, exercise: "1", topic: "Animals — vocabulary" },
        { page: 36, exercise: "1", topic: "Can / can't" },
        { page: 38, exercise: "1", topic: "Action verbs" },
        { page: 40, exercise: "1", topic: "I can / It can" },
        { page: 42, exercise: "1", topic: "Now I know — review" },
      ],
    },
    {
      moduleId: "g2-m4",
      // Module 4 is in Part 2 of the SB; if you only have Part 1 the SB link
      // will be hidden in the UI.
      studentBook: { from: 18, to: 35, book: "part2" },
      workbook: { from: 44, to: 53 },
      workbookExercises: [
        { page: 44, exercise: "1", topic: "Toys — vocabulary" },
        { page: 46, exercise: "1", topic: "Prepositions: in / on / under" },
        { page: 48, exercise: "1", topic: "Has got / hasn't got" },
        { page: 50, exercise: "1", topic: "Colours" },
        { page: 52, exercise: "1", topic: "Now I know — review" },
      ],
    },
    {
      moduleId: "g2-m5",
      studentBook: { from: 36, to: 53, book: "part2" },
      workbook: { from: 54, to: 64 },
      workbookExercises: [
        { page: 54, exercise: "1", topic: "Seasons & weather — vocabulary" },
        { page: 56, exercise: "1", topic: "It is sunny / It's raining" },
        { page: 58, exercise: "1", topic: "Clothes for weather" },
        { page: 60, exercise: "1", topic: "Holidays — vocabulary" },
        { page: 62, exercise: "1", topic: "Now I know — review" },
      ],
    },
  ],
};

const GRADES_INDEX: Partial<Record<Grade, GradeTextbook>> = {
  2: GRADE_2,
};

export function textbookForGrade(grade: Grade): GradeTextbook | null {
  return GRADES_INDEX[grade] ?? null;
}

export function moduleRefs(grade: Grade, moduleNumber: number): ModuleTextbookRefs | null {
  const grade_ = textbookForGrade(grade);
  if (!grade_) return null;
  const id = `g${grade}-m${moduleNumber}`;
  return grade_.modules.find((m) => m.moduleId === id) ?? null;
}

/**
 * Build a `<a href>` deep link that opens the PDF at a specific page in the
 * browser's built-in viewer. Falls back to `null` if the file is missing.
 */
export function pdfDeepLink(file: TextbookFile | undefined, page?: number): string | null {
  if (!file) return null;
  if (typeof page !== "number" || page < 1) return file.url;
  return `${file.url}#page=${page}`;
}
