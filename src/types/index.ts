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
  moduleNumber: number;
  moduleTitle: string;
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
  /**
   * Accepted shapes:
   * - `string`         — single correct answer (e.g. fill_blank, true_false)
   * - `string[]`       — multiple equally-correct answers
   * - `[string, string][]` — pairs `[english, russian]` for `match_pairs`
   */
  answer: string | string[] | string[][];
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

// ───── Student activity / motivation (Wave 5) ─────
export type ActivityType =
  | "vocab_review"
  | "exercise"
  | "homework"
  | "pronunciation"
  | "roleplay"
  | "reading"
  | "listening"
  | "game"
  | "chat"
  | "story"
  | "mistake_review";

export interface ActivityRecord {
  id: number;
  studentId: string;
  activityType: ActivityType;
  xp: number;
  correct: number | null;
  total: number | null;
  skill: "grammar" | "vocabulary" | "reading" | "listening" | "speaking" | null;
  moduleNumber: number | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export type MistakeKind = "vocab" | "grammar" | "listening" | "translation" | "reading";
export type MistakeSource = "exercise" | "vocab_drill" | "homework" | "test" | "dialogue";
export type MistakeStatus = "active" | "mastered";

export interface MistakeRecord {
  id: number;
  studentId: string;
  kind: MistakeKind;
  source: MistakeSource;
  question: string;
  correctAnswer: string;
  studentAnswer: string | null;
  wordId: string | null;
  moduleNumber: number | null;
  grade: Grade;
  status: MistakeStatus;
  nextDue: string | null;
  timesSeen: number;
  timesCorrect: number;
  createdAt: string;
  updatedAt: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: "flame" | "star" | "trophy" | "medal" | "crown" | "award" | "sparkles" | "target" | "zap" | "rocket";
}

export interface UnlockedBadge extends BadgeDefinition {
  unlockedAt: string;
}

export interface StudentProgressReport {
  student: {
    id: string;
    name: string;
    grade: Grade;
    xp: number;
    level: number;
    streak: number;
    xpThisWeek: number;
  };
  skills: { skill: string; accuracy: number; attempts: number }[];
  recent: ActivityRecord[];
  badges: { unlocked: UnlockedBadge[]; locked: BadgeDefinition[] };
  mistakes: { active: number; mastered: number; dueNow: number };
  weeklyXp: { day: string; xp: number }[]; // last 7 days
}

export interface LeagueEntry {
  rank: number;
  studentId: string;
  name: string;
  xpThisWeek: number;
  level: number;
  badgesCount: number;
  isMe: boolean;
}

export interface LeagueResponse {
  scope: "class" | "school";
  groupId: string | null;
  groupName: string | null;
  weekStart: string;
  weekEnd: string;
  top: LeagueEntry[];
  me: LeagueEntry | null;
}
