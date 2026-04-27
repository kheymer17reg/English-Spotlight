import { NextResponse } from "next/server";
import { PAIR_SCENARIOS } from "@/lib/pair-prompts";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  return NextResponse.json({ scenarios: PAIR_SCENARIOS });
}

