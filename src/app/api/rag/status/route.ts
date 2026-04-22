import { NextResponse } from "next/server";
import { detectProvider } from "@/lib/llm";
import { CURRICULUM } from "@/lib/curriculum";

export const runtime = "nodejs";

export async function GET() {
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
