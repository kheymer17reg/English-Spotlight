# Spotlight Learning

Современная AI-платформа для изучения английского по учебнику **Spotlight 2–8** (Просвещение / Express Publishing). Два кабинета в одном приложении: для ученика и для учителя.

- Для учителя: генератор упражнений, контрольные (Progress Check / модульный / ОГЭ), тех. карты уроков по ФГОС, ученики, аналитика, экспорт **DOCX / TXT / буфер**.
- Для ученика: **Lumos AI** (чат с голосовым вводом), тренировка по модулям, словарь (карточки/квиз), чтение с глоссарием и произношением, задания дня, прогресс (XP, стрик, бейджи, уровни).
- Поддерживает четырёх AI-провайдеров: **Claude (Anthropic)**, **OpenAI**, **Groq**, **Gemini**.
- Локальная SQLite-база для прогресса и аналитики.

Смотри также [AGENTS_AND_MCP.md](./AGENTS_AND_MCP.md) — карту рекомендованных MCP-серверов, агентов и субагентов для этого проекта.

## Стек

- **Next.js 14** (App Router) + **TypeScript**
- **TailwindCSS** c токенами дизайна (light/dark)
- **Zustand** для state
- **better-sqlite3** для локальной базы
- `@anthropic-ai/sdk`, `openai`, `groq-sdk`, `@google/generative-ai`
- `docx` для экспорта в Word

## Быстрый старт

1. Установи Node.js 20+ (https://nodejs.org/).
2. Склонируй репозиторий и установи зависимости:
   ```bash
   npm install
   ```
3. Создай `.env.local` на основе `.env.example`:
   ```
   # выбери один или несколько провайдеров:
   ANTHROPIC_API_KEY=sk-ant-...
   # OPENAI_API_KEY=sk-...
   # GROQ_API_KEY=gsk_...
   # GEMINI_API_KEY=AIza...
   # LLM_PROVIDER=anthropic   # опционально — жёсткий выбор
   ```
4. Запусти dev-сервер:
   ```bash
   npm run dev
   ```
5. Открой `http://localhost:3000` и выбери роль: **Я ученик** или **Я учитель**.

> Если AI-ключ не задан — генераторы всё равно работают, но возвращают демо-контент без участия LLM.

## Команды

| Скрипт | Что делает |
|---|---|
| `npm run dev` | Запуск в режиме разработки (порт 3000) |
| `npm run build` | Продакшн-сборка |
| `npm run start` | Запуск собранного билда |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Структура

```
src/
├── app/                 — страницы (Next.js App Router)
│   ├── student/         — кабинет ученика
│   ├── teacher/         — кабинет учителя
│   └── api/             — бекенд (chat, generate-*, export/docx, …)
├── components/
│   ├── ui/              — базовые примитивы (Button, Card, Tabs, …)
│   ├── layout/          — сайдбары, топбар, мобильная таб-навигация
│   └── teacher/         — специфичные компоненты кабинета учителя
├── lib/
│   ├── curriculum.ts    — программа Spotlight 2–8 (модули, темы, грамматика)
│   ├── vocabulary.ts    — словарь с переводами и примерами
│   ├── readings.ts      — тексты для чтения A1/A2/B1
│   ├── llm.ts           — единый адаптер к Anthropic/OpenAI/Groq/Gemini
│   ├── prompts.ts       — системные и JSON-промпты для генераторов
│   ├── rag.ts           — BM25-поиск по программе для Lumos
│   ├── db.ts            — SQLite (students, attempts, errors_log)
│   └── store.ts         — Zustand-стор ученика (persist)
└── types/               — TypeScript-типы
data/                    — SQLite-файл (создаётся автоматически)
```

## Частые проблемы

- **npm не запускается в PowerShell** → используй `npm.cmd install` и `npm.cmd run dev`.
- **`better-sqlite3` не собирается** → поставь Microsoft C++ Build Tools (https://visualstudio.microsoft.com/visual-cpp-build-tools/) и выбери «Desktop development with C++».
- **Голосовой ввод не работает** → голос работает в Chrome / Edge и требует разрешения на микрофон.
- **Хочу всё обнулить** → удали папку `data/` и очисти `localStorage` в DevTools.

## Лицензия

Частный проект. Для вопросов и предложений — Issues на GitHub.
