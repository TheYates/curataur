/**
 * Helper for calling Gemini API with retry-on-429 logic.
 */

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

interface RetryDelay {
  retryDelay?: string; // e.g. "23s"
}

export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = "gemini-2.0-flash-lite";

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (res.ok) {
        const data: GeminiResponse = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }

      // Read body once — it can't be read twice
      const bodyText = await res.text();

      // 429 — rate limited, retry with delay
      if (res.status === 429) {
        let delayMs = 30_000; // default 30s

        try {
          const errBody: RetryDelay = JSON.parse(bodyText);
          if (errBody.retryDelay) {
            const parsed = parseDuration(errBody.retryDelay);
            if (parsed) delayMs = parsed * 1000 + 1_000; // add 1s buffer
          }
        } catch {
          // couldn't parse body, use default
        }

        if (attempt < maxRetries) {
          console.log(
            `[Gemini] 429 rate limited, retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 1}/${maxRetries})`,
          );
          await sleep(delayMs);
          continue;
        }
      }

      // Non-429 or exhausted retries
      throw new Error(`Gemini API error (${res.status}): ${bodyText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt >= maxRetries) break;
      // Network error — retry after 5s
      console.log(`[Gemini] attempt ${attempt + 1} failed, retrying in 5s`);
      await sleep(5_000);
    }
  }

  throw lastError ?? new Error("Gemini call failed after retries");
}

function parseDuration(s: string): number | null {
  const match = s.match(/^(\d+(?:\.\d+)?)s$/);
  return match ? parseFloat(match[1]) : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
