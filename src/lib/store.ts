"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Grade, StudentRecord } from "@/types";
import { uid } from "@/lib/utils";

type ProfileState = {
  student: StudentRecord | null;
  theme: "light" | "dark";
  setStudent: (s: StudentRecord) => void;
  updateStudent: (patch: Partial<StudentRecord>) => void;
  reset: () => void;
  setTheme: (t: "light" | "dark") => void;
  initStudent: (name: string, grade: Grade) => void;
  addXp: (n: number) => void;
  bumpStreak: () => void;
};

export const useStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      student: null,
      theme: "light",
      setStudent: (s) => set({ student: s }),
      updateStudent: (patch) => {
        const cur = get().student;
        if (!cur) return;
        set({ student: { ...cur, ...patch } });
      },
      reset: () => set({ student: null }),
      setTheme: (t) => {
        set({ theme: t });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", t === "dark");
        }
      },
      initStudent: (name, grade) => {
        const s: StudentRecord = {
          id: uid("stu"),
          name,
          grade,
          createdAt: new Date().toISOString(),
          streak: 0,
          xp: 0,
          level: 1,
          currentModule: 1,
        };
        set({ student: s });
      },
      addXp: (n) => {
        const cur = get().student;
        if (!cur) return;
        const xp = cur.xp + n;
        const level = 1 + Math.floor(xp / 200);
        set({ student: { ...cur, xp, level } });
      },
      bumpStreak: () => {
        const cur = get().student;
        if (!cur) return;
        set({ student: { ...cur, streak: cur.streak + 1 } });
      },
    }),
    { name: "spotlight-learning-store" },
  ),
);
