"use client";

import { ResourcesView } from "@/components/resources/resources-view";

export default function TeacherResourcesPage() {
  return (
    <ResourcesView
      grade={null}
      audienceHint="Ресурсы для урока и домашних заданий. Фильтруй по классу, копируй ссылки — они открываются в новой вкладке, подходят для проектора."
    />
  );
}
