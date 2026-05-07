"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor } from "tldraw";
import "tldraw/tldraw.css";

export type TldrawBoardHandle = {
  /** Serialise the current document to a JSON string. */
  getSnapshotJSON: () => string | null;
  /** Replace document with the given snapshot JSON. Empty/invalid → blank. */
  loadSnapshotJSON: (json: string | null) => void;
  /** Reset the canvas to empty state. */
  reset: () => void;
  /** Export current page to PNG `data:` URL (returns null if nothing drawn). */
  exportPng: () => Promise<string | null>;
};

/**
 * Tldraw wrapper used as the main whiteboard surface.
 *
 * Notes
 * - Persistence:        consumer calls `getSnapshotJSON()` / `loadSnapshotJSON()`
 *                       through the `ref`. Snapshot format is tldraw's
 *                       portable `TLEditorSnapshot` (document + session).
 * - Local autosave:     we set `persistenceKey="spotlight-teacher-board"` so
 *                       work-in-progress survives page refreshes via IndexedDB
 *                       even before the user explicitly hits "Сохранить".
 * - Export:             `editor.toImage` produces a PNG blob with a white
 *                       background; we convert it to a data URL for thumbnail
 *                       upload and PNG download.
 */
const TldrawBoard = forwardRef<TldrawBoardHandle, { className?: string }>(function TldrawBoard(
  { className },
  ref,
) {
  const editorRef = useRef<Editor | null>(null);

  useImperativeHandle(ref, () => ({
    getSnapshotJSON() {
      const editor = editorRef.current;
      if (!editor) return null;
      const snapshot = getSnapshot(editor.store);
      return JSON.stringify(snapshot);
    },
    loadSnapshotJSON(json) {
      const editor = editorRef.current;
      if (!editor) return;
      if (!json) {
        editor.store.clear();
        return;
      }
      try {
        const snapshot = JSON.parse(json);
        loadSnapshot(editor.store, snapshot);
      } catch {
        editor.store.clear();
      }
    },
    reset() {
      const editor = editorRef.current;
      if (!editor) return;
      editor.store.clear();
    },
    async exportPng() {
      const editor = editorRef.current;
      if (!editor) return null;
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) return null;
      const result = await editor.toImage([...shapeIds], {
        format: "png",
        background: true,
        scale: 2,
      });
      if (!result?.blob) return null;
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read error"));
        reader.readAsDataURL(result.blob);
      });
    },
  }));

  // Tldraw fills its nearest positioned ancestor with `position: absolute` on
  // its own root, so the wrapper must be a positioning context with explicit
  // size. Earlier we set `style={{ position: "relative" }}` here, which
  // collapsed the parent's `absolute inset-0` className back to relative
  // flow → 0×0 → blank canvas. Use `position: absolute` + `inset: 0` instead
  // so the wrapper actually fills the Card.
  return (
    <div className={className} style={{ position: "absolute", inset: 0 }}>
      <Tldraw
        persistenceKey="spotlight-teacher-board"
        onMount={(editor) => {
          editorRef.current = editor;
        }}
      />
    </div>
  );
});

export default TldrawBoard;
