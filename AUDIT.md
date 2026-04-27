# English Spotlight — комплексный аудит

> Прогон проекта тремя независимыми экспертными ролями: методист, дизайнер, технарь.
> Источник ролей: `roles.md` (от пользователя). Метод — статический разбор кода и контента. Без UI-тестов (пользователь тестирует сам на выходных).
>
> На момент аудита: ветка `devin/1776897398-initial-spotlight-learning`, коммит `844e791`. `tsc --noEmit` ✓, `next lint` ✓ (0 warnings).

---

## Сводка приоритетов (TL;DR)

| Приоритет | Что | Кто |
|---|---|---|
| 🔥 Критично | 12+ публичных API без auth (журнал, профиль, доска, AI), `signup` принимает `role:"teacher"` | Технарь |
| 🔥 Критично | IPA-транскрипция не заполнена ни у одного слова, но UI про неё уже знает | Методист |
| ⚠️ Серьёзно | Сюжетки: 9 на 7 классов (1.3 в среднем) | Методист |
| ⚠️ Серьёзно | Listening как отдельный навык не реализован, Writing — тоже | Методист |
| ⚠️ Серьёзно | `recordActivity` доверяет `studentId` из тела — любой может писать чужой XP | Технарь |
| ⚠️ Серьёзно | Tap-target `Button size=sm` 32px и `size=icon` 36px — ниже WCAG AA 44px | Дизайнер |
| 💡 Полировка | Нет skeleton loaders, нет empty illustrations, dark-mode контраст некоторых badge-ов слаб | Дизайнер |

---

# 🎓 Роль 1: Методист-аналитик

## Методический аудит: контентная база (vocabulary + curriculum + readings + dialogues + scenarios + stories)

### ✅ Что работает хорошо

- **Сетка модулей корректная.** 28 модулей × 4 на класс (2–8) — соответствует структуре Spotlight (Express Publishing/Просвещение). Темы и грамматика выложены в правильной последовательности (`src/lib/curriculum.ts`).
- **Словарь действительно покрывает 7 классов.** 518 уникальных лемм, 558 word-slots по модулям, 100% покрытие переводами и примерами в TRANSLATIONS (см. `src/lib/vocabulary.ts`). Среднее ~20 слов/модуль — оптимально для подросткового SRS-цикла.
- **SRS-движок реализован грамотно.** `src/lib/sr.ts` — это полноценный SM-2: easiness factor c полом 1.3, потолком 3.0, корректное обращение с `again`/`hard`/`good`/`easy`. Это методически правильно, не «линейные интервалы». Расчёт mastery по интервалу (<7д learning, <30д review, ≥30д mastered) тоже соответствует канону SM-2.
- **Reading texts** (`src/lib/readings.ts` + `readings-extra.ts`) — 91 текст с глоссарием и вопросами, по 5 на класс плюс старая база. Дидактически рабочий минимум.
- **Парные сценарии (`scenarios.ts`)** — 31 шт., тематически привязаны к модулям через `moduleNumber`. Это даёт TBLT-привязку (task = «купи в магазине», слова из M3 «Tasty Treats» сразу нужны).
- **Сюжетки** (`stories.ts`) — реализация PPP+input через cloze/choice/translate, с тап-словарём. Хороший формат для retrieval practice.
- **Photo HW vision-промпт** на корректном педагогическом языке: «методист английского языка», просит 2-4 пункта по грамматике/орфографии/пунктуации и оценку 2-5. Это уже выше среднего для AI-чек-апа.
- **Quiz сорсит вопросы из `vocabularyByGrade`** с 3 дистракторами из того же класса (`/api/quiz/route.ts`) — дистракторы из родственного семантического поля, что хорошо для retrieval practice.

### ⚠️ Методические замечания

#### 1. **[Критично]** IPA-транскрипция ни у одного слова не заполнена, но UI её ждёт
- **Где в коде.** `src/lib/vocabulary.ts:15-17` — поле `tr?` опционально, но в **0 из 518** записей оно реально проставлено. При этом `vocabulary/page.tsx:206-207` и `:280-282` рендерит `font-mono text-lg /{w.transcription}/` крупно — эта секция **никогда не покажется**. PR #1 говорил «транскрипция /ipa/ крупно» — этого по факту нет.
- **Почему это проблема.** Принцип PPP («Presentation»): для младших классов (особенно 2–4) транскрипция — критический мост между орфографией и звучанием в английском. Без IPA на флэш-карте ученик 2-го класса не поймёт почему `chair` /tʃeə/ а не «чхайр». Это нарушает comprehensible input (Krashen) — вход не становится «pronounceable».
- **Как исправить (3 варианта).**
  1. **Быстрый.** Сгенерировать IPA по словарной базе через CMU dict (https://github.com/cmusphinx/cmudict) → конвертировать ARPAbet → IPA скриптом, заполнить `tr:` для всех 518 слов.
  2. **Качественный.** Лицензированный источник (Cambridge English Pronouncing Dictionary), 200₽-эквивалент, 100% точность для британского варианта (что важно для Spotlight UK-ориентированной программы).
  3. **AI-fallback.** При первой загрузке слова, если `tr` пустой — запрос Lumos «Дай британскую IPA для слова X», результат кэшируется в IndexedDB. Дёшево, но даст шум на низкочастотных лексемах.

  **Моя рекомендация:** вариант 1 для 80% покрытия за 1 коммит, потом точечно вычитать через вариант 2 для топ-200 high-frequency слов.

#### 2. **[Критично]** Listening как отдельный навык не реализован
- **Где в коде.** `ActivityType` (`src/types/index.ts`) включает `"listening"`, но грепнул проект — нет страницы `/student/listening`, нет упражнения `listening_dictation` в `ExerciseType`, нет аудио-only заданий. Текущий «listening» это побочное чтение текста через TTS-плеер на reading-странице.
- **Почему это проблема.** Балансировка четырёх навыков (CEFR descriptor — Reception/Production × Spoken/Written) — базовое требование ФГОС. У вас прокачано Reading + Speaking (chat, pair, pronunciation, stories). Listening и Writing — голые. CEFR A1-A2 ученик должен уметь «понять короткий текст на слух с опорой на знакомую лексику» — у вас нет ни одной такой задачи.
- **Как исправить.**
  1. **MVP.** Новый `ExerciseType: "listening_cloze"` — TTS зачитывает фразу, ученик заполняет 1-2 пропуска. Реализуется поверх готового `/api/tts` за 1 страницу.
  2. **Полноценный.** Формат «Listen and choose»: аудио → 4 варианта (визуально/текстом). Брать из существующих диалогов (`dialogues.ts` — 7 классов × ~4 диалога) — диалог проигрывается, потом 3-4 вопроса по нему.
  3. **Диктант для 5-8.** Для старших — подразумевается письменный ответ (touchpoint к Writing). AI-чек через Whisper transcript vs эталон (как в `/api/pronunciation`, но наоборот: ученик пишет, а не говорит).

#### 3. **[Серьёзно]** Сюжетки слишком тонкие — 1-2 на класс
- **Где в коде.** `src/lib/stories.ts` — 9 stories на 7 классов. g4 и g6 имеют по 2, остальные по одной. Ребёнок «съест» эти 5-минутные истории за один присест, а потом контент закончится.
- **Почему это проблема.** Stories формат у Duolingo — это серия по 30+ на уровень, обновляется каждые 2 недели. Один-единственный 4-сценный нарратив на 6-й класс — не вариативен по жанрам/темам/персонажам, не даёт повторения с вариативным контекстом (key для long-term memory).
- **Как исправить.** Расширять минимум до 5 на класс = 35 штук. Жанры на класс: повседневная сценка / приключение / school slice / fantasy mini / культурно-страноведческая («What's in a British school lunchbox?»). Для младших — короче (3-4 сцены), для старших — длиннее (6-8 сцен) с более сложной грамматикой.

#### 4. **[Серьёзно]** Дидактическая последовательность «from receptive to productive» не выдерживается на главной
- **Где в коде.** `/student/page.tsx:54-60` — DAILY_TASKS жёстко зашиты: vocab, practice, reading, pair, pronunciation. Но pair (диалог = production) и pronunciation (production) идут в один день со словарём (reception). У ученика 2-го класса, который только увидел слово 1 раз, нет шанса его правильно произнести в pair.
- **Почему это проблема.** Принцип PPP (Present → Practice → Produce) и i+1 от Krashen: production должен следовать за достаточным input. Сейчас у нас «5 заданий разных типов параллельно».
- **Как исправить.** Ввести «дни недели по типу»: Пн — vocab+reading (Reception), Вт — practice grammar, Ср — listening+vocab review, Чт — pronunciation, Пт — pair-roleplay (Production), Сб-Вс — повтор ошибок и сюжетки. Это даёт **scaffolded production** и снимает фрустрацию у младших.

#### 5. **[Серьёзно]** Quiz формат «word → translation MCQ» — это recognition, не retrieval
- **Где в коде.** `/api/quiz/route.ts` — генерирует только формат «английское слово → 4 варианта перевода». Это recognition (узнавание), а не retrieval (припоминание).
- **Почему это проблема.** Retrieval practice (Roediger & Karpicke 2006) — самый сильный механизм long-term retention. Recognition даёт нам «видел это слово где-то», а не «могу использовать». Для квиза в классе с лидербордом это слабо: ученик угадывает, не учится.
- **Как исправить.** Добавить 4 формата вопроса с весом 25% каждый:
  - Recognition: «cat → ?» (как сейчас)
  - Production: «кот → type the English word» (text input)
  - Cloze: «I have a ___ at home. (cat/dog/fish)» (контекст)
  - Audio: «🔊 Слушай и выбери слово» (через TTS)

  В `quiz-db.ts:generateVocabQuestions` миксуй типы. Это превратит квиз из «викторина» в «миниатюрный mock-экзамен» — методически в разы сильнее.

#### 6. **[Среднее]** Photo HW vision: AI ставит оценку 2-5, но без рубрики
- **Где в коде.** `src/lib/photo-hw-vision.ts:13-18` — system-prompt просит «предложи оценку 2–5», но не задаёт критериев. AI даст рандомные 4-5 в большинстве случаев.
- **Почему это проблема.** Без рубрики оценка — лотерея. ФГОС требует от учителя обоснования отметки — родитель/ученик не поймёт «почему 4 а не 5».
- **Как исправить.** В промпт зашить шкалу:
  ```
  5 — нет ошибок или 1 минорная (артикль / запятая)
  4 — 2-3 ошибки, не искажающие смысл
  3 — 4-5 ошибок или 1 грубая (структура предложения)
  2 — много ошибок / искажён смысл
  ```
  И вместе с `grade` возвращать `gradeRationale` (1-2 строки на русском). Это сразу делает оценку защищаемой.

#### 7. **[Среднее]** Парные диалоги: AI-роль фиксирована, но student-роль тоже фиксирована — нет свободы
- **Где в коде.** `src/lib/scenarios.ts` — у каждого scenario `studentRole` строго указан («a child showing a family photo»). Ученик не может выбрать «я пришёл купить молоко» — он всегда «ребёнок с фотографией».
- **Почему это проблема.** TBLT (Task-Based Language Teaching) предполагает, что ученик выбирает свою личность в задании. Жёсткая роль = ролевой текст с заранее известным сюжетом, что снижает вовлечённость.
- **Как исправить.** Сделать `studentRole` опциональным или давать список из 2-3 вариантов на сценарий. Тогда AI адаптируется под выбор ребёнка.

#### 8. **[Минор]** Vocabulary fallback exercise: повторяющиеся слова и слабые дистракторы
- **Где в коде.** `/api/ai/generate-exercise/route.ts:65-105` (fallback при NO_LLM_KEY) — для multiple_choice он берёт `shuffle(words.filter(...))` для дистракторов, но из узкого пула в 20 слов одного модуля. У ученика быстро возникает паттерн «3 варианта повторяются». Кроме того, при `count > 20` будет повторение слов как вопросов.
- **Как исправить.** Дистракторы добавлять из соседних модулей (того же класса, но другие темы) — это даёт лучшее «семантическое расстояние», что повышает discrimination.

### 📚 Рекомендации к материалу

- **CEFR-маркировка.** Сейчас у `Dialogue` есть `level: A1`, но у `Story`, `Reading`, `Exercise` — нет. Учителю было бы крайне полезно фильтровать «дай мне A2 reading из M5» — это нужно и для дифференциации в смешанных классах.
- **Grammar bank** отсутствует как отдельная сущность. У вас есть `methodical_lessons` с тегом `kind: "grammar"`, но нет ни одной структурной таблицы (Present Simple endings, irregular verbs). Для grades 5-8 это пробел: дети не «учат грамматику», а только её упражняют.
- **Mixed-ability дифференциация не реализована.** Ученик 7-го класса с уровнем B1 получит тот же exercise что и слабый A2-ребёнок. Нужен `student.cefrLevel` (или вычислять автоматически по accuracy за неделю) и подмешивать в промпт `difficulty: easy|medium|hard` адаптивно.
- **Орфография и пунктуация в диалогах** местами «слишком чистые» для разговора 9-летних. В `dialogues.ts` дети говорят как взрослые: «Yes, our kitchen has a big table where we eat». Реалистичнее: «Yeah, we have a big table. We eat there.»

### 🎯 Вердикт: **требует доработки** (не блокер для запуска, но дорабатываем поэтапно)

**Что добавить в первую очередь (методически):**
1. IPA для всех 518 слов (вариант 1 из CMU dict).
2. Listening exercise + 1 страница `/student/listening`.
3. Расширение Stories до 5/класс (35 шт).
4. Гибридный quiz-формат (4 типа вопросов).
5. Рубрика для photo HW.

---

# 🎨 Роль 2: Дизайнер-перфекционист

## Дизайн-ревью: фундаментальный слой и ключевые экраны

### 🔍 Первое впечатление

Дизайн-токены организованы грамотно (HSL var, светлая/тёмная пара, акцент `--primary` бирюзово-зелёный + `--accent` фиолетовый — это сочетание реально используют Notion и Linear). За 3 секунды считывается «современная Ed-tech платформа, для подростков и старше». Для младших классов (2-3) — **слишком академично**: маловато живых иллюстраций и игрового настроения. Для 5-8 — отлично.

### 🎯 Что улучшить

#### 🔴 Критично

##### 1. **Tap-targets ниже WCAG AA 44×44px**
- **Где.** `src/components/ui/button.tsx`:
  - `sm: "h-8 px-3 ..."` → 32px (нарушает WCAG 2.1 AA target size 44px)
  - `icon: "h-9 w-9 ..."` → 36px (тоже не дотягивает)
  - Закрывающий крестик в поиске словаря (`vocabulary/page.tsx:101-104`) — `p-1` на иконке 14px = ~22px
- **Почему.** Дети 2-4 классов имеют тачскрин-моторику в среднем хуже взрослых. WCAG 2.1 (raised in 2.2 to 24×24 minimum and recommends 44×44). На мобильных браузерах с маленькими пальцами/перчатками — миспроматы.
- **Предлагаю.**
  - `sm: "h-9 px-3 ..."` (36px) — компромисс, всё ещё компактно
  - `icon: "h-11 w-11 ..."` (44px) — соответствует AAA
  - Все «×» очистки в `Input` обернуть в кнопку 44×44 с ghost-вариантом
  - Реф: Refactoring UI Глава 7, Apple HIG (44pt), Material 3 (48dp)

##### 2. **Color contrast в dark mode не проверен на 4.5:1**
- **Где.** `globals.css:50-86`. `--muted-foreground: 220 14% 74%` на `--background: 222 31% 8%` — это контраст ~10.6:1 (отлично). Но `--border: 222 16% 26%` на тёмном фоне — это ~2.1:1, что **fail для UI components** (нужно 3:1 для focus rings и dividers).
- **Почему.** ARIA WCAG 2.1 SC 1.4.11 — non-text contrast 3:1 для UI components. Слепые-кнопки и поля без чёткой границы становятся «угадай-форму».
- **Предлагаю.**
  - `--border` в dark поднять до `222 16% 32-35%` для контраста ~3:1
  - Для focus-rings: `--ring` в dark уже `173 72% 50%` (бирюза) — это ~5:1 на чёрном, OK.
  - Прогнать `react-aria` или Stark plugin → выдаст ~10 точек где fail.

##### 3. **Hero-блок главной ученика — два больших градиентных блюра одновременно**
- **Где.** `student/page.tsx:104-107` — два `blur-3xl` 56×56 размером в углах hero. Plus inside `from-primary/10 via-surface to-accent/10` фон.
- **Почему.** Визуальный шум. Передача «вау-эффект цвета» уже идёт от градиентного фона + кнопки + бейджи XP/стрика. Два дополнительных глоу-блюра делают композицию **визуально перегруженной** для младших классов и **нечитаемой при слабом контрасте** монитора.
- **Предлагаю.** Оставить один блюр (один угол), либо снизить opacity до 0.15. Реф: Linear, Vercel — у них один акцентный градиент, не два.

#### 🟡 Средний приоритет

##### 4. **Skeleton loaders отсутствуют, везде Loader2**
- **Где.** Грепнул проект — `Loader2` (lucide spinner) встречается 30+ раз, `<Skeleton>` или `animate-pulse` для контентных placeholder'ов — 0.
- **Почему.** Спиннер показывает «что-то происходит», но не «что именно загружается». Skeleton — современный паттерн (LinkedIn, Slack, Notion), даёт ощущение скорости и уменьшает воспринимаемое время загрузки на ~30% (Nielsen Norman 2020).
- **Предлагаю.** `<Skeleton className="h-4 w-24 rounded animate-pulse bg-muted" />` примитив. На главной, в журнале, в ленте — заменить spinner-ы. На AI-генерации (которая реально 5-10 сек) спиннер оставить, добавив текстовый прогресс «Lumos думает…».

##### 5. **Empty states без иллюстраций**
- **Где.** `src/components/ui/empty.tsx` — рендерит только заголовок и описание. Нет ни SVG, ни эмоджи, ни иконки.
- **Почему.** Empty state — это «потерянный момент онбординга». Правильный empty state не «у вас нет данных», а «вот что вы можете сделать». Детский продукт без эмоций в empty — холодный.
- **Предлагаю.** Добавить опциональный `icon` (LucideIcon) и `cta` (label+href) в `EmptyState`. Для журнала: «Пока нет уроков → [+] Добавить урок». Для словаря: «Слова закончились — [Учить ошибки →]». Реф: Mailchimp, Slack — оба чемпиона по empty state.

##### 6. **Шрифтовая иерархия слабая на главной ученика**
- **Где.** `student/page.tsx` — h1 у hero `font-display text-3xl sm:text-4xl`, секционные заголовки тоже `text-3xl`. Разница есть только в bold. На разрешении 1280px h1 и h2 визуально равны.
- **Почему.** Modular scale (1.250 / minor third / Refactoring UI) хочет минимум 4 уровня: hero=36px, section=24-28px, card=18-20px, body=14-16px. Сейчас hero=section.
- **Предлагаю.** Hero: `text-4xl sm:text-5xl`. Section h2: `text-2xl sm:text-3xl`. Card titles: `text-lg`. Tracking уже хороший (`-0.02em`), не трогаем.

##### 7. **Sticky-колонка ФИО в журнале без нижней границы**
- **Где.** `teacher/journal/page.tsx` — sticky-первая колонка имеет `shadow` справа, что отлично, но при горизонтальном скролле строки разной высоты «прыгают» относительно sticky-столбца.
- **Предлагаю.** На всех `<tr>` зафиксировать `min-h-[44px]` (сразу и tap-target). Альтернатива — TanStack Table virtualisation, но это уже в роль 3.

#### 🟢 Полировка

##### 8. **`flame-pulse` анимация — частота 1.6s, slip от 60fps**
- **Где.** `globals.css:160-166`. На бюджетных Android `transform: scale(1.06)` запускает relayout, не GPU composite (потому что `filter: drop-shadow` не GPU-accelerated). Девочки на Redmi 9 могут увидеть рывки.
- **Предлагаю.** Заменить `filter: drop-shadow` на pseudo-element с box-shadow (GPU). Или просто `transform: scale + opacity` без filter.

##### 9. **Кнопка `gradient-text` для имён** работает только на hero
- **Где.** `globals.css:119-124`. Текст становится прозрачным на background-clip, но при `Ctrl+F` подсветка ломается (поиск ищет по computed text, но visual layer прозрачный).
- **Минор**, оставить.

##### 10. **Иконки от `lucide-react`** — стандартный 24px stroke 2. На некоторых страницах (sidebar, badge-чипы) они выглядят как 16px = stroke-2 непропорционально жирный.
- **Предлагаю.** В `lucide` API есть `strokeWidth={1.5}` для маленьких размеров. Применить точечно в sidebar.

### 🎨 Идеи для усиления

- **Аватары не имеют outline в тёмной теме.** В `student/feed/page.tsx` градиентный аватар сливается с тёмным фоном по краям — добавить `ring-1 ring-border/40` на dark.
- **Кнопка «Произнести» в парном диалоге** (`d26a4d0`) — это `<button>`, но визуально она маленький icon-button. Добавить заметный hover (scale 1.05, color shift) — иначе ребёнок не поймёт что это кликабельно.
- **Heatmap календаря стрика** — 53×7 квадратиков, при 1px зазоре на iPhone SE (320px wide) каждый квадрат = ~5px. Это **слишком мелко для тапа**. Либо горизонтальный скролл (как Github mobile), либо 7 столбцов × 4 ячейки на месяц = ~30×30px. Реф: Github mobile сделал именно так в 2022.
- **Сюжетки** — в текущем виде это длинный поскролл. UI как Instagram Stories (paginated tap-to-advance, прогресс-бар сверху) был бы намного нативнее для детей. Они **знают** этот паттерн без объяснений.

### 📐 Дизайн-токены к фиксации

Сейчас в `globals.css` есть только color tokens. Нет токенов для:
- **Spacing scale** (хотя через Tailwind есть, формализовать в дизайн-системе)
- **Type scale** (ссылка на `theme.fontSize` в `tailwind.config`?)
- **Animation timing** (нет дефолтных `--ease-out`, `--ease-spring`)
- **Elevation/Shadow** (есть `shadow-soft` и `shadow-glow`, но без определения высоты карточек 0/1/2/3)

Предлагаю добавить:
```css
:root {
  --tt-150: cubic-bezier(0.4, 0, 0.2, 1);
  --tt-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  --shadow-elev-1: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-elev-2: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-elev-3: 0 16px 32px rgba(0,0,0,0.12);
}
```

---

# 🛠️ Роль 3: Технарь-инженер

## Технический аудит

### 🐛 Баги и проблемы

#### 🔥 Критично (безопасность / данные)

##### 1. **`/api/auth/signup` принимает `role: "teacher"` от пользователя** — privilege escalation
- **Файл.** `src/app/api/auth/signup/route.ts:18-19`
  ```ts
  const role: "teacher" | "student" | "parent" =
    body.role === "teacher" ? "teacher" : body.role === "parent" ? "parent" : "student";
  ```
- **Что делает.** Любой человек с интернета может зарегистрироваться как **учитель** одним curl-ом, после чего получит доступ к `/teacher/*` (журнал всего класса, оценки, photo HW review, чат, рассылка).
- **Должно быть.** Только role: "student" | "parent" доступны для self-registration. Учительский аккаунт создаётся:
  - либо через `seed-methodical.mjs` / админ-CLI
  - либо через приглашение по email-ссылке от существующего админа
  - либо вручную через переменную `TEACHER_INVITE_CODES` в env

##### 2. **`/api/board/notes` — ноль auth-проверок**
- **Файл.** `src/app/api/board/notes/route.ts` — нет ни одного `auth()`.
- **GET, POST, DELETE** все открыты. Любой может прочитать чужие конспекты на доске, перезаписать или удалить их по `id`.
- **Должно быть.** Все три метода — `auth()` + `role === "teacher"`.

##### 3. **`/api/profile` POST — создаёт/правит любого student**
- **Файл.** `src/app/api/profile/route.ts:17-33`
- **Что делает.** Принимает `body.id` и пишет в DB. Можно одной командой выставить любому ученику XP=1000000, level=99, currentModule=8.
- **Должно быть.** `auth()` + проверка `session.user.id === body.id` или `session.user.role === "teacher"`.

##### 4. **`/api/journal/lessons` и `/api/journal/entries` — без auth**
- **Файлы.** `src/app/api/journal/lessons/route.ts` и `journal/entries/route.ts`.
- **Что можно.** GET — выгрузить весь журнал любого класса. POST — поставить любому ученику любую оценку и любое посещение. Это **прямой подделка оценок**.
- **Должно быть.** GET — `auth()` + role в (`teacher`, `parent` для своего ребёнка, `student` для своих entries). POST/DELETE — только `teacher`.

##### 5. **AI-эндпоинты публичны → cost vector**
- **Файлы.** `/api/ai/chat`, `/api/ai/generate-exercise`, `/api/ai/generate-test`, `/api/ai/generate-lesson`, `/api/ai/roleplay`, `/api/lessons/generate`, `/api/tts`, `/api/pronunciation`.
- **Что произойдёт.** Любой бот, нашедший хост, спамит запросы → ваш `GROQ_API_KEY`/`OPENAI_API_KEY`/`YANDEX_SPEECHKIT_API_KEY` сожжён за день. На Llama-3.3-70b цена ~$0.59/M токенов — дешёвый бот сожжёт $50 за час.
- **Должно быть.**
  - `auth()` обязателен на всех AI-эндпоинтах.
  - Rate-limit на user: 30 req/min (через `upstash/ratelimit` или in-memory map с TTL).
  - Daily quota на user: 200 AI-вызовов в день → дальше 429 с понятным текстом.

##### 6. **`/api/student/activity` POST принимает `studentId` из body, не из session**
- **Файл.** `src/app/api/student/activity/route.ts:47-51`
- **Что делает.** Любой залогиненный ученик может писать XP/streak/badges на счёт любого другого ученика. Например подкинуть конкуренту перфект-скор → система автопостит ему в ленту, а потом учитель спрашивает «как так сразу 50 ачивок?».
- **Должно быть.** `const session = await auth(); if (session.user.id !== body.studentId && session.user.role !== "teacher") return 403`.
- **Аналогично.** `/api/student/mistakes`, `/api/student/summary`, `/api/student/progress`, `/api/student/league` все принимают `studentId` без верификации.

##### 7. **Push subscription hijack**
- **Файл.** `src/lib/push.ts:51-59`
  ```sql
  ON CONFLICT(endpoint) DO UPDATE SET userId = excluded.userId
  ```
- **Что делает.** Если злоумышленник зарегистрирует подписку на тот же endpoint браузера, что и жертва (через UA spoof + украденный endpoint из логов), он перезапишет userId на свой → push-уведомления о фото-ДЗ уйдут к нему.
- **Должно быть.** На UPSERT либо игнорировать конфликт по endpoint+userId паре, либо отвергать с 409. Endpoint+keys пары — секрет.

##### 8. **`/api/errors` POST — кто угодно может писать в errors_log**
- **Файл.** `src/app/api/errors/route.ts`
- **Что произойдёт.** Спам в `errors_log` таблице, рост базы.
- **Должно быть.** `auth()` минимум; ещё лучше — rate limit и truncate тексту до 1KB.

#### ⚠️ Серьёзно (производительность / архитектура)

##### 9. **Photo HW хранит base64 data URL в SQLite TEXT**
- **Файл.** `src/lib/photo-hw-db.ts` (хранение image как `data:image/jpeg;base64,...`).
- **Проблема.**
  - 4MB фото → ~5.4MB в base64 → 5.4MB в SQLite TEXT. 100 учеников × 1 фото/день = 540MB/день в БД.
  - SELECT с `imageData` тянет весь base64 в память Node, парсит в строку. Если страница `/teacher/homework/photo` грузит 50 фото — это 270MB в памяти.
- **Должно быть.** Сохранять файлы в `public/uploads/<id>.jpg` или (правильно) в S3-совместимое хранилище. В DB только meta + URL. `stripImageData()` маскирует проблему, но не решает её для writes/queries.

##### 10. **`feed-bus.ts` in-memory pub/sub не масштабируется**
- **Файл.** `src/lib/feed-bus.ts` — комментарий честно говорит «for now the dev box and tiny prod runs comfortably». ОК для одного Node-процесса.
- **Но!** На Vercel/Cloudflare/Fly с >1 instance — события публикуются на одной инстансе, подписчики на другой никогда не получают. SSE окажется «навсегда тихим» для половины пользователей.
- **Должно быть.**
  - Для Vercel: уже не сработает (serverless functions stateless). Нужен Pusher/Ably/Soketi, либо переход на polling.
  - Для self-hosted с фиксированным количеством инстансов: Redis pub/sub (`ioredis` + `subscribe/publish`) — 30 строк замены.

##### 11. **SQLite в `process.cwd()/data/spotlight.db` не работает на Vercel**
- **Файл.** `src/lib/db.ts:11-14`. Vercel filesystem read-only.
- **Должно быть.** Либо перевести на Turso (https://turso.tech, libsql-совместимо с better-sqlite3 API), либо PlanetScale/Neon, либо хост на Fly.io/Railway где есть persistent volume.

##### 12. **`seedDemoIfEmpty()` вызывается на каждом GET профиля/журнала**
- **Файл.** `src/app/api/profile/route.ts:8`, `journal/lessons/route.ts:14`, и др.
- **Проблема.** Функция проверяет пустоту таблицы каждый раз → лишний SELECT COUNT(*) на каждый GET. Не критично сейчас, но при росте БД — ненужная I/O.
- **Должно быть.** Один раз на старте сервера, через `getDb()` lazy init.

##### 13. **Type assertion `as any` в catch — теряем тип ошибки**
- **Файлы.** `src/app/api/ai/generate-exercise/route.ts:46`, `src/app/api/ai/chat/route.ts:18` и др.
  ```ts
  } catch (e: any) {
    if (e?.message === "NO_LLM_KEY") ...
  ```
- **Должно быть.** `catch (e: unknown) { if (e instanceof Error && e.message === "NO_LLM_KEY") ... }`. Это не «стилистика», это TypeScript strict, и `any` тут проникает в фоллбэк-логику.

##### 14. **Отсутствие zod / runtime-validation на API bodies**
- Все эндпоинты делают `as unknown as MyType` — runtime валидации нет. Запрос с `xp: "drop table users"` уйдёт в SQL prepared (там безопасно), но кривые типы попадают в DB и вызывают edge-кейсы в UI.
- **Должно быть.** `zod` + `safeParse` минимум на 5 крупнейших эндпоинтов (signup, activity, journal entries, photo HW POST, board POST).

##### 15. **`process.cwd()` для SQLite + `next dev` — race на первом запросе**
- При параллельных GET к разным API первый вызов `getDb()` создаёт дир и БД, остальные могут попасть в момент когда `_db` ещё `null`. Текущая `if (_db) return _db` race-prone (хотя SQLite сама thread-safe в WAL).
- **Минор**, в проде запускается один процесс — не воспроизводится.

#### 💡 Можно лучше (DX / стиль)

##### 16. **Нет CI**
- Грепнул `.github/workflows` — пусто. Каждый раз `npm run lint && tsc` руками. На прод-ветку любой коммит вмерживается без проверок.
- **Минимум.** Один GH Actions workflow на push → `npm ci && npm run lint && npx tsc --noEmit && npm run build`.

##### 17. **Нет тестов**
- 0 unit-тестов, 0 e2e. Для проекта с 207 ts/tsx файлами и сложной логикой XP/SRS/badge unlock это рискованно.
- **Что покрывать первой волной (Vitest):**
  - `src/lib/sr.ts` — SM-2 schedule (8-10 тестов: again resets, easy bumps EF, etc.)
  - `src/lib/badges.ts` — unlock conditions
  - `src/lib/activity-db.ts:recordActivity` — XP/level расчёт, streak логика
  - `src/lib/cosmetics.ts` — unlocked-by-level
- **E2E (Playwright) можно отложить**, важнее unit на лёгких чистых функциях.

##### 18. **`useEffect` в `student/page.tsx:67` срабатывает при каждом изменении student** — окей, но fetch без AbortController
- **Файл.** `student/page.tsx:71-87`. При быстрой смене ученика (Login → теч → Login) запрос завершится после mount нового и запишется в state, который relevant. Cancelled-флаг есть, но без AbortController — сам запрос не прерывается.
- **Минор**, добавить `AbortController` для чистоты.

##### 19. **`Math.random()` для генерации id и PIN**
- **Файлы.** `src/lib/utils.ts:uid`, `src/auth.ts:78`, и др.
- Для PIN квиза `crypto.randomInt` (Node) или `crypto.getRandomValues` (web) — криптографически сильный и нет коллизий. `Math.random()` + slice — может дать дубль.
- **Минор**, но реален: при 100 одновременных активных квизах вероятность коллизии 6-знач PIN ~ 0.1%.

##### 20. **Дублирующие импорты от `lucide-react` в крупных страницах**
- Например `student/page.tsx:6-23` — 17 иконок одним import. ОК, но bundle-size impact: ~3-5KB на каждый. На главной норм. Но в total — десятки КБ extra.
- **Минор**, можно рассмотреть `lucide-react/dist/esm/icons/*` точечно или next.js `optimizePackageImports`.

### 📦 Инструменты под задачу

| Задача | Что использовать | Почему |
|---|---|---|
| Runtime validation | `zod` (~12KB gzip) | Идиоматично с TypeScript, схема + parsing в одном |
| Rate limiting | `@upstash/ratelimit` + Upstash Redis или in-memory `lru-cache` | Быстрый старт, distributed-ready |
| SQLite в проде | Turso (libSQL) или хост на Fly.io с volume | Реально работает в serverless |
| Realtime SSE multi-instance | Pusher Channels (free tier 100 подпис) или Ably | Замена in-memory bus за 30 строк |
| Error tracking | Sentry (free tier 5K events) | Найти все 500 в проде |
| Тесты | Vitest + @testing-library/react | Native ESM, быстрый, совместим с Next |
| CI | GitHub Actions: lint + tsc + build + Vitest | Дефолтный bare-minimum |
| Image storage для photo HW | Vercel Blob или Cloudflare R2 (free tier 10GB) | Не сжирает SQLite |

### 🏗️ Архитектурные замечания

- **`src/lib/db.ts` — 1001 строка, бог-объект.** Все таблицы, все queries, все типы. Растёт он линейно при каждой новой фиче. Стоит разнести на модули по доменам:
  ```
  src/lib/db/
    init.ts          (CREATE TABLE, getDb)
    students.ts      (listStudents, upsertStudent, ...)
    journal.ts       (listLessons, upsertEntry, ...)
    homework.ts
    cosmetics.ts
    push.ts
    quiz.ts          (вынести из quiz-db.ts сюда)
  ```
  Сейчас уже половина уже отдельно (`activity-db`, `feed-db`, `cosmetics-db`...) — но db.ts всё ещё центральный. Доделать декомпозицию.

- **`runtime = "nodejs"`** прописан в каждом route.ts — норма для better-sqlite3, но если когда-нибудь будете мигрировать на Edge — потребуется global find-replace. Стоит вынести в общий `app/api/route-config.ts` (если Next когда-то это поддержит).

- **SSE-каналы (feed, quiz, classes/chat) — три разных bus-а в `*-bus.ts`.** Дублируют логику. Можно вытащить общий `src/lib/sse-bus.ts<TEvent>` generic.

### ⚡ Производительность

- **Bundle size.** Не измерял, но `tldraw` (~500KB) + `lucide-react` (полный) + `next-auth` + `groq-sdk` + `openai` + `anthropic` + `gemini` — это 2-3MB JS. Для десктопа ОК, для 3G мобайла — 10+ сек до первого экрана.
  - Динамический импорт SDK (уже сделано в `lib/llm.ts:58, 76, 92, 108` через `await import(...)`) — отлично.
  - tldraw уже dynamic-imported в `teacher/board/page.tsx`?
  - lucide-react: `next.config.js` → `experimental.optimizePackageImports: ['lucide-react']` срежет 80%.
- **Render performance.** На главной ученика всё ок (мало DOM). На `/teacher/journal` при классе из 30 учеников × 50 уроков — это 1500 ячеек таблицы без virtualisation. На бюджетных Android может тормозить input.
- **Network.** SSE 3 канала параллельно (feed + class chat + quiz) — ОК, но если на одной странице открыты несколько — `EventSource` автоматически keep-alive по одному соединению на origin? **Нет, SSE != HTTP/2 multiplex по умолчанию.** На HTTP/1.1 это 3 TCP. На HTTP/2 — мерж.

### 🧪 Тестирование

**Что покрыть в первую очередь:**
- ✅ Unit: `sr.ts schedule()` — 100% веток (again/hard/good/easy × reps 0/1/2+).
- ✅ Unit: `cosmetics.ts unlocked()` — что аватар g8 не открыт игроку g3, etc.
- ✅ Unit: `activity-db recordActivity()` — XP, level-up, streak логика.
- ✅ API: `/api/student/activity` POST — заглушка БД, проверка что 400 на bad input.
- ⏸ E2E: оставить на потом — нет CI.

**Что не критично пока:**
- UI snapshot tests — слишком много фронта, ROI низкий.
- Visual regression — не для MVP.

### ✅ Чек-лист перед мержем (до объявления «готово»)

- [ ] **🔥** `/api/auth/signup` запрещает self-registration как `teacher`.
- [ ] **🔥** Все AI-эндпоинты требуют `auth()`.
- [ ] **🔥** Все student-эндпоинты сравнивают `session.user.id` с переданным `studentId` (либо разрешают учителю с проверкой принадлежности класса).
- [ ] **🔥** `/api/board/notes` и `/api/journal/*` требуют `auth()` + role.
- [ ] **🔥** Rate-limiter на AI/TTS/pronunciation эндпоинты.
- [ ] **⚠️** Photo HW: storage переехал из base64 SQLite в файловый/S3.
- [ ] **⚠️** Zod-валидация на 5 крупнейших эндпоинтах.
- [ ] **⚠️** Решение по prod-БД: Turso или Fly volume.
- [ ] **💡** GH Actions CI: lint + tsc + build на push.
- [ ] **💡** Vitest: 4 базовых unit-теста (sr.ts, badges, activity, cosmetics).

---

# 🤝 Конфликты ролей и приоритизация

| Конфликт | Чьё мнение приоритетнее | Почему |
|---|---|---|
| Методист хочет 5 stories/класс — Технарь говорит «увеличит bundle» | Методист | Stories = JSON в `stories.ts`, на бандл влияет минимально (10KB). Tree-shake по grade при необходимости. |
| Дизайнер хочет skeleton loaders везде — Технарь говорит «лишний код, спиннера хватает» | Дизайнер | Skeleton ~10 строк, перцептивный win 30%. ROI положительный. |
| Дизайнер хочет 44px tap-target — Технарь говорит «компактнее красивее на десктопе» | Дизайнер | WCAG AA нерушим для образовательного продукта с младшими классами. На десктопе h-9 (36) выглядит так же красиво как h-8 (32). |
| Методист хочет Listening exercise — Дизайнер говорит «ещё одна страница в меню = перегруз» | Методист | 4 навыка обязательны для CEFR/ФГОС. Дизайнер делает ещё один аккуратный вход в меню «Аудирование» — это <1ч работы. |

---

# 🎯 Финальная рекомендация

**Что делать в ближайший спринт (по убыванию ценности/риска):**

1. **🔥 Безопасность (День 1, обязательно перед публичным запуском):** добавить `auth()` на все 12 уязвимых эндпоинтов, исправить signup-role, поставить rate-limiter (хотя бы in-memory).
2. **🔥 IPA для словаря (День 2):** скрипт CMU dict → conversion → 518 транскрипций.
3. **⚠️ Listening exercise + страница (День 3):** один новый ExerciseType + страница `/student/listening`.
4. **⚠️ Stories до 35 шт (День 4-5):** 26 новых сюжеток. Можно генерить через AI с ручной вычиткой методистом.
5. **⚠️ Quiz: 4 формата вопросов (День 6):** patch `quiz-db.ts:generateVocabQuestions`.
6. **💡 CI (День 6):** GH Actions yml.
7. **💡 Vitest на 4 модуля (День 7):** sr/badges/activity/cosmetics.
8. **💡 Skeleton loaders (День 7):** заменить в 5-7 ключевых местах.

**Что отложить на следующий проект:**
- Perfect tap-target = 44px по всему UI (системная переделка дизайн-системы).
- Photo HW в S3 (нужна инфраструктура).
- Multi-instance SSE (нужен Redis/Pusher).
- Полная test-coverage (только когда будут пользователи).

---

*Документ обновляется при каждом следующем аудите. Последний прогон: коммит `844e791`, 27.04.2026.*
