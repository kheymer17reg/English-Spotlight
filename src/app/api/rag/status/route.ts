import { NextResponse } from "next/server";
import { detectProvider } from "@/lib/llm";
import { CURRICULUM } from "@/lib/curriculum";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.response;
  const provider = detectProvider();
  return NextResponse.json({
    provider,
    rag: {
      backend: "bm25-memory",
      documents: CURRICULUM.length,
      indexedAt: new Date().toISOString(),
    },
  });
}
