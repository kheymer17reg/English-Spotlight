import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createRoom } from "@/lib/pair-roleplay-db";
import { getScenario } from "@/lib/pair-prompts";
import type { Grade } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    scenarioId?: string;
    grade?: Grade;
  };
  const scenario = getScenario(body.scenarioId ?? "");
  if (!scenario) {
    return NextResponse.json({ error: "Сценарий не найден" }, { status: 400 });
  }
  const grade = (body.grade ?? scenario.minGrade) as Grade;
  if (grade < 2 || grade > 8) {
    return NextResponse.json({ error: "grade must be 2..8" }, { status: 400 });
  }
  const room = createRoom({
    scenario: `${scenario.id}:${scenario.title}`,
    grade,
    roleA: scenario.roleA,
    roleB: scenario.roleB,
    slotAUserId: session.user.id,
  });
  return NextResponse.json({ ok: true, room });
}
