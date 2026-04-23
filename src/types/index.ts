export type Grade = 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Role = "student" | "teacher";

export type ExerciseType =
  | "multiple_choice"
  | "fill_blank"
  | "match_pairs"
  | "open_ended"
  | "true_false";

export type Difficulty = "easy" | "medium" | "hard";

export interface CurriculumModule {
  id: string;
  grade: Grade;
  number: number;
  title: string;
  topics: string[];
  grammar: string[];
  vocabulary: string[];
}

export interface VocabWord {
  id: string;
  grade: Grade;
  word: string;
  translation: string;
  partOfSpeech: string;
  example: string;
  transcription?: string;
}

export interface ReadingText {
  id: string;
  grade: Grade;
  module?: number;
  title: string;
  level: "A1" | "A2" | "B1";
  text: string;
  glossary: { word: string; translation: string }[];
  questions: { q: string; a: string }[];
}

export interface DialogueLine {
  speaker: "A" | "B";
  text: string;
}

export interface Dialogue {
  id: string;
  grade: Grade;
  module: number;
  title: string;
  level: "A1" | "A2" | "B1";
  speakerA: string;
  speakerB: string;
  summary: string;
  lines: DialogueLine[];
  glossary: { word: string; translation: string }[];
  questions: { q: string; a: string }[];
}

export interface ExerciseItem {
  id: string;
  type: ExerciseType;
  prompt: string;
  options?: string[];
  answer: string | string[];
  hint?: string;
  explanation?: string;
}

export interface GeneratedExercise {
  title: string;
  grade: Grade;
  module: number;
  type: ExerciseType;
  difficulty: Difficulty;
  items: ExerciseItem[];
  createdAt: string;
}

export interface GeneratedTest {
  title: string;
  grade: Grade;
  module?: number;
  format: "progress_check" | "module_test" | "oge";
  sections: { heading: string; items: ExerciseItem[] }[];
  totalScore: number;
  createdAt: string;
}

export interface LessonPlan {
  title: string;
  grade: Grade;
  module: number;
  lessonType: string;
  focus: string;
  duration: number;
  objectives: string[];
  stages: { stage: string; minutes: number; activity: string }[];
  materials: string[];
  homework: string;
  createdAt: string;
}

// Methodical lesson plan (ФГОС-compliant, full technological map)
export type LessonKind =
  | "introduction"
  | "vocabulary"
  | "grammar_present"
  | "grammar_practice"
  | "reading_culture"
  | "listening_writing"
  | "revision";

export interface MethodicalStage {
  name: string; // "Организационный момент" / "Актуализация знаний" / ...
  minutes: number;
  teacherScript: string; // what teacher says / does, with English phrases
  studentActivity: string; // what students do
  uud: string[]; // ["Регулятивные: целеполагание", "Коммуникативные: ..."]
}

export interface MethodicalObjectives {
  subject: string[]; // предметные
  metaSubject: string[]; // метапредметные
  personal: string[]; // личностные
}

export interface MethodicalLesson {
  id: string; // l_g{grade}_m{module}_n{number}
  grade: Grade;
  moduleNumber: number;
  moduleTitle: string;
  lessonNumber: number; // 1..7 within module
  kind: LessonKind;
  title: string;
  textbookPages: string; // e.g. "SB pp. 24-25, WB p. 16"
  duration: number; // minutes
  lessonType: string; // "Урок открытия нового знания" etc
  objectives: MethodicalObjectives;
  equipment: string[];
  vocabulary: string[];
  grammar: string[];
  stages: MethodicalStage[];
  reflection: string;
  homework: string;
  handouts: { title: string; content: string }[];
  status: "stub" | "generated" | "edited";
  createdAt: string;
  updatedAt: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  grade: Grade;
  createdAt: string;
  streak: number;
  xp: number;
  level: number;
  currentModule: number;
}

export interface AttemptRecord {
  id: string;
  studentId: string;
  kind: "practice" | "vocab" | "reading" | "test";
  score: number;
  total: number;
  correct: number;
  skill: "grammar" | "vocabulary" | "reading" | "listening";
  module: number;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ts?: string;
}

export interface ProviderInfo {
  name: "anthropic" | "openai" | "groq" | "gemini" | "none";
  model: string;
  configured: boolean;
}
