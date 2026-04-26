import { NextResponse } from "next/server";
import { PAIR_SCENARIOS } from "@/lib/pair-prompts";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ scenarios: PAIR_SCENARIOS });
}
