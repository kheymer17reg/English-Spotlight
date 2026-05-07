import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listChildren } from "@/lib/parent-db";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "parent") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ children: listChildren(session.user.id) });
}
