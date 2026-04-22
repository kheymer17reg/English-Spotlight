"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle as CircleIcon,
  Download,
  Eraser,
  Hand,
  ImageIcon,
  Pencil,
  Save,
  Square as SquareIcon,
  StickyNote,
  Trash2,
  Type as TypeIcon,
  Undo2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Tool = "pen" | "eraser" | "rect" | "circle" | "text" | "sticky" | "hand";

type Stroke = { tool: "pen" | "eraser"; color: string; size: number; points: { x: number; y: number }[] };
type Shape = { type: "rect" | "circle"; color: string; size: number; x: number; y: number; w: number; h: number };
type TextItem = { id: string; kind: "text"; x: number; y: number; text: string; color: string; size: number };
type Sticky = { id: string; kind: "sticky"; x: number; y: number; text: string; color: string };

type BoardData = {
  strokes: Stroke[];
  shapes: Shape[];
  texts: TextItem[];
  stickies: Sticky[];
};

type NoteMeta = { id: string; title: string; thumbnail: string | null; updatedAt: string };

const COLORS = ["#0ea5a3", "#7c3aed", "#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#111827", "#ffffff"];
const STICKY_COLORS = ["#fde68a", "#bbf7d0", "#fbcfe8", "#bfdbfe", "#e9d5ff"];

const CANVAS_W = 1600;
const CANVAS_H = 900;

export default function TeacherBoardPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [size, setSize] = useState<number>(4);
  const [data, setData] = useState<BoardData>({ strokes: [], shapes: [], texts: [], stickies: [] });
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
  const [preview, setPreview] = useState<{ type: "rect" | "circle"; x: number; y: number; w: number; h: number } | null>(null);
  const [title, setTitle] = useState("Новая доска");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [saving, setSaving] = useState(false);

  const refreshNotes = useCallback(async () => {
    const r = await fetch("/api/board/notes", { cache: "no-store" });
    const d = await r.json();
    setNotes(d.notes || []);
  }, []);

  useEffect(() => { void refreshNotes(); }, [refreshNotes]);

  const toLocal = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * CANVAS_W;
    const y = ((e.clientY - r.top) / r.height) * CANVAS_H;
    return { x, y };
  }, []);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let x = 40; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 40; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    for (const s of data.strokes) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = s.size;
      ctx.strokeStyle = s.tool === "eraser" ? "#ffffff" : s.color;
      ctx.beginPath();
      s.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
    for (const sh of data.shapes) {
      ctx.strokeStyle = sh.color;
      ctx.lineWidth = sh.size;
      if (sh.type === "rect") {
        ctx.strokeRect(sh.x, sh.y, sh.w, sh.h);
      } else {
        ctx.beginPath();
        ctx.ellipse(sh.x + sh.w / 2, sh.y + sh.h / 2, Math.abs(sh.w) / 2, Math.abs(sh.h) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    for (const t of data.texts) {
      ctx.fillStyle = t.color;
      ctx.font = `${t.size}px Inter, sans-serif`;
      ctx.fillText(t.text, t.x, t.y);
    }
    if (preview) {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.setLineDash([4, 4]);
      if (preview.type === "rect") ctx.strokeRect(preview.x, preview.y, preview.w, preview.h);
      else {
        ctx.beginPath();
        ctx.ellipse(preview.x + preview.w / 2, preview.y + preview.h / 2, Math.abs(preview.w) / 2, Math.abs(preview.h) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }, [data, preview, color, size]);

  useEffect(() => { redraw(); }, [redraw]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = toLocal(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
    if (tool === "text") {
      const text = prompt("Текст:");
      if (text && text.trim()) {
        setData((d) => ({
          ...d,
          texts: [...d.texts, { id: `t-${Date.now()}`, kind: "text", x: p.x, y: p.y, text: text.trim(), color, size: Math.max(16, size * 6) }],
        }));
      }
      return;
    }
    if (tool === "sticky") {
      const text = prompt("Заметка:");
      if (text && text.trim()) {
        setData((d) => ({
          ...d,
          stickies: [
            ...d.stickies,
            { id: `s-${Date.now()}`, kind: "sticky", x: p.x, y: p.y, text: text.trim(), color: STICKY_COLORS[d.stickies.length % STICKY_COLORS.length] },
          ],
        }));
      }
      return;
    }
    setDrawing(true);
    setStartPt(p);
    if (tool === "pen" || tool === "eraser") {
      setData((d) => ({
        ...d,
        strokes: [...d.strokes, { tool, color, size: tool === "eraser" ? size * 3 : size, points: [p] }],
      }));
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const p = toLocal(e);
    if (tool === "pen" || tool === "eraser") {
      setData((d) => {
        const strokes = d.strokes.slice();
        const last = strokes[strokes.length - 1];
        if (last) strokes[strokes.length - 1] = { ...last, points: [...last.points, p] };
        return { ...d, strokes };
      });
    } else if (tool === "rect" || tool === "circle") {
      if (startPt) {
        setPreview({ type: tool, x: startPt.x, y: startPt.y, w: p.x - startPt.x, h: p.y - startPt.y });
      }
    }
  }

  function onPointerUp() {
    if (!drawing) return;
    setDrawing(false);
    if (preview) {
      setData((d) => ({ ...d, shapes: [...d.shapes, { ...preview, color, size }] }));
      setPreview(null);
    }
    setStartPt(null);
  }

  function undo() {
    setData((d) => {
      if (d.strokes.length) return { ...d, strokes: d.strokes.slice(0, -1) };
      if (d.shapes.length) return { ...d, shapes: d.shapes.slice(0, -1) };
      if (d.texts.length) return { ...d, texts: d.texts.slice(0, -1) };
      if (d.stickies.length) return { ...d, stickies: d.stickies.slice(0, -1) };
      return d;
    });
  }
  function clearAll() {
    if (!confirm("Очистить доску?")) return;
    setData({ strokes: [], shapes: [], texts: [], stickies: [] });
  }

  function exportPng() {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "board"}.png`;
    a.click();
  }

  async function saveNote() {
    const c = canvasRef.current;
    if (!c) return;
    setSaving(true);
    try {
      const thumb = await makeThumbnail(c);
      const body = {
        id: noteId || undefined,
        title: title.trim() || "Без названия",
        data: JSON.stringify(data),
        thumbnail: thumb,
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
    try {
      const parsed = JSON.parse(d.note.data) as BoardData;
      setData({
        strokes: parsed.strokes || [],
        shapes: parsed.shapes || [],
        texts: parsed.texts || [],
        stickies: parsed.stickies || [],
      });
    } catch {
      setData({ strokes: [], shapes: [], texts: [], stickies: [] });
    }
  }

  function newBoard() {
    setNoteId(null);
    setTitle("Новая доска");
    setData({ strokes: [], shapes: [], texts: [], stickies: [] });
  }

  async function deleteNote(id: string) {
    if (!confirm("Удалить доску?")) return;
    await fetch(`/api/board/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (id === noteId) newBoard();
    await refreshNotes();
  }

  const stickies = useMemo(() => data.stickies, [data.stickies]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Онлайн-доска</h1>
          <p className="text-muted-foreground">Для объяснений у доски — ручка, фигуры, заметки, PNG-экспорт</p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="w-56" />
          <Button variant="outline" size="sm" onClick={newBoard} className="gap-2">Новая</Button>
          <Button onClick={saveNote} loading={saving} size="sm" className="gap-2">
            <Save className="h-4 w-4" /> Сохранить
          </Button>
          <Button variant="outline" size="sm" onClick={exportPng} className="gap-2">
            <Download className="h-4 w-4" /> PNG
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="lg:order-2">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-1.5">
              {([
                ["pen", Pencil, "Ручка"],
                ["eraser", Eraser, "Ластик"],
                ["rect", SquareIcon, "Прямоугольник"],
                ["circle", CircleIcon, "Эллипс"],
                ["text", TypeIcon, "Текст"],
                ["sticky", StickyNote, "Заметка"],
                ["hand", Hand, "Перетаскивать"],
              ] as [Tool, React.ComponentType<{ className?: string }>, string][]).map(([t, Icon, title]) => (
                <button
                  key={t}
                  title={title}
                  onClick={() => setTool(t)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                    tool === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
              <div className="mx-1 h-9 w-px bg-border" />
              <button onClick={undo} title="Откатить" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={clearAll} title="Очистить" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Цвет</div>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-primary" : "border-border"}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                <span>Толщина</span>
                <span>{size}px</span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:order-1">
          <div
            ref={containerRef}
            className="relative w-full bg-slate-50"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="absolute inset-0 h-full w-full touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
            {stickies.map((s) => (
              <StickyComponent
                key={s.id}
                sticky={s}
                onChange={(patch) =>
                  setData((d) => ({
                    ...d,
                    stickies: d.stickies.map((x) => (x.id === s.id ? { ...x, ...patch } : x)),
                  }))
                }
                onRemove={() =>
                  setData((d) => ({ ...d, stickies: d.stickies.filter((x) => x.id !== s.id) }))
                }
              />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Сохранённые доски</CardTitle>
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
                <div key={n.id} className="group relative overflow-hidden rounded-lg border border-border bg-background">
                  <button
                    className="block w-full"
                    onClick={() => loadNote(n.id)}
                  >
                    {n.thumbnail ? (
                      <img src={n.thumbnail} alt={n.title} className="h-24 w-full object-cover" />
                    ) : (
                      <div className="flex h-24 items-center justify-center bg-muted text-xs text-muted-foreground">
                        без превью
                      </div>
                    )}
                    <div className="px-2 py-1.5 text-left">
                      <div className="truncate text-xs font-medium">{n.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(n.updatedAt).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="absolute right-1 top-1 rounded bg-surface/90 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
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

function StickyComponent({
  sticky,
  onChange,
  onRemove,
}: {
  sticky: Sticky;
  onChange: (patch: Partial<Sticky>) => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        const target = e.currentTarget.getBoundingClientRect();
        setOffset({ dx: e.clientX - target.left, dy: e.clientY - target.top });
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        const parent = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
        const px = ((e.clientX - offset.dx - parent.left) / parent.width) * CANVAS_W;
        const py = ((e.clientY - offset.dy - parent.top) / parent.height) * CANVAS_H;
        onChange({ x: Math.max(0, Math.min(CANVAS_W - 180, px)), y: Math.max(0, Math.min(CANVAS_H - 120, py)) });
      }}
      onPointerUp={() => setDragging(false)}
      className="group absolute cursor-grab rounded-md p-3 shadow-md active:cursor-grabbing"
      style={{
        left: `${(sticky.x / CANVAS_W) * 100}%`,
        top: `${(sticky.y / CANVAS_H) * 100}%`,
        width: "12%",
        background: sticky.color,
      }}
    >
      <button
        className="absolute -right-2 -top-2 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
        onPointerDown={(e) => { e.stopPropagation(); onRemove(); }}
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <div className="whitespace-pre-wrap text-xs text-slate-900">{sticky.text}</div>
    </div>
  );
}

async function makeThumbnail(c: HTMLCanvasElement): Promise<string> {
  const tw = 400;
  const th = Math.round((tw * c.height) / c.width);
  const off = document.createElement("canvas");
  off.width = tw;
  off.height = th;
  const ctx = off.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(c, 0, 0, tw, th);
  return off.toDataURL("image/png");
}
