import { NextResponse } from "next/server";
import { buildLeague } from "@/lib/league-db";
import { logError } from "@/lib/db";
import { requireOwnStudentOrTeacher } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }
    const own = await requireOwnStudentOrTeacher(studentId);
    if (!own.ok) return own.response;
    return NextResponse.json(buildLeague(studentId));
  } catch (err) {
    await logError("/api/student/league", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
