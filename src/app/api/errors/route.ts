import { NextResponse } from "next/server";
import { logError } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { where?: string; message?: string };
  logError(body.where || "client", body.message || "unknown");
  return NextResponse.json({ ok: true });
}
