import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { GeneratedExercise, GeneratedTest, LessonPlan } from "@/types";

export const runtime = "nodejs";

type Payload =
  | { kind: "exercise"; exercise: GeneratedExercise; grade: number; module: number }
  | { kind: "test"; test: GeneratedTest; grade: number }
  | { kind: "lesson"; plan: LessonPlan; grade: number };

export async function POST(req: Request) {
  const payload = (await req.json()) as Payload;
  const doc = new Document({ sections: [{ children: buildChildren(payload) }] });
  const buf = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filenameFor(payload)}.docx"`,
    },
  });
}

function filenameFor(p: Payload) {
  if (p.kind === "exercise") return `exercise-g${p.grade}-m${p.module}`;
  if (p.kind === "test") return `test-g${p.grade}-${p.test.format}`;
  return `lesson-g${p.grade}-m${p.plan.module}`;
}

type Level = (typeof HeadingLevel)[keyof typeof HeadingLevel];
function H(level: Level, text: string) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, bold: true })] });
}

function P(text: string, opts: { bold?: boolean; italic?: boolean } = {}) {
  return new Paragraph({ children: [new TextRun({ text, bold: opts.bold, italics: opts.italic })] });
}

function buildChildren(p: Payload) {
  if (p.kind === "exercise") {
    const out: Paragraph[] = [
      H(HeadingLevel.HEADING_1, p.exercise.title),
      P(`${p.grade} класс · Модуль ${p.module} · ${p.exercise.type}`, { italic: true }),
      P(""),
    ];
    p.exercise.items.forEach((it, i) => {
      out.push(P(`${i + 1}. ${it.prompt}`, { bold: true }));
      if (it.options) for (const [j, o] of it.options.entries()) out.push(P(`   ${String.fromCharCode(97 + j)}) ${o}`));
      out.push(P(`Ответ: ${Array.isArray(it.answer) ? it.answer.join(" — ") : it.answer}`, { italic: true }));
      if (it.explanation) out.push(P(`Примечание: ${it.explanation}`, { italic: true }));
      out.push(P(""));
    });
    return out;
  }
  if (p.kind === "test") {
    const out: Paragraph[] = [
      H(HeadingLevel.HEADING_1, p.test.title),
      P(`${p.grade} класс · формат ${p.test.format} · максимум ${p.test.totalScore} баллов`, { italic: true }),
      P(""),
    ];
    for (const s of p.test.sections) {
      out.push(H(HeadingLevel.HEADING_2, s.heading));
      s.items.forEach((it, i) => {
        out.push(P(`${i + 1}. ${it.prompt}`, { bold: true }));
        if (it.options) for (const [j, o] of it.options.entries()) out.push(P(`   ${String.fromCharCode(97 + j)}) ${o}`));
        out.push(P(`Ответ: ${Array.isArray(it.answer) ? it.answer.join(" — ") : it.answer}`, { italic: true }));
        out.push(P(""));
      });
    }
    return out;
  }
  const plan = p.plan;
  const out: Paragraph[] = [
    H(HeadingLevel.HEADING_1, plan.title),
    P(`${p.grade} класс · Модуль ${plan.module} · ${plan.duration} минут`, { italic: true }),
    P(`Тип урока: ${plan.lessonType} · Фокус: ${plan.focus}`, { italic: true }),
    P(""),
    H(HeadingLevel.HEADING_2, "Цели"),
    ...plan.objectives.map((o) => P(`• ${o}`)),
    P(""),
    H(HeadingLevel.HEADING_2, "Этапы"),
    ...plan.stages.map((s) => P(`${s.minutes} мин — ${s.stage}: ${s.activity}`)),
    P(""),
    H(HeadingLevel.HEADING_2, "Материалы"),
    ...plan.materials.map((m) => P(`• ${m}`)),
    P(""),
    H(HeadingLevel.HEADING_2, "Домашнее задание"),
    P(plan.homework),
  ];
  return out;
}
