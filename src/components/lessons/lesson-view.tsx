import type { MethodicalLesson } from "@/types";

export function LessonView({ lesson }: { lesson: MethodicalLesson }) {
  return (
    <article className="space-y-6 rounded-2xl border border-border bg-surface p-6 leading-relaxed print:border-0 print:p-0 print:shadow-none">
      <header className="space-y-1 border-b border-border pb-4 print:pb-2">
        <h1 className="font-display text-2xl font-semibold">{lesson.title}</h1>
        <p className="text-sm text-muted-foreground">
          {lesson.grade} класс · Модуль {lesson.moduleNumber} «{lesson.moduleTitle}» · Урок {lesson.lessonNumber} из 7
        </p>
        <p className="text-sm text-muted-foreground">
          Тип урока: {lesson.lessonType} · Длительность: {lesson.duration} мин
        </p>
        <p className="text-sm text-muted-foreground">Страницы УМК: {lesson.textbookPages}</p>
      </header>

      <Section title="Планируемые результаты">
        <SubSection title="Предметные">
          <BulletList items={lesson.objectives.subject} />
        </SubSection>
        <SubSection title="Метапредметные">
          <BulletList items={lesson.objectives.metaSubject} />
        </SubSection>
        <SubSection title="Личностные">
          <BulletList items={lesson.objectives.personal} />
        </SubSection>
      </Section>

      <Section title="Оборудование и ресурсы">
        <BulletList items={lesson.equipment} />
      </Section>

      <Section title="Активная лексика и грамматика">
        <p className="text-sm">
          <b>Лексика:</b> {lesson.vocabulary.join(", ")}
        </p>
        <p className="text-sm">
          <b>Грамматика:</b> {lesson.grammar.join(", ")}
        </p>
      </Section>

      <Section title="Технологическая карта урока">
        <div className="space-y-4">
          {lesson.stages.map((s, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/40 p-4 print:break-inside-avoid">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-semibold">
                  {i + 1}. {s.name}
                </h4>
                <span className="text-xs text-muted-foreground">{s.minutes} мин</span>
              </div>
              <dl className="space-y-2 text-sm">
                <dt className="font-medium">Деятельность учителя</dt>
                <dd className="whitespace-pre-wrap text-muted-foreground">{s.teacherScript}</dd>
                <dt className="font-medium">Деятельность учеников</dt>
                <dd className="whitespace-pre-wrap text-muted-foreground">{s.studentActivity}</dd>
                <dt className="font-medium">Формируемые УУД</dt>
                <dd>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {s.uud.map((u, j) => (
                      <li key={j}>{u}</li>
                    ))}
                  </ul>
                </dd>
              </dl>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Рефлексия">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lesson.reflection}</p>
      </Section>

      <Section title="Домашнее задание">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lesson.homework}</p>
      </Section>

      {lesson.handouts.length ? (
        <Section title="Раздаточный материал">
          <div className="space-y-3">
            {lesson.handouts.map((h, i) => (
              <div key={i} className="rounded-lg border border-dashed border-border p-3">
                <div className="mb-1 font-medium">{h.title}</div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{h.content}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}
