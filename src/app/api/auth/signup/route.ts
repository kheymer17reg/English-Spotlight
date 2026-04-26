import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, upsertUser } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
    role?: "teacher" | "student" | "parent";
    grade?: number;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim() || null;
  const role: "teacher" | "student" | "parent" =
    body.role === "teacher" ? "teacher" : body.role === "parent" ? "parent" : "student";
  const grade = typeof body.grade === "number" && body.grade > 0 ? body.grade : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль должен быть не короче 6 символов" }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "Пользователь с таким email уже есть" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const id = `u_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  upsertUser({
    id,
    email,
    emailVerified: null,
    passwordHash,
    name,
    image: null,
    role,
    grade,
    studentId: null,
    provider: "credentials",
    providerAccountId: null,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
