import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/quiz-db";
import { subscribeQuiz, type QuizEvent } from "@/lib/quiz-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("unauthorized", { status: 401 });
  const s = getSession(params.id);
  if (!s) return new Response("not found", { status: 404 });
  const db = getDb();
  const isPlayer = db
    .prepare(`SELECT 1 FROM quiz_players WHERE sessionId = ? AND userId = ? LIMIT 1`)
    .get(params.id, session.user.id);
  if (s.hostId !== session.user.id && !isPlayer) {
    return new Response("forbidden", { status: 403 });
  }
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: QuizEvent | { type: "ping" }) => {
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
      const unsub = subscribeQuiz(params.id, (event) => send(event));
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
