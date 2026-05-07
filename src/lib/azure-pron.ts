"use client";

// Client-side helpers for Azure Pronunciation Assessment via the Speech SDK.
// Uses a short-lived token issued by /api/speech/token so the subscription key
// never reaches the browser.

import type {
  PronunciationAssessmentResult as SdkResult,
  SpeechRecognizer,
} from "microsoft-cognitiveservices-speech-sdk";

export type AzurePronWord = {
  word: string;
  accuracyScore: number; // 0..100
  errorType: string; // None | Mispronunciation | Omission | Insertion
};

export type AzurePronResult = {
  enabled: true;
  accuracy: number; // 0..100
  fluency: number;
  completeness: number;
  pronScore: number; // composite
  transcript: string;
  words: AzurePronWord[];
};

export type AzureDisabled = { enabled: false; error: string };

export async function isAzureEnabled(): Promise<boolean> {
  try {
    const res = await fetch("/api/speech/token", { cache: "no-store" });
    const data = (await res.json()) as { enabled?: boolean };
    return Boolean(data.enabled);
  } catch {
    return false;
  }
}

export async function runAzurePronunciation(
  referenceText: string,
): Promise<AzurePronResult | AzureDisabled> {
  let tokenData: { enabled: boolean; token?: string; region?: string; error?: string };
  try {
    const res = await fetch("/api/speech/token", { cache: "no-store" });
    tokenData = await res.json();
  } catch (e) {
    return { enabled: false, error: `token fetch failed: ${String(e)}` };
  }
  if (!tokenData.enabled || !tokenData.token || !tokenData.region) {
    return { enabled: false, error: tokenData.error || "Azure не настроен" };
  }

  // Lazy-import the SDK so it only ships to the browser when actually used.
  const sdk = await import("microsoft-cognitiveservices-speech-sdk");

  const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
    tokenData.token,
    tokenData.region,
  );
  speechConfig.speechRecognitionLanguage = "en-US";

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  const pronConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Word,
    true, // enable miscue
  );
  pronConfig.applyTo(recognizer);

  try {
    return await new Promise<AzurePronResult | AzureDisabled>((resolve) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          try {
            if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
              resolve({ enabled: false, error: `reason=${result.reason}` });
              return;
            }
            const assessment: SdkResult = sdk.PronunciationAssessmentResult.fromResult(result);
            // The SDK also exposes raw JSON via the JSON property; use it for word-level detail.
            const raw = result.properties.getProperty(
              sdk.PropertyId.SpeechServiceResponse_JsonResult,
            );
            const parsed = raw ? (JSON.parse(raw) as unknown) : null;
            const words = extractWords(parsed);
            resolve({
              enabled: true,
              accuracy: assessment.accuracyScore,
              fluency: assessment.fluencyScore,
              completeness: assessment.completenessScore,
              pronScore: assessment.pronunciationScore,
              transcript: result.text ?? "",
              words,
            });
          } catch (e) {
            resolve({ enabled: false, error: `assessment parse: ${String(e)}` });
          } finally {
            closeRecognizer(recognizer);
          }
        },
        (err) => {
          closeRecognizer(recognizer);
          resolve({ enabled: false, error: String(err) });
        },
      );
    });
  } catch (e) {
    closeRecognizer(recognizer);
    return { enabled: false, error: String(e) };
  }
}

function closeRecognizer(recognizer: SpeechRecognizer) {
  try { recognizer.close(); } catch { /* noop */ }
}

type AzureWordJson = {
  Word?: string;
  PronunciationAssessment?: {
    AccuracyScore?: number;
    ErrorType?: string;
  };
};
type AzureNbestJson = { Words?: AzureWordJson[] };
type AzureRootJson = { NBest?: AzureNbestJson[] };

function extractWords(parsed: unknown): AzurePronWord[] {
  if (!parsed || typeof parsed !== "object") return [];
  const root = parsed as AzureRootJson;
  const nbest = root.NBest?.[0];
  const words = nbest?.Words ?? [];
  return words.map((w) => ({
    word: String(w.Word ?? ""),
    accuracyScore: Number(w.PronunciationAssessment?.AccuracyScore ?? 0),
    errorType: String(w.PronunciationAssessment?.ErrorType ?? "None"),
  }));
}
