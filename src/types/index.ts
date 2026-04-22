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
  title: string;
  level: "A1" | "A2" | "B1";
  text: string;
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
