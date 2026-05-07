"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TldrawBoardHandle } from "./tldraw-board";
import { BoardHelp } from "./board-help";

// Tldraw must be client-only (it relies on `window`, IndexedDB, etc.).
const TldrawBoard = dynamic(() => import("./tldraw-board"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[640px] items-center justify-center bg-slate-50 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> <span className="ml-2 text-sm">Загружаю доску…</span>
    </div>
  ),
});

type NoteMeta = { id: string; title: string; thumbnail: string | null; updatedAt: string };

export default function TeacherBoardPage() {
  const boardRef = useRef<TldrawBoardHandle | null>(null);
  const [title, setTitle] = useState("Новая доска");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [saving, setSaving] = useState(false);

  const refreshNotes = useCallback(async () => {
    const r = await fetch("/api/board/notes", { cache: "no-store" });
    const d = await r.json();
    setNotes(d.notes || []);
  }, []);

  useEffect(() => {
    void refreshNotes();
  }, [refreshNotes]);

  async function saveNote() {
    const board = boardRef.current;
    if (!board) return;
    setSaving(true);
    try {
      const data = board.getSnapshotJSON();
      if (!data) return;
      const thumbnail = await board.exportPng().catch(() => null);
      const body = {
        id: noteId || undefined,
        title: title.trim() || "Без названия",
        data,
        thumbnail,
      };
      const r = await fetch("/api/board/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      setNoteId(d.note.id);
      await refreshNotes();
    } finally {
      setSaving(false);
    }
  }

  async function loadNote(id: string) {
    const r = await fetch(`/api/board/notes?id=${encodeURIComponent(id)}`);
    if (!r.ok) return;
    const d = await r.json();
    setNoteId(d.note.id);
    setTitle(d.note.title);
    boardRef.current?.loadSnapshotJSON(d.note.data ?? null);
  }

  function newBoard() {
    setNoteId(null);
    setTitle("Новая доска");
    boardRef.current?.reset();
  }

  async function deleteNote(id: string) {
    if (!confirm("Удалить доску?")) return;
    await fetch(`/api/board/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (id === noteId) newBoard();
    await refreshNotes();
  }

  async function exportPng() {
    const board = boardRef.current;
    if (!board) return;
    const url = await board.exportPng();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "board"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Онлайн-доска</h1>
          <p className="text-muted-foreground">
            Бесконечная luxe-доска на tldraw — рисование, фигуры, текст, заметки, фреймы, рукописный
            ввод и PNG-экспорт. Автосохранение черновика в браузере.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-56"
            placeholder="Название доски"
          />
          <Button variant="outline" size="sm" onClick={newBoard} className="gap-2">
            Новая
          </Button>
          <Button onClick={saveNote} loading={saving} size="sm" className="gap-2">
            <Save className="h-4 w-4" /> Сохранить
          </Button>
          <Button variant="outline" size="sm" onClick={exportPng} className="gap-2">
            <Download className="h-4 w-4" /> PNG
          </Button>
          <BoardHelp />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="relative h-[78vh] min-h-[560px] w-full bg-slate-50">
          <TldrawBoard ref={boardRef} className="absolute inset-0" />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> Сохранённые доски
              </CardTitle>
              <CardDescription>Кликни, чтобы открыть</CardDescription>
            </div>
            <Badge variant="primary">{notes.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Нет сохранённых досок. Сохрани первую 👉
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-background"
                >
                  <button
                    type="button"
                    onClick={() => loadNote(n.id)}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-video w-full bg-slate-100">
                      {n.thumbnail ? (
                        <Image
                          src={n.thumbnail}
                          alt={n.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 50vw, 20vw"
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          без миниатюры
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <div className="line-clamp-1 text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(n.updatedAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteNote(n.id);
                    }}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/80 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
