import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Issues a short-lived Azure Speech token for the browser SDK to use.
// The subscription key stays on the server; the token lasts 10 minutes.
export async function GET() {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    return NextResponse.json(
      {
        enabled: false,
        error: "Azure Speech не настроен. Задай AZURE_SPEECH_KEY и AZURE_SPEECH_REGION.",
      },
      { status: 200 },
    );
  }
  try {
    const res = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Length": "0",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { enabled: false, error: `Azure token error ${res.status}: ${body.slice(0, 200)}` },
        { status: 200 },
      );
    }
    const token = await res.text();
    return NextResponse.json({ enabled: true, token, region });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ enabled: false, error: msg }, { status: 200 });
  }
}
