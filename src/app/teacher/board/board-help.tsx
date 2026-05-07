"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Keyboard, Layers, MousePointer2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Shortcut = { keys: string[]; label: string };

const TOOLS: Shortcut[] = [
  { keys: ["H"], label: "Рука — перемещение холста" },
  { keys: ["V"], label: "Выделение области или объекта" },
  { keys: ["R"], label: "Прямоугольник" },
  { keys: ["O"], label: "Эллипс" },
  { keys: ["D"], label: "Ромб" },
  { keys: ["A"], label: "Стрелка" },
  { keys: ["L"], label: "Линия (можно ломаную — клики)" },
  { keys: ["P"], label: "Карандаш" },
  { keys: ["T"], label: "Текст (двойной клик где угодно)" },
  { keys: ["E"], label: "Ластик" },
  { keys: ["M"], label: "Маркер (хайлайтер)" },
  { keys: ["K"], label: "Лазерная указка (исчезнет через пару секунд)" },
];

const EDITOR: Shortcut[] = [
  { keys: ["Ctrl", "Z"], label: "Шаг назад" },
  { keys: ["Ctrl", "Y"], label: "Шаг вперёд" },
  { keys: ["Ctrl", "C"], label: "Копировать" },
  { keys: ["Ctrl", "V"], label: "Вставить" },
  { keys: ["Ctrl", "Shift", "V"], label: "Вставить как обычный текст" },
  { keys: ["Ctrl", "X"], label: "Вырезать" },
  { keys: ["Ctrl", "D"], label: "Дублировать (или Alt + перетащить)" },
  { keys: ["Ctrl", "A"], label: "Выбрать всё" },
  { keys: ["Delete"], label: "Удалить выделенное" },
  { keys: ["S"], label: "Цвет обводки" },
  { keys: ["G"], label: "Цвет заливки" },
];

const VIEW: Shortcut[] = [
  { keys: ["Ctrl", "+"], label: "Увеличить масштаб" },
  { keys: ["Ctrl", "-"], label: "Уменьшить масштаб" },
  { keys: ["Ctrl", "0"], label: "Сбросить масштаб (100%)" },
  { keys: ["Shift", "1"], label: "Уместить все элементы в экран" },
  { keys: ["Ctrl", "+ колесо"], label: "Зум мышкой" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Как видит ученик манипуляции с доской?",
    a: "Ты управляешь вниманием: масштаб, прокрутка, перемещение объектов — всё видно ученику в его масштабе устройства.",
  },
  {
    q: "Как закрепить объект, чтобы ученик не стирал?",
    a: "Выдели объект и нажми значок замка над ним. Чтобы заблокировать всю доску целиком — замок в верхнем меню.",
  },
  {
    q: "Как добавить больше цветов?",
    a: "В палитре нажми крупный квадрат справа — откроются дополнительные цвета и оттенки.",
  },
  {
    q: "Что про автосохранение?",
    a: "Черновик сохраняется в браузере автоматически. Чтобы сохранить навсегда — нажми «Сохранить» в верхней панели, доска уйдёт на сервер и появится в списке ниже.",
  },
];

export function BoardHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
        title="Подсказка по доске (?)"
      >
        <HelpCircle className="h-4 w-4" /> Помощь
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className={cn(
              "h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-2xl",
              "animate-in slide-in-from-right-4 duration-200",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="font-display text-xl font-semibold">Помощь по доске</div>
                <div className="text-xs text-muted-foreground">
                  Горячие клавиши и ответы на частые вопросы
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Section title="Инструменты" icon={<MousePointer2 className="h-4 w-4 text-primary" />}>
              <ShortcutList items={TOOLS} />
            </Section>

            <Section title="Редактор" icon={<Keyboard className="h-4 w-4 text-primary" />}>
              <ShortcutList items={EDITOR} />
            </Section>

            <Section title="Просмотр" icon={<Layers className="h-4 w-4 text-primary" />}>
              <ShortcutList items={VIEW} />
            </Section>

            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                FAQ
              </div>
              <div className="space-y-2">
                {FAQ.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-xl border border-border bg-card p-3 text-sm shadow-soft"
                  >
                    <summary className="cursor-pointer list-none font-medium leading-snug marker:hidden">
                      <span className="mr-2 inline-block transition-transform group-open:rotate-90">
                        ›
                      </span>
                      {f.q}
                    </summary>
                    <p className="mt-2 pl-4 text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              На Mac используй <Kbd>⌘</Kbd> вместо <Kbd>Ctrl</Kbd>.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function ShortcutList({ items }: { items: Shortcut[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card text-sm shadow-soft">
      {items.map((s) => (
        <li key={s.label} className="flex items-start justify-between gap-3 px-3 py-2">
          <span className="leading-snug">{s.label}</span>
          <span className="flex flex-none items-center gap-1">
            {s.keys.map((k, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 ? <span className="text-xs text-muted-foreground">+</span> : null}
                <Kbd>{k}</Kbd>
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground shadow-sm">
      {children}
    </kbd>
  );
}
