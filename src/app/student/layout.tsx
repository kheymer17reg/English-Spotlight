import { StudentSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileTabBar } from "@/components/layout/mobile-nav";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { LumosFloater } from "@/components/chat/lumos-floater";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <StudentSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role="student" />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8">{children}</main>
        <MobileTabBar />
      </div>
      <LumosFloater />
      <FeedbackWidget />
    </div>
  );
}
