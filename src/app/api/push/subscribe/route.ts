import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteSubscription, isPushConfigured, saveSubscription, sendToUser } from "@/lib/push";
import { logError } from "@/lib/db";

export const runtime = "nodejs";

interface SubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!isPushConfigured()) {
      return NextResponse.json({ error: "push not configured" }, { status: 503 });
    }
    const body = (await req.json().catch(() => null)) as SubscribeBody | null;
    if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ error: "bad subscription" }, { status: 400 });
    }
    saveSubscription({
      endpoint: body.endpoint,
      userId: session.user.id,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent ?? null,
    });
    // Send a quick welcome ping so the user immediately sees push works.
    await sendToUser(session.user.id, {
      title: "Spotlight",
      body: "Уведомления включены. Будем напоминать о стрике и новых заданиях.",
      url: "/student",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    await logError("/api/push/subscribe", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
    if (!body?.endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    deleteSubscription(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    await logError("/api/push/subscribe DELETE", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
