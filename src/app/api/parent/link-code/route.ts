import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findUserById } from "@/lib/db";
import { getOrCreateLinkCode } from "@/lib/parent-db";

export const runtime = "nodejs";

/**
 * Returns the student's parent-link code. Called from the student-side profile.
 * The student is identified by `users.studentId` of the signed-in user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = findUserById(session.user.id);
  if (!user?.studentId) {
    return NextResponse.json({ error: "Сначала создай учебный профиль" }, { status: 400 });
  }
  const code = getOrCreateLinkCode(user.studentId);
  if (!code) return NextResponse.json({ error: "Не удалось получить код" }, { status: 500 });
  return NextResponse.json({ code });
}
