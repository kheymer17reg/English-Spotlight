import { notFound } from "next/navigation";
import { getMethodicalLesson } from "@/lib/methodical-db";
import { LessonView } from "@/components/lessons/lesson-view";
import { PrintButton } from "@/components/lessons/print-button";

export const dynamic = "force-dynamic";

export default function LessonPrintPage({ params }: { params: { id: string } }) {
  const lesson = getMethodicalLesson(params.id);
  if (!lesson) notFound();
  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 print:px-0 print:py-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <LessonView lesson={lesson} />
    </div>
  );
}
