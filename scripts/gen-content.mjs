#!/usr/bin/env node
// Content generator for readings + dialogues using Groq llama-3.3-70b-versatile.
// Usage:  GROQ_API_KEY=... node scripts/gen-content.mjs
// Writes JSON to scripts/out/{readings,dialogues}.json — promoted manually
// into src/lib/readings.ts / src/lib/dialogues.ts.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "out");

const KEY = process.env.GROQ_API_KEY;
if (!KEY) {
  console.error("Missing GROQ_API_KEY");
  process.exit(1);
}
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// ---- curriculum (mirror of src/lib/curriculum.ts) -------------------------
const CURRICULUM = [
  { grade: 2, number: 1, title: "My Home", topics: ["Дом и комната", "Члены семьи"], level: "A1", vocabulary: ["bedroom","kitchen","bathroom","garden","dining room"] },
  { grade: 2, number: 2, title: "My Birthday", topics: ["День рождения","Цифры 1-10","Еда"], level: "A1", vocabulary: ["cake","candles","ice cream","chocolate","lemonade"] },
  { grade: 2, number: 3, title: "My Animals", topics: ["Любимые животные","Способности"], level: "A1", vocabulary: ["fish","bird","frog","horse","chimp"] },
  { grade: 2, number: 4, title: "My Toys", topics: ["Игрушки","Предлоги места"], level: "A1", vocabulary: ["teddy bear","toy soldier","ballerina","shelf","musical box"] },

  { grade: 3, number: 1, title: "School Days", topics: ["Школьные предметы","Правила школы"], level: "A1", vocabulary: ["Maths","English","PE","Science","Art"] },
  { grade: 3, number: 2, title: "Family Moments", topics: ["Семья","Чувства и эмоции"], level: "A1", vocabulary: ["grandma","grandpa","cousin","uncle","aunt"] },
  { grade: 3, number: 3, title: "All the Things I Like!", topics: ["Еда и напитки","Предпочтения"], level: "A1", vocabulary: ["pasta","rice","meat","fish","vegetables"] },
  { grade: 3, number: 4, title: "Come In and Play!", topics: ["Игрушки дома","Комнаты"], level: "A1", vocabulary: ["doll","plane","train","musical box","rocking horse"] },

  { grade: 4, number: 1, title: "Back Together", topics: ["Внешность","Друзья"], level: "A1", vocabulary: ["tall","short","funny","kind","shy"] },
  { grade: 4, number: 2, title: "Working Day", topics: ["Профессии","Время суток"], level: "A2", vocabulary: ["doctor","dentist","farmer","waiter","mechanic"] },
  { grade: 4, number: 3, title: "Tasty Treats", topics: ["Еда","Рецепты"], level: "A2", vocabulary: ["bread","butter","cheese","honey","lemonade"] },
  { grade: 4, number: 4, title: "At the Zoo", topics: ["Животные","Характер"], level: "A2", vocabulary: ["lion","elephant","giraffe","peacock","seal"] },

  { grade: 5, number: 1, title: "School Days", topics: ["Школа","Расписание"], level: "A2", vocabulary: ["timetable","schoolbag","pupil","headmaster","subject"] },
  { grade: 5, number: 2, title: "That's Me!", topics: ["Личная информация","Страны"], level: "A2", vocabulary: ["Russia","Britain","Spain","passport","nationality"] },
  { grade: 5, number: 3, title: "My Home, My Castle", topics: ["Дом","Мебель"], level: "A2", vocabulary: ["armchair","carpet","fridge","mirror","wardrobe"] },
  { grade: 5, number: 4, title: "Family Ties", topics: ["Семья","Описание людей"], level: "A2", vocabulary: ["brave","clever","kind","noisy","patient"] },

  { grade: 6, number: 1, title: "Who's Who?", topics: ["Знакомства","Документы"], level: "A2", vocabulary: ["ID card","nickname","address","postcode","signature"] },
  { grade: 6, number: 2, title: "Here We Are", topics: ["Время","Месяцы и даты"], level: "A2", vocabulary: ["calendar","celebration","month","season","festival"] },
  { grade: 6, number: 3, title: "Getting Around", topics: ["Транспорт","Направления"], level: "A2", vocabulary: ["traffic lights","underground","ticket","platform","map"] },
  { grade: 6, number: 4, title: "Day After Day", topics: ["Распорядок дня","Хобби"], level: "A2", vocabulary: ["routine","hobby","magazine","weekend","talent"] },

  { grade: 7, number: 1, title: "Lifestyles", topics: ["Город и деревня","Досуг"], level: "B1", vocabulary: ["noisy","peaceful","rush","landmark","neighbourhood"] },
  { grade: 7, number: 2, title: "Tale Time", topics: ["Литература","Приключения"], level: "B1", vocabulary: ["character","villain","adventure","chapter","plot"] },
  { grade: 7, number: 3, title: "Profiles", topics: ["Портрет человека","Черты характера"], level: "B1", vocabulary: ["ambitious","polite","confident","modest","creative"] },
  { grade: 7, number: 4, title: "In the News", topics: ["Новости и СМИ","Погода"], level: "B1", vocabulary: ["headline","journalist","broadcast","forecast","flood"] },

  { grade: 8, number: 1, title: "Socialising", topics: ["Общение","Путешествия"], level: "B1", vocabulary: ["introduction","gesture","accent","rude","manners"] },
  { grade: 8, number: 2, title: "Food & Shopping", topics: ["Покупки","Еда"], level: "B1", vocabulary: ["bargain","receipt","refund","customer","queue"] },
  { grade: 8, number: 3, title: "Great Minds", topics: ["Изобретения","Наука"], level: "B1", vocabulary: ["invention","scientist","device","experiment","discovery"] },
  { grade: 8, number: 4, title: "Be Yourself", topics: ["Внешний вид","Самооценка"], level: "B1", vocabulary: ["appearance","confidence","fashion","self-esteem","wardrobe"] },
];

// ---- groq chat helper -----------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function groqChat({ system, user, maxTokens = 1500, temperature = 0.6 }) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (res.status === 429) {
      // Respect rate limit. Groq returns Retry-After or tells us inside the body.
      const t = await res.text();
      const m = t.match(/try again in ([0-9.]+)s/);
      const wait = m ? Math.ceil(Number(m[1]) * 1000) + 500 : 8000;
      console.log(`  429, waiting ${wait}ms (attempt ${attempt + 1}/6)`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Groq ${res.status}: ${t.slice(0, 500)}`);
    }
    const data = await res.json();
    const txt = data?.choices?.[0]?.message?.content ?? "";
    try { return JSON.parse(txt); }
    catch (e) { throw new Error(`Bad JSON: ${txt.slice(0, 300)}`); }
  }
  throw new Error("Groq 429: gave up after 6 retries");
}

// ---- prompts --------------------------------------------------------------
function readingPrompt(m, variant) {
  const lenTarget = m.level === "A1" ? "50-80" : m.level === "A2" ? "90-130" : "140-200";
  const personas = [
    "a student character slice-of-life vignette",
    "a travel/adventure snippet set in the UK or Russia",
    "a family-life moment with emotional warmth",
  ];
  return [
    `You are generating reading material for Spotlight grade ${m.grade}, module "${m.title}" (topics: ${m.topics.join(", ")}), CEFR ${m.level}.`,
    `Style: ${personas[variant % personas.length]}.`,
    `Length: ${lenTarget} words.`,
    `Vocabulary hint — weave in naturally at least 3 of these: ${m.vocabulary.join(", ")}.`,
    `Return STRICT JSON, no prose around it:`,
    `{`,
    `  "title": "short engaging English title",`,
    `  "text": "the reading passage in English, 2-4 short paragraphs separated by \\n",`,
    `  "glossary": [ { "word": "English word or phrase from the text", "translation": "Russian translation" }, ... 4-6 items ],`,
    `  "questions": [ { "q": "comprehension question in English", "a": "short English answer" }, ... 3 items ]`,
    `}`,
  ].join("\n");
}

function dialoguePrompt(m, variant) {
  const settings = [
    "at school between two pupils",
    "at home between a child and a parent",
  ];
  const linesTarget = m.level === "A1" ? "8-10" : m.level === "A2" ? "10-12" : "12-16";
  return [
    `You are generating a classroom DIALOGUE for Spotlight grade ${m.grade}, module "${m.title}" (topics: ${m.topics.join(", ")}), CEFR ${m.level}.`,
    `Setting: ${settings[variant % settings.length]}.`,
    `Total lines: ${linesTarget}. Both speakers must speak roughly equal amounts.`,
    `Include natural everyday English, age-appropriate, no slang kids wouldn't hear.`,
    `Vocabulary hint — use at least 3 of: ${m.vocabulary.join(", ")}.`,
    `Return STRICT JSON:`,
    `{`,
    `  "title": "short engaging title in English",`,
    `  "speakerA": "name of speaker A (English first name)",`,
    `  "speakerB": "name of speaker B",`,
    `  "summary": "one-sentence Russian summary of what this dialogue is about",`,
    `  "lines": [ { "speaker": "A", "text": "English line" }, { "speaker": "B", "text": "English line" }, ... ],`,
    `  "glossary": [ { "word": "phrase from dialogue", "translation": "Russian translation" }, ... 4-6 items ],`,
    `  "questions": [ { "q": "English question about the dialogue", "a": "short English answer" }, ... 3 items ]`,
    `}`,
  ].join("\n");
}

// ---- main -----------------------------------------------------------------
const READINGS_PER_MODULE = Number(process.env.READINGS_PER_MODULE || 1);
const DIALOGUES_PER_MODULE = Number(process.env.DIALOGUES_PER_MODULE || 1);

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const readings = [];
  const dialogues = [];

  let done = 0;
  const total = CURRICULUM.length * (READINGS_PER_MODULE + DIALOGUES_PER_MODULE);

  for (const m of CURRICULUM) {
    for (let v = 0; v < READINGS_PER_MODULE; v++) {
      const key = `r-g${m.grade}-m${m.number}-v${v + 1}`;
      console.log(`[${++done}/${total}] reading ${key}`);
      try {
        const j = await groqChat({
          system: "You write clean JSON for school English learners. Always respect length and CEFR level. Never include any text outside JSON.",
          user: readingPrompt(m, v),
        });
        readings.push({
          id: key,
          grade: m.grade,
          module: m.number,
          title: String(j.title || "").slice(0, 120),
          level: m.level,
          text: String(j.text || "").trim(),
          glossary: Array.isArray(j.glossary) ? j.glossary.slice(0, 8) : [],
          questions: Array.isArray(j.questions) ? j.questions.slice(0, 4) : [],
        });
        await fs.writeFile(path.join(OUT_DIR, "readings.json"), JSON.stringify(readings, null, 2));
      } catch (e) {
        console.error(`  failed: ${e.message}`);
      }
    }
    for (let v = 0; v < DIALOGUES_PER_MODULE; v++) {
      const key = `d-g${m.grade}-m${m.number}-v${v + 1}`;
      console.log(`[${++done}/${total}] dialogue ${key}`);
      try {
        const j = await groqChat({
          system: "You write clean JSON classroom dialogues. Keep lines short, natural, CEFR-appropriate. Never include any text outside JSON.",
          user: dialoguePrompt(m, v),
        });
        dialogues.push({
          id: key,
          grade: m.grade,
          module: m.number,
          title: String(j.title || "").slice(0, 120),
          level: m.level,
          speakerA: String(j.speakerA || "Alex"),
          speakerB: String(j.speakerB || "Jamie"),
          summary: String(j.summary || ""),
          lines: Array.isArray(j.lines) ? j.lines : [],
          glossary: Array.isArray(j.glossary) ? j.glossary.slice(0, 8) : [],
          questions: Array.isArray(j.questions) ? j.questions.slice(0, 4) : [],
        });
        await fs.writeFile(path.join(OUT_DIR, "dialogues.json"), JSON.stringify(dialogues, null, 2));
      } catch (e) {
        console.error(`  failed: ${e.message}`);
      }
    }
  }

  console.log(`\nDone. ${readings.length} readings, ${dialogues.length} dialogues.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
