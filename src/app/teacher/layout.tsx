import { TeacherSidebar } from "@/components/layout/teacher-sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <TeacherSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role="teacher" />
        <main className="flex-1 px-4 pb-10 pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
