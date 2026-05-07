"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { StudentRecord } from "@/types";

// Hydrates the local Zustand profile store from the authenticated session
// the first time a student page mounts. /student/* pages gate on a non-null
// `student` from the store, so without this they render blank for users
// that signed up via /auth/signup (where the store is empty until /api/student/me
// fills it).
export function StudentBootstrap() {
  const student = useStore((s) => s.student);
  const setStudent = useStore((s) => s.setStudent);
  const setBootstrapped = useStore((s) => s.setBootstrapped);

  useEffect(() => {
    if (student) {
      setBootstrapped(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/student/me", { cache: "no-store" });
        if (r.ok) {
          const data = (await r.json()) as { student: StudentRecord };
          if (!cancelled && data.student) setStudent(data.student);
        }
      } catch {
        // network or auth issue — leave store empty; redirect-pages will
        // bounce the user to the landing page
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student, setStudent, setBootstrapped]);

  return null;
}
