import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";

export type PhotoHwStatus = "submitted" | "graded";

export interface PhotoHomeworkRow {
  id: string;
  studentId: string;
  classId: string | null;
  homeworkId: string | null;
  title: string | null;
  comment: string | null;
  imageData: string;
  mime: string;
  ocrText: string | null;
  aiFeedback: string | null;
  aiSuggestedGrade: number | null;
  teacherGrade: number | null;
  teacherComment: string | null;
  status: PhotoHwStatus;
  createdAt: string;
  gradedAt: string | null;
}

export interface CreatePhotoInput {
  studentId: string;
  classId: string | null;
  homeworkId: string | null;
  title: string | null;
  comment: string | null;
  imageData: string;
  mime: string;
}

export function createPhotoSubmission(input: CreatePhotoInput): PhotoHomeworkRow {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const db = getDb();
  db.prepare(
    `INSERT INTO photo_homework (id,studentId,classId,homeworkId,title,comment,imageData,mime,status,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    input.studentId,
    input.classId,
    input.homeworkId,
    input.title,
    input.comment,
    input.imageData,
    input.mime,
    "submitted",
    createdAt,
  );
  return getPhoto(id)!;
}

export function getPhoto(id: string): PhotoHomeworkRow | null {
  const db = getDb();
  return (db.prepare(`SELECT * FROM photo_homework WHERE id = ?`).get(id) as PhotoHomeworkRow | undefined) ?? null;
}

export function attachAiResult(
  id: string,
  ocrText: string,
  aiFeedback: string,
  aiSuggestedGrade: number | null,
): void {
  const db = getDb();
  db.prepare(
    `UPDATE photo_homework SET ocrText = ?, aiFeedback = ?, aiSuggestedGrade = ? WHERE id = ?`,
  ).run(ocrText, aiFeedback, aiSuggestedGrade, id);
}

export function gradePhoto(
  id: string,
  teacherGrade: number,
  teacherComment: string | null,
): void {
  const db = getDb();
  db.prepare(
    `UPDATE photo_homework SET teacherGrade = ?, teacherComment = ?, status = 'graded', gradedAt = ? WHERE id = ?`,
  ).run(teacherGrade, teacherComment, new Date().toISOString(), id);
}

export function listForStudent(studentId: string): PhotoHomeworkRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM photo_homework WHERE studentId = ? ORDER BY createdAt DESC LIMIT 60`)
    .all(studentId) as PhotoHomeworkRow[];
}

export function listForClass(classId: string): PhotoHomeworkRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM photo_homework WHERE classId = ? ORDER BY createdAt DESC LIMIT 200`)
    .all(classId) as PhotoHomeworkRow[];
}

export function listForTeacher(teacherUserId: string): PhotoHomeworkRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.* FROM photo_homework p
       INNER JOIN groups g ON g.id = p.classId
       WHERE g.teacherId = ?
       ORDER BY p.createdAt DESC LIMIT 200`,
    )
    .all(teacherUserId) as PhotoHomeworkRow[];
}

/** Strip image bytes for list views — keep only metadata + thumbnail-friendly mime. */
export function stripImageData(row: PhotoHomeworkRow): Omit<PhotoHomeworkRow, "imageData"> & { hasImage: true } {
  const { imageData: _imageData, ...rest } = row;
  void _imageData;
  return { ...rest, hasImage: true };
}
