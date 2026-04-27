import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { GeneratedExercise, GeneratedTest, LessonPlan, MethodicalLesson } from "@/types";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";

type Payload =
  | { kind: "exercise"; exercise: GeneratedExercise; grade: number; module: number }
  | { kind: "test"; test: GeneratedTest; grade: number }
  | { kind: "lesson"; plan: LessonPlan; grade: number }
  | { kind: "methodical"; lesson: MethodicalLesson };

export async function POST(req: Request) {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
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
  if (p.kind === "methodical") {
    return `methodical-g${p.lesson.grade}-m${p.lesson.moduleNumber}-l${p.lesson.lessonNumber}`;
  }
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
  if (p.kind === "methodical") {
    const l = p.lesson;
    const out: Paragraph[] = [
      H(HeadingLevel.HEADING_1, l.title),
      P(`${l.grade} класс · Модуль ${l.moduleNumber} «${l.moduleTitle}» · Урок ${l.lessonNumber} из 7`, { italic: true }),
      P(`Тип урока: ${l.lessonType} · Длительность: ${l.duration} мин`, { italic: true }),
      P(`Страницы УМК: ${l.textbookPages}`, { italic: true }),
      P(""),
      H(HeadingLevel.HEADING_2, "Планируемые результаты"),
      H(HeadingLevel.HEADING_3, "Предметные"),
      ...l.objectives.subject.map((o) => P(`• ${o}`)),
      H(HeadingLevel.HEADING_3, "Метапредметные"),
      ...l.objectives.metaSubject.map((o) => P(`• ${o}`)),
      H(HeadingLevel.HEADING_3, "Личностные"),
      ...l.objectives.personal.map((o) => P(`• ${o}`)),
      P(""),
      H(HeadingLevel.HEADING_2, "Оборудование и ресурсы"),
      ...l.equipment.map((e) => P(`• ${e}`)),
      P(""),
      H(HeadingLevel.HEADING_2, "Активная лексика и грамматика"),
      P(`Лексика: ${l.vocabulary.join(", ")}`),
      P(`Грамматика: ${l.grammar.join(", ")}`),
      P(""),
      H(HeadingLevel.HEADING_2, "Технологическая карта урока"),
    ];
    l.stages.forEach((s, i) => {
      out.push(H(HeadingLevel.HEADING_3, `${i + 1}. ${s.name} (${s.minutes} мин)`));
      out.push(P("Деятельность учителя:", { bold: true }));
      out.push(P(s.teacherScript));
      out.push(P("Деятельность учеников:", { bold: true }));
      out.push(P(s.studentActivity));
      out.push(P("Формируемые УУД:", { bold: true }));
      for (const u of s.uud) out.push(P(`• ${u}`));
      out.push(P(""));
    });
    out.push(H(HeadingLevel.HEADING_2, "Рефлексия"));
    out.push(P(l.reflection));
    out.push(P(""));
    out.push(H(HeadingLevel.HEADING_2, "Домашнее задание"));
    out.push(P(l.homework));
    if (l.handouts.length) {
      out.push(P(""));
      out.push(H(HeadingLevel.HEADING_2, "Раздаточный материал"));
      for (const h of l.handouts) {
        out.push(H(HeadingLevel.HEADING_3, h.title));
        out.push(P(h.content));
      }
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
