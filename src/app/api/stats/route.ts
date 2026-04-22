import { NextResponse } from "next/server";
import { globalStats, seedDemoIfEmpty } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  seedDemoIfEmpty();
  return NextResponse.json(globalStats());
}
