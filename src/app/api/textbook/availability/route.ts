/**
 * Reports which textbook PDFs are physically present on disk under
 * `public/textbooks/grade-N/`. The PDFs are not committed to git (copyright),
 * so the UI uses this to hide buttons whose target file isn't on the
 * teacher's machine.
 */
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Grade } from "@/types";
import { textbookForGrade } from "@/lib/textbook";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const gradeRaw = Number(url.searchParams.get("grade"));
  if (!Number.isFinite(gradeRaw) || gradeRaw < 2 || gradeRaw > 11) {
    return NextResponse.json({ error: "bad_grade" }, { status: 400 });
  }
  const grade = gradeRaw as Grade;
  const tb = textbookForGrade(grade);
  if (!tb) {
    return NextResponse.json({ grade, files: {} });
  }

  const files: Record<string, { url: string; label: string; short: string; exists: boolean }> = {};
  const root = path.join(process.cwd(), "public");
  for (const [key, file] of Object.entries(tb.files)) {
    if (!file) continue;
    const fsPath = path.join(root, file.url.replace(/^\//, ""));
    let exists = false;
    try {
      const st = await fs.stat(fsPath);
      exists = st.isFile() && st.size > 1024; // ignore stub/empty files
    } catch {
      exists = false;
    }
    files[key] = { url: file.url, label: file.label, short: file.short, exists };
  }

  return NextResponse.json({ grade, files });
}
