import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { subscribeFeed, type FeedEvent } from "@/lib/feed-bus";

export const runtime = "nodejs";
// Keep the connection open indefinitely (Next clamps to ~60s on Edge but
// nodejs runtime allows long-lived streams).
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;

function userBelongsToClass(userId: string, classId: string): boolean {
  const db = getDb();
  const row = db
    .prepare(`SELECT 1 FROM group_members WHERE groupId = ? AND userId = ? LIMIT 1`)
    .get(classId, userId) as { 1?: number } | undefined;
  return Boolean(row);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("unauthorized", { status: 401 });
  }
  const url = new URL(req.url);
  const classId = url.searchParams.get("classId");
  if (!classId) {
    return new Response("classId required", { status: 400 });
  }
  if (!userBelongsToClass(session.user.id, classId)) {
    return new Response("forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: FeedEvent | { type: "ping" }) => {
        if (closed) return;
        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream may be closed mid-flight — swallow.
        }
      };

      // Initial hello so EventSource resolves quickly.
      send({ type: "ping" });

      const unsub = subscribeFeed(classId, (event) => send(event));

      const heartbeat = setInterval(() => send({ type: "ping" }), HEARTBEAT_MS);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
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

      // Abort on client disconnect.
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
