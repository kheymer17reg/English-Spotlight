import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteChatMessage } from "@/lib/class-chat-db";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; messageId: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const messageId = Number(params.messageId);
  if (!messageId) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const ok = deleteChatMessage(messageId, session.user.id);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}
