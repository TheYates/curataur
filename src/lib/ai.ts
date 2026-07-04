/**
 * Unified AI provider: Gemini primary (with 1 internal retry) → Groq fallback.
 *
 * Handles rate limits (429), malformed JSON, and network errors by retrying
 * once on Gemini, then failing over to Groq when Gemini's retry is exhausted.
 */

import { callGemini } from "./gemini";
import { callGroq } from "./groq";

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  // Try Gemini first (has 1 internal retry on 429)
  try {
    const result = await callGemini(systemPrompt, userPrompt);
    if (result.trim()) return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[AI] Gemini failed, trying Groq fallback: ${message}`);
  }

  // Fallback to Groq
  const result = await callGroq(systemPrompt, userPrompt);
  return result;
}

/**
 * Calls the AI provider and attempts to parse the response as JSON.
 * Retries once on malformed JSON (switching to Groq).
 */
export async function callAIWithJson<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const raw = await callAI(systemPrompt, userPrompt);

  // First parse attempt
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.log("[AI] First parse failed, retrying...");
  }

  // Retry — switch provider by falling through to Groq directly
  try {
    const groqResult = await callGroq(systemPrompt, userPrompt);
    return JSON.parse(groqResult) as T;
  } catch (err) {
    throw new Error(`AI response parse failed after retry: ${err}`);
  }
}
