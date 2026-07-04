/**
 * Groq API caller for LLM fallback.
 *
 * Groq offers a generous free-tier quota via llama-3.3-70b-versatile.
 * No complicated SDK needed — just a fetch call to their REST API.
 */

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured — no fallback available");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error (${res.status}): ${body}`);
  }

  const data: GroqResponse = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
