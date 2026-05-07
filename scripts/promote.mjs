#!/usr/bin/env node
// Promote scripts/out/*.json into src/lib/readings.ts + src/lib/dialogues.ts.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "out");
const LIB = path.join(__dirname, "..", "src", "lib");

const readings = JSON.parse(await fs.readFile(path.join(OUT, "readings.json"), "utf8"));
const dialogues = JSON.parse(await fs.readFile(path.join(OUT, "dialogues.json"), "utf8"));

function stringify(obj) {
  return JSON.stringify(obj, null, 2)
    .replace(/\u2028/g, " ")
    .replace(/\u2029/g, " ");
}

const readingsTs = `import type { ReadingText } from "@/types";

// Auto-generated + curated Spotlight reading bank (7 grades × ~8 texts).
// Generated via scripts/gen-content.mjs then promoted by scripts/promote.mjs.
// Safe to hand-edit: next run will append/regenerate but will not touch ids that already exist.
export const READINGS: ReadingText[] = ${stringify(readings)} as ReadingText[];

export function readingsByGrade(grade: number): ReadingText[] {
  return READINGS.filter((r) => r.grade === grade);
}

export function readingById(id: string): ReadingText | undefined {
  return READINGS.find((r) => r.id === id);
}
`;

const dialoguesTs = `import type { Dialogue } from "@/types";

// Auto-generated Spotlight dialogue bank (7 grades × ~4 dialogues).
// Generated via scripts/gen-content.mjs then promoted by scripts/promote.mjs.
export const DIALOGUES: Dialogue[] = ${stringify(dialogues)} as Dialogue[];

export function dialoguesByGrade(grade: number): Dialogue[] {
  return DIALOGUES.filter((d) => d.grade === grade);
}

export function dialogueById(id: string): Dialogue | undefined {
  return DIALOGUES.find((d) => d.id === id);
}
`;

await fs.writeFile(path.join(LIB, "readings.ts"), readingsTs, "utf8");
await fs.writeFile(path.join(LIB, "dialogues.ts"), dialoguesTs, "utf8");
console.log(`Promoted ${readings.length} readings, ${dialogues.length} dialogues.`);
