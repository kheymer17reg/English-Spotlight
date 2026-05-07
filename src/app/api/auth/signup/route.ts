import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, upsertStudent, upsertUser } from "@/lib/db";
import { rateLimit } from "@/lib/api-auth";
import type { Grade, StudentRecord } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Throttle signups per IP to slow down credential-stuffing / spam.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = rateLimit(`signup:${ip}`, { capacity: 5, refillPerMinute: 1 });
  if (!rl.ok) return rl.response;

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
    role?: "teacher" | "student" | "parent";
    grade?: number;
    teacherCode?: string;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim() || null;

  // Role logic:
  //   - teacher only if request includes the matching TEACHER_SIGNUP_CODE secret;
  //   - parent allowed (parents must self-register to link to children);
  //   - everything else falls back to student.
  let role: "teacher" | "student" | "parent" = "student";
  if (body.role === "teacher") {
    const expected = process.env.TEACHER_SIGNUP_CODE;
    if (!expected) {
      return NextResponse.json(
        { error: "Регистрация учителя выключена. Обратитесь к администратору." },
        { status: 403 },
      );
    }
    if (body.teacherCode !== expected) {
      return NextResponse.json(
        { error: "Неверный код регистрации учителя" },
        { status: 403 },
      );
    }
    role = "teacher";
  } else if (body.role === "parent") {
    role = "parent";
  }
  const grade = typeof body.grade === "number" && body.grade > 0 ? body.grade : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Пароль должен быть не короче 8 символов" },
      { status: 400 },
    );
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "Пользователь с таким email уже есть" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const id = `u_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  // For students we provision a StudentRecord at signup so that all
  // /student/* pages (which read from the StudentRecord-keyed store) have
  // data to render immediately after first login. Without this the Zustand
  // store stays empty and pages that gate on `!student` render blank.
  let studentId: string | null = null;
  if (role === "student") {
    const stuId = `stu_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    const record: StudentRecord = {
      id: stuId,
      name: name ?? email.split("@")[0],
      grade: (grade && grade >= 2 && grade <= 11 ? grade : 5) as Grade,
      createdAt: new Date().toISOString(),
      streak: 0,
      xp: 0,
      level: 1,
      currentModule: 1,
    };
    upsertStudent(record);
    studentId = stuId;
  }
  upsertUser({
    id,
    email,
    emailVerified: null,
    passwordHash,
    name,
    image: null,
    role,
    grade,
    studentId,
    provider: "credentials",
    providerAccountId: null,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
