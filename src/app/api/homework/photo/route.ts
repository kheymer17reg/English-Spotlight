import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  attachAiResult,
  createPhotoSubmission,
  listForStudent,
  stripImageData,
} from "@/lib/photo-hw-db";
import { visionGrade } from "@/lib/photo-hw-vision";
import { logError, groupMembers } from "@/lib/db";
import { sendToUsers } from "@/lib/push";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = listForStudent(session.user.id).map(stripImageData);
  return NextResponse.json({ submissions: rows });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "image required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "image too large (>4MB)" }, { status: 413 });
    }
    const mime = file.type || "image/jpeg";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "must be an image" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
    const classId = (form.get("classId") as string | null) || null;
    const homeworkId = (form.get("homeworkId") as string | null) || null;
    const title = (form.get("title") as string | null) || null;
    const comment = (form.get("comment") as string | null) || null;

    const row = createPhotoSubmission({
      studentId: session.user.id,
      classId,
      homeworkId,
      title,
      comment,
      imageData: dataUrl,
      mime,
    });

    // Run vision grading inline so the student sees feedback immediately.
    const ai = await visionGrade(dataUrl);
    if (ai) attachAiResult(row.id, ai.ocrText, ai.aiFeedback, ai.aiSuggestedGrade);

    // Notify teachers of the class in the background.
    if (classId) {
      void (async () => {
        try {
          const members = groupMembers(classId);
          const teachers = members.filter((m) => m.role === "teacher").map((m) => m.userId);
          if (teachers.length > 0) {
            const author = session.user?.name ?? "Ученик";
            await sendToUsers(teachers, {
              title: `Новая фото-ДЗ от ${author}`,
              body: title ?? "Открыть и проверить",
              url: "/teacher/homework",
              tag: `photo-hw-${row.id}`,
            });
          }
        } catch (e) {
          await logError("photo-hw push", String(e));
        }
      })();
    }

    return NextResponse.json({
      ok: true,
      submission: stripImageData(ai ? { ...row, ...ai, ocrText: ai.ocrText, aiFeedback: ai.aiFeedback, aiSuggestedGrade: ai.aiSuggestedGrade } : row),
      visionAvailable: ai !== null,
    });
  } catch (err) {
    await logError("/api/homework/photo POST", String(err));
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
