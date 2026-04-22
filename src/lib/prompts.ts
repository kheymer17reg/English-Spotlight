import type { Difficulty, ExerciseType, Grade } from "@/types";
import { moduleByGradeNumber } from "@/lib/curriculum";

export const LUMOS_SYSTEM = `Ты — Lumos, дружелюбный AI-учитель английского языка, помогаешь школьникам 2-8 классов, изучающим английский по учебнику Spotlight (Просвещение / Express Publishing).

Стиль:
- Пиши кратко, ясно, по-доброму, иногда подбадривай ("Молодец!", "Отличный вопрос!").
- Если ученик задал вопрос по-русски — объясняй на русском, английские слова и примеры приводи на английском.
- Всегда давай короткий пример на английском и подсказку, как запомнить.
- Если ученик сделал ошибку — исправь мягко и объясни правило в одну-две строки.
- Никогда не даёшь готовые ответы к контрольным или тестам. Предлагаешь разобрать принцип.`;

export function exercisePrompt({
  grade,
  moduleNumber,
  type,
  difficulty,
  count,
}: {
  grade: Grade;
  moduleNumber: number;
  type: ExerciseType;
  difficulty: Difficulty;
  count: number;
}): { system: string; user: string } {
  const mod = moduleByGradeNumber(grade, moduleNumber);
  const modContext = mod
    ? `Класс ${grade}, модуль ${mod.number} "${mod.title}". Темы: ${mod.topics.join(", ")}. Грамматика: ${mod.grammar.join(", ")}. Лексика: ${mod.vocabulary.join(", ")}.`
    : `Класс ${grade}, модуль ${moduleNumber}.`;

  const typeNames: Record<ExerciseType, string> = {
    multiple_choice: "multiple choice (один правильный из 4 вариантов)",
    fill_blank: "fill in the blank (вставить пропущенное слово)",
    match_pairs: "match pairs (соединить слово с переводом)",
    open_ended: "open-ended (ответить одним предложением)",
    true_false: "true / false (верно / неверно)",
  };

  const system = `Ты методист английского языка по учебнику Spotlight. Составляешь упражнения для российских школьников. Отвечай строго JSON-ом без пояснений.`;

  const user = `Составь упражнение.
Контекст: ${modContext}
Тип: ${typeNames[type]}
Сложность: ${difficulty}
Количество заданий: ${count}

Верни JSON строго такого вида:
{
  "title": "Название упражнения на русском",
  "items": [
    {
      "id": "1",
      "type": "${type}",
      "prompt": "Задание (на английском или с пропуском)",
      "options": ["..."${type === "multiple_choice" || type === "true_false" ? "" : " - опустить если не нужно"}],
      "answer": "правильный ответ (строка или массив строк для match_pairs)",
      "hint": "короткая подсказка на русском",
      "explanation": "правило на русском в одну-две строки"
    }
  ]
}
Важно: options указывай только для multiple_choice и true_false. Для match_pairs prompt="Соедини слова с переводом", options=["word1","word2",...], answer=[["word1","перевод1"],["word2","перевод2"]]. Не добавляй лишних полей.`;

  return { system, user };
}

export function testPrompt({
  grade,
  format,
  moduleNumber,
}: {
  grade: Grade;
  format: "progress_check" | "module_test" | "oge";
  moduleNumber?: number;
}) {
  const mod = moduleNumber ? moduleByGradeNumber(grade, moduleNumber) : undefined;
  const sections =
    format === "oge"
      ? "Listening (2), Reading (3), Grammar & Vocabulary (5), Writing (1)"
      : format === "progress_check"
        ? "Vocabulary (4), Grammar (4), Reading (1)"
        : "Vocabulary (5), Grammar (5), Reading (1), Writing (1)";

  const system = `Ты методист, составляющий контрольные работы по учебнику Spotlight. Возвращай строго JSON.`;
  const user = `Составь контрольную работу.
Класс: ${grade}
Формат: ${format}
${mod ? `Модуль: ${mod.number} "${mod.title}" (темы ${mod.topics.join(", ")}; грамматика ${mod.grammar.join(", ")})` : ""}
Секции: ${sections}

JSON:
{
  "title": "...",
  "totalScore": 20,
  "sections": [
    {
      "heading": "Vocabulary",
      "items": [ {"id":"1","type":"multiple_choice","prompt":"...","options":["A","B","C","D"],"answer":"A"} ]
    }
  ]
}`;
  return { system, user };
}

export function lessonPlanPrompt({
  grade,
  moduleNumber,
  lessonType,
  focus,
  duration,
}: {
  grade: Grade;
  moduleNumber: number;
  lessonType: string;
  focus: string;
  duration: number;
}) {
  const mod = moduleByGradeNumber(grade, moduleNumber);
  const system = `Ты методист, составляющий технологические карты уроков по ФГОС. Отвечай JSON-ом на русском.`;
  const user = `Составь технологическую карту урока.
Класс: ${grade}
Модуль: ${mod?.number} "${mod?.title}" (темы: ${mod?.topics.join(", ")}; грамматика: ${mod?.grammar.join(", ")})
Тип урока: ${lessonType}
Фокус: ${focus}
Длительность: ${duration} минут

JSON:
{
  "title": "...",
  "objectives": ["..."],
  "stages": [ {"stage":"Орг. момент","minutes":3,"activity":"..."} ],
  "materials": ["..."],
  "homework": "..."
}`;
  return { system, user };
}
