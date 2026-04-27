import { NextResponse } from "next/server";
import { globalStats, seedDemoIfEmpty } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole("teacher");
  if (!guard.ok) return guard.response;
  seedDemoIfEmpty();
  return NextResponse.json(globalStats());
}
