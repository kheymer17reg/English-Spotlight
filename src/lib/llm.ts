import type { ChatMessage, ProviderInfo } from "@/types";

type Provider = ProviderInfo["name"];

export function detectProvider(): ProviderInfo {
  const forced = (process.env.LLM_PROVIDER || "").toLowerCase() as Provider | "";
  const candidates: { name: Provider; envKey: string; modelEnv: string; defaultModel: string }[] = [
    { name: "anthropic", envKey: "ANTHROPIC_API_KEY", modelEnv: "ANTHROPIC_MODEL", defaultModel: "claude-3-5-sonnet-latest" },
    { name: "openai", envKey: "OPENAI_API_KEY", modelEnv: "OPENAI_MODEL", defaultModel: "gpt-4o-mini" },
    { name: "groq", envKey: "GROQ_API_KEY", modelEnv: "GROQ_MODEL", defaultModel: "llama-3.3-70b-versatile" },
    { name: "gemini", envKey: "GEMINI_API_KEY", modelEnv: "GEMINI_MODEL", defaultModel: "gemini-1.5-flash-latest" },
  ];

  if (forced) {
    const c = candidates.find((x) => x.name === forced);
    if (c) {
      return {
        name: c.name,
        model: process.env[c.modelEnv] || c.defaultModel,
        configured: Boolean(process.env[c.envKey]),
      };
    }
  }

  for (const c of candidates) {
    if (process.env[c.envKey]) {
      return {
        name: c.name,
        model: process.env[c.modelEnv] || c.defaultModel,
        configured: true,
      };
    }
  }

  return { name: "none", model: "", configured: false };
}

export async function generateText({
  system,
  messages,
  maxTokens = 1500,
  temperature = 0.4,
  json = false,
}: {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}): Promise<{ text: string; provider: ProviderInfo }> {
  const provider = detectProvider();
  if (!provider.configured) {
    throw new Error("NO_LLM_KEY");
  }

  const sys = system ?? "";
  if (provider.name === "anthropic") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const res = await client.messages.create({
      model: provider.model,
      max_tokens: maxTokens,
      temperature,
      system: sys,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });
    const text = res.content
      .map((b: { type: string; text?: string }) => ("text" in b && b.type === "text" ? b.text ?? "" : ""))
      .join("");
    return { text, provider };
  }

  if (provider.name === "openai") {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const res = await client.chat.completions.create({
      model: provider.model,
      temperature,
      max_tokens: maxTokens,
      response_format: json ? { type: "json_object" } : undefined,
      messages: [
        ...(sys ? [{ role: "system" as const, content: sys }] : []),
        ...messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
      ],
    });
    return { text: res.choices[0]?.message?.content ?? "", provider };
  }

  if (provider.name === "groq") {
    const { default: Groq } = await import("groq-sdk");
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    const res = await client.chat.completions.create({
      model: provider.model,
      temperature,
      max_tokens: maxTokens,
      response_format: json ? { type: "json_object" } : undefined,
      messages: [
        ...(sys ? [{ role: "system" as const, content: sys }] : []),
        ...messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
      ],
    });
    return { text: res.choices[0]?.message?.content ?? "", provider };
  }

  if (provider.name === "gemini") {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = client.getGenerativeModel({
      model: provider.model,
      systemInstruction: sys || undefined,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: json ? "application/json" : undefined,
      },
    });
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const last = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(last?.content ?? "");
    return { text: result.response.text(), provider };
  }

  throw new Error("NO_LLM_KEY");
}

export function extractJson<T = unknown>(text: string): T | null {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : trimmed;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(candidate.slice(first, last + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
