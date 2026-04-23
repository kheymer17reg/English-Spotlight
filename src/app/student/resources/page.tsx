"use client";

import { useStore } from "@/lib/store";
import { ResourcesView } from "@/components/resources/resources-view";

export default function StudentResourcesPage() {
  const student = useStore((s) => s.student);
  return (
    <ResourcesView
      grade={student?.grade ?? null}
      audienceHint="Подборка для тебя. Сайты по твоему классу, проверенные педагогами — аудио, игры, видео, экзамены."
    />
  );
}
