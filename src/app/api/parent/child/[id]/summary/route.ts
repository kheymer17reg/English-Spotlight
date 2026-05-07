import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isParentOfStudent } from "@/lib/parent-db";

export const runtime = "nodejs";

/**
 * Parent-scoped proxy to /api/student/summary. Verifies that the signed-in
 * parent is bound to the requested child before returning data.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "parent") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!isParentOfStudent(session.user.id, params.id)) {
    return NextResponse.json({ error: "Этот ребёнок не привязан к вашему профилю" }, { status: 403 });
  }
  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "month";
  // Build the absolute URL of the underlying summary endpoint.
  const target = new URL(req.url);
  target.pathname = `/api/student/summary`;
  target.search = `?id=${encodeURIComponent(params.id)}&period=${encodeURIComponent(period)}`;
  const res = await fetch(target.toString(), {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
