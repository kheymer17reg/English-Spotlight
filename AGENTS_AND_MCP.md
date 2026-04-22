# Agents & MCP Guide for Spotlight Learning

Этот документ — карта инструментов (MCP-серверы, AI-агенты, субагенты), которые лучше всего подходят для развития проекта **Spotlight Learning**. Он отвечает на три вопроса:

1. **Какие MCP / агенты / субагенты подключить** — и зачем именно для ED-продукта по Spotlight 2–8.
2. **Как активировать** каждый — короткие шаги и фрагменты конфигов.
3. **Как использовать** — рецепты и шаблоны команд для Devin, Claude, Cursor и любого другого клиента, поддерживающего MCP.

> Все конфиги предполагают локальную разработку на Windows/macOS/Linux. Если клиент MCP (Claude Desktop / Cursor / Devin) — просто скопируйте блок и подставьте свои ключи.

---

## Оглавление

- [1. Самые полезные MCP серверы для этого проекта](#1-самые-полезные-mcp-серверы-для-этого-проекта)
- [2. AI-провайдеры (через `.env.local`)](#2-ai-провайдеры-через-envlocal)
- [3. Субагенты (специализированные AI-роли)](#3-субагенты-специализированные-ai-роли)
- [4. Агентские рецепты (готовые команды)](#4-агентские-рецепты-готовые-команды)
- [5. Как подключить всё сразу](#5-как-подключить-всё-сразу)
- [6. Безопасность и секреты](#6-безопасность-и-секреты)

---

## 1. Самые полезные MCP серверы для этого проекта

### 1.1 `context7` — актуальная документация 1000+ библиотек

**Зачем:** Next.js 14/15, Tailwind, `better-sqlite3`, `docx`, Zustand обновляются часто. Context7 отдаёт свежую документацию по конкретной версии — модель не галлюцинирует API.

**Уже доступен** в вашем окружении (Devin). В Claude Desktop / Cursor активируется так:

```jsonc
// claude_desktop_config.json  /  .cursor/mcp.json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**Как пользоваться:**
- _"Покажи актуальный API `better-sqlite3` через context7"_
- _"Найди в context7, как правильно настроить `next-auth` с Next 14 App Router"_
- Работает внутри Devin тоже: `devin_mcp → context7`.

### 1.2 `playwright` — автотесты UI + проверка обеих панелей

**Зачем:** каждый раз, когда вы меняете дизайн, нужно проверить, что сценарии «Я ученик → чат с Lumos → упражнение → экспорт» и «Учитель → сгенерировать контрольную → DOCX» не сломаны. Playwright MCP делает это без написания кода.

```jsonc
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

**Рецепты:**
- _"Через playwright открой http://localhost:3000, нажми «Я ученик», выбери 5 класс, имя Аня, зайди в Lumos AI и задай вопрос 'Привет'"_.
- _"Сделай скриншоты всех страниц /student/* и /teacher/* в light и dark теме"_ (пригодится для PR / маркетинга).

### 1.3 `filesystem` — чтение и правка файлов курса

**Зачем:** если у вас появятся Word-документы методистов, PDF со сканами учебника, папки со звуковыми треками — MCP filesystem даст агенту безопасный доступ только к нужной папке.

```jsonc
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:/Users/Kheymer17/Desktop/spotlight-curriculum"
      ]
    }
  }
}
```

**Рецепты:**
- _"Пройдись по папке `spotlight-curriculum/grade5`, достань названия модулей и обнови `src/lib/curriculum.ts`"_.
- _"Положи DOCX с ответами учеников в `src/lib/attempts-sample.ts`"_.

### 1.4 `fetch` / web (встроенный) — свежая методика ФГОС и новости

**Зачем:** программы ФГОС, форматы ОГЭ и ВПР обновляются — нужно уметь подтягивать официальные документы. Devin уже умеет это через `web`/`web_get_contents`. В Claude Desktop поставьте `@modelcontextprotocol/server-fetch`.

```jsonc
{
  "mcpServers": {
    "fetch": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-fetch"] }
  }
}
```

### 1.5 `github` — автоматический PR и Issue

**Зачем:** агент может сам открывать PR с новыми упражнениями, фиксить баги, комментировать код-ревью. В Devin уже встроено (`git_pr`, `git`, `git_comment`). Локально (Claude / Cursor):

```jsonc
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." }
    }
  }
}
```

### 1.6 `notion` — план-график контента

**Зачем:** если вы ведёте roadmap в Notion — агент сможет вытаскивать задачи и обновлять их статус после генерации уроков/тестов. Уже есть в Devin (`mcp_tool → notion`). Для других клиентов:

```jsonc
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": { "NOTION_TOKEN": "secret_..." }
    }
  }
}
```

### 1.7 `linear` — баги и запросы учителей

**Зачем:** учителя обязательно будут присылать баги и пожелания. MCP-сервер Linear автоматически превращает их в тикеты. В Devin уже доступно.

### 1.8 `sqlite` — прямой доступ к `data/spotlight.db`

**Зачем:** отлаживать прогресс ученика и аналитику без собственного SQL-клиента.

```jsonc
{
  "mcpServers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "./data/spotlight.db"]
    }
  }
}
```

**Рецепты:**
- _"Покажи топ-5 учеников по XP и их текущий модуль"_.
- _"Посчитай среднюю точность по `skill='vocabulary'` за последние 7 дней"_.

### 1.9 `puppeteer` / Chrome DevTools (альтернатива Playwright)

Если Playwright уже используется для прод-тестов, MCP Chrome DevTools поможет открывать реальные скриншоты на проде без дополнительной авторизации.

### 1.10 `obsidian` / `markdown-export` (опционально)

Если методисты ведут конспекты в Obsidian — MCP даст агенту читать их напрямую и превращать в упражнения.

---

## 2. AI-провайдеры (через `.env.local`)

Проект поддерживает **четыре** LLM-провайдера и выбирает их в таком порядке (можно переопределить `LLM_PROVIDER`):

| Провайдер   | Env ключ            | Дефолтная модель               | Когда выбирать                                           |
|-------------|---------------------|--------------------------------|----------------------------------------------------------|
| Anthropic   | `ANTHROPIC_API_KEY` | `claude-3-5-sonnet-latest`     | Лучшее качество объяснений и русско-английского смешения |
| OpenAI      | `OPENAI_API_KEY`    | `gpt-4o-mini`                  | Баланс цена/качество, стабильный JSON                    |
| Groq        | `GROQ_API_KEY`      | `llama-3.3-70b-versatile`      | Супер-быстро, когда нужна мгновенная реакция чата        |
| Gemini      | `GEMINI_API_KEY`    | `gemini-1.5-flash-latest`      | Бесплатные квоты для учителей без биллинга               |

Пример `.env.local` для гибридной раскладки:

```
# Основной провайдер — Claude (богаче объяснения)
ANTHROPIC_API_KEY=sk-ant-api03-...
# Fallback — Groq (быстрее всего)
GROQ_API_KEY=gsk_...
# Принудительный выбор (опционально)
# LLM_PROVIDER=anthropic
```

---

## 3. Субагенты (специализированные AI-роли)

Субагент — это отдельный prompt + набор инструментов под конкретную задачу. Их можно запускать параллельно через Devin `run_subagent` или локально через роли Claude / Cursor.

| Субагент              | Назначение                                                                  | Инструменты / MCP                          |
|-----------------------|-----------------------------------------------------------------------------|--------------------------------------------|
| **Curriculum Curator**| Обновляет `src/lib/curriculum.ts` из официальных пособий Spotlight          | filesystem, fetch, context7                |
| **Exercise Composer** | Генерирует большие паки упражнений и кладёт их в БД                         | anthropic, openai, sqlite, filesystem      |
| **Test Proctor**      | Собирает экзамен формата ОГЭ и проверяет валидность ключей                  | openai (JSON mode), sqlite                 |
| **Lesson Architect**  | Собирает тех. карту урока по ФГОС (цели → этапы → материалы)                | anthropic, context7 (ФГОС-документы)       |
| **UI Reviewer**       | Делает скриншоты и сравнивает до/после дизайна, ставит оценки UX            | playwright, filesystem                     |
| **QA Guardian**       | Запускает `npm run build`, `npm run typecheck`, `npm run lint`              | bash (через хост)                          |
| **Voice Linguist**    | Проверяет произношение в `Speech Synthesis` и подбирает лучшие голоса       | playwright, notion (голосовая база)        |
| **Analytics Analyst** | Читает SQLite, строит тренды и советы "на кого обратить внимание"           | sqlite, openai                             |

### Пример: субагент `Exercise Composer`

```md
# Role
Ты — методист, генерирующий упражнения по учебнику Spotlight.

# Tools
- fetch: `POST /api/ai/generate-exercise`
- sqlite: `INSERT INTO attempts ...` для тестового запуска

# Constraints
- Соблюдай JSON-схему из src/types/index.ts (ExerciseItem)
- Отвечай только русским, примеры — английским
- Не выдавай ключ ответа в поле prompt

# Success criteria
- 100% items валидируются `zod` (см. `src/lib/prompts.ts`)
- Добавлено минимум 20 новых упражнений за запуск
```

Запуск в Devin:
```
devin_mcp → run_subagent → prompt="Запусти Exercise Composer на 5 классе модуль 2. Сохрани 20 упражнений в БД."
```

---

## 4. Агентские рецепты (готовые команды)

Скопируйте в чат с Devin / Claude — сработает сразу.

### 4.1 Массовая генерация контента

> _"Используя `context7`, уточни последнее API OpenAI. Затем запусти Exercise Composer субагента для классов 2–8, каждый модуль, `type=multiple_choice`. Сохрани 10 упражнений на каждый модуль в `data/spotlight.db`. По окончании покажи количество созданных записей через sqlite MCP."_

### 4.2 Смоук-тест после редизайна

> _"Playwright: открой локальный сайт, пройди путь «Я ученик → 5 класс → Lumos → задай 3 вопроса → Тренировка → реши 1 упражнение → Прогресс». Сделай скриншоты каждого шага и положи их в `/screenshots/smoke/`. Если хоть где-то 404 или ошибка — создай Issue в linear."_

### 4.3 Обновление curriculum из свежего издания учебника

> _"Filesystem MCP: прочитай `spotlight-curriculum/grade6/teacher_book.pdf`. Извлеки модули, темы, грамматику, ключевую лексику. Сравни с `src/lib/curriculum.ts` и создай PR (github MCP) с правками. В PR приложи таблицу расхождений."_

### 4.4 Аналитика для отчёта родителям

> _"SQLite MCP: построй за последние 30 дней топ-3 отстающих по grade=7, их слабые навыки и рекомендуемые модули. Оформи ответ как markdown-отчёт."_

### 4.5 Автопроверка PR

> _"QA Guardian: запусти `npm install && npm run typecheck && npm run build`. Если всё ок — добавь комментарий в PR «CI зелёный». Если нет — процитируй первые 20 строк ошибок."_

---

## 5. Как подключить всё сразу

### 5.1 В Claude Desktop

Файл `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) или `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```jsonc
{
  "mcpServers": {
    "context7":    { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] },
    "playwright":  { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] },
    "fetch":       { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-fetch"] },
    "filesystem":  {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/Users/Kheymer17/Desktop/spotlight-learning"]
    },
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "C:/Users/Kheymer17/Desktop/spotlight-learning/data/spotlight.db"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." }
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": { "NOTION_TOKEN": "secret_..." }
    }
  }
}
```

Перезапустите Claude Desktop. В списке инструментов должны появиться все серверы.

### 5.2 В Cursor

`.cursor/mcp.json` в корне проекта — формат тот же. Cursor подхватывает автоматически при старте.

### 5.3 В Devin (ваш текущий инструмент)

Часть MCP уже подключена организационно:

| MCP         | Статус в Devin              |
|-------------|-----------------------------|
| playwright  | ✓ доступен                  |
| notion      | ✓ доступен                  |
| linear      | ✓ доступен                  |
| context7    | ✓ доступен                  |
| github      | встроено (`git_pr`, `git`)  |
| fetch/web   | встроено (`web`)            |

Остальные (sqlite, filesystem) можно подключить через панель настроек Devin — **Settings → Integrations**. Или попросить Devin: _"добавь MCP `sqlite` с путём к `data/spotlight.db`"_.

---

## 6. Безопасность и секреты

- `.env.local` — **не коммитить**. `.gitignore` уже настроен.
- MCP GitHub token — не пишите в конфиг файлом. Используйте:
  - **Windows:** переменные среды `setx GITHUB_PERSONAL_ACCESS_TOKEN "ghp_..."`
  - **macOS/Linux:** `export` в `~/.zshrc` или утилита `1Password`/`pass`.
- Для учителей, использующих продукт в школе, можно вшить **серверный ключ** в `.env.local` на одном мастер-сервере и ходить туда через ваш публичный прокси — так ключ не утекает к каждому ученику.
- Если случайно закоммитили ключ — сразу ротируйте:
  - Anthropic: https://console.anthropic.com/settings/keys
  - OpenAI: https://platform.openai.com/api-keys
  - Groq: https://console.groq.com/keys
  - Gemini: https://aistudio.google.com/apikey

---

## Быстрый чек-лист: с чего начать сегодня

1. Добавьте ключ провайдера в `.env.local` и запустите `npm run dev`.
2. Подключите `context7` + `playwright` в Claude/Cursor — 90% ценности MCP.
3. Попросите агента выполнить **рецепт 4.2 (смоук-тест)** — убедитесь, что обе панели работают.
4. Подключите `sqlite` MCP и запустите **рецепт 4.4** — это покажет, что аналитика уже живая.
5. Дальше двигайтесь по субагентам из раздела 3 по одному — это даёт контроль, а не хаос.

Удачи с Spotlight Learning! 🎓
