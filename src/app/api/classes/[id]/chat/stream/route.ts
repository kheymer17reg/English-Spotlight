import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { subscribeClassChat, type ClassChatEvent } from "@/lib/class-chat-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;

function isMember(userId: string, classId: string): boolean {
  const db = getDb();
  const row = db
    .prepare(`SELECT 1 FROM group_members WHERE groupId = ? AND userId = ? LIMIT 1`)
    .get(classId, userId) as { 1?: number } | undefined;
  return Boolean(row);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("unauthorized", { status: 401 });
  if (!isMember(session.user.id, params.id)) {
    return new Response("forbidden", { status: 403 });
  }
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: ClassChatEvent | { type: "ping" }) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          /* ignore */
        }
      };
      send({ type: "ping" });
      const unsub = subscribeClassChat(params.id, (event) => send(event));
      const hb = setInterval(() => send({ type: "ping" }), HEARTBEAT_MS);
      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(hb);
        try {
          unsub();
        } catch {
          /* ignore */
        }
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      };
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
