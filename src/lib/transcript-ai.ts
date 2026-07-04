/**
 * AI transcript processing — two separate calls:
 *   1. Summary, key takeaways, chapters
 *   2. Per-segment structural decisions (section headers + paragraph breaks)
 *
 * Each uses Gemini primary → Groq fallback with JSON retry logic.
 *
 * The formatting call (Call 2) never touches the transcript text — it
 * returns only structural metadata (which segments start a new paragraph
 * and which have a section header before them), which is written to
 * individual transcript_segments rows. This guarantees every word in
 * the original transcript remains untouched and individually clickable.
 */

import { callAI, callAIWithJson } from "./ai";

// ─── Types ─────────────────────────────────────────────────

export interface SummaryResult {
  summary: string;
  key_takeaways: string[];
  chapters: { title: string; start_time: number }[];
}

export interface SegmentFormatDecision {
  order_index: number;
  section_header: string | null;
  starts_new_paragraph: boolean;
}

// ─── Call 1: Summary / Takeaways / Chapters ────────────────

const SUMMARY_SYSTEM_PROMPT =
  "You are a helpful assistant that analyzes video transcripts. " +
  "Return ONLY valid JSON with this exact structure (no markdown, no code fences): " +
  '{ "summary": "2-3 sentence summary", "key_takeaways": ["takeaway1", "takeaway2", ...], "chapters": [{"title": "Chapter name", "start_time": 0}, ...] }';

export async function generateSummary(transcriptText: string): Promise<SummaryResult> {
  const userPrompt =
    `Analyze this transcript and return a summary (2-3 sentences), 4-6 key takeaways, ` +
    `and chapters with timestamps (in seconds). The summary should be concise ` +
    `(50-100 words) and capture the core topic and conclusion. Chapters should ` +
    `reflect natural topic shifts in the content.\n\nTranscript:\n${transcriptText}`;

  const result = await callAIWithJson<SummaryResult>(SUMMARY_SYSTEM_PROMPT, userPrompt);
  return {
    summary: result.summary ?? "",
    key_takeaways: Array.isArray(result.key_takeaways) ? result.key_takeaways : [],
    chapters: Array.isArray(result.chapters) ? result.chapters.map((ch) => ({
      title: ch.title ?? "",
      start_time: Math.round(ch.start_time ?? 0),
    })) : [],
  };
}

// ─── Call 2: Per-segment structural formatting ────────────

const FORMAT_SYSTEM_PROMPT =
  "You are a formatting assistant that improves transcript readability. " +
  "Your ONLY job is to decide, for each transcript segment, whether it should " +
  "start a new paragraph and/or have a section header placed before it.\n\n" +
  "CRITICAL: You must NOT change, paraphrase, reorder, add, or remove a single word " +
  "of the transcript. You return only structural metadata — never return the text itself.\n\n" +
  "Return ONLY valid JSON as an array of objects (no markdown, no code fences):\n" +
  '[\n' +
  '  { "order_index": 0, "section_header": "Introduction", "starts_new_paragraph": true },\n' +
  '  { "order_index": 5, "starts_new_paragraph": true },\n' +
  '  { "order_index": 12, "section_header": "Key Concepts", "starts_new_paragraph": true }\n' +
  "]\n\n" +
  "ONLY include segments where you are making a structural decision.\n" +
  "- Omit segments that continue the current paragraph with no header (defaults: no header, no paragraph break).\n" +
  "- Every section header should be a descriptive, concise label for the upcoming content.\n" +
  "- A new paragraph is appropriate when the topic shifts or a new idea begins.\n" +
  "- A section header is appropriate at the start of a major new topic.\n" +
  "- Usually 3-8 section headers total for a full transcript.\n" +
  "- The very first segment should always start a new paragraph.";

export async function formatTranscriptSegments(
  transcriptText: string,
  segments: { text: string; order_index: number }[],
): Promise<SegmentFormatDecision[]> {
  // Build a compact summary of segments for the AI
  const segmentSummary = segments
    .map((s) => `[${s.order_index}] ${s.text}`)
    .join("\n");

  const userPrompt =
    `Analyze these transcript segments and decide paragraph breaks and section headers.\n` +
    `Each line is [order_index] followed by that segment's text.\n\n` +
    `${segmentSummary}\n\n` +
    `Return JSON array of decisions. Only include segments where starts_new_paragraph is true or section_header is set.`;

  const result = await callAIWithJson<
    { order_index: number; section_header?: string | null; starts_new_paragraph?: boolean }[]
  >(FORMAT_SYSTEM_PROMPT, userPrompt);

  const decisions = Array.isArray(result) ? result : [];

  // Build a map of decisions keyed by order_index
  const decisionMap = new Map<number, SegmentFormatDecision>();
  for (const d of decisions) {
    const idx = Math.round(d.order_index ?? -1);
    if (idx >= 0 && idx < segments.length) {
      decisionMap.set(idx, {
        order_index: idx,
        section_header: d.section_header ?? null,
        starts_new_paragraph: d.starts_new_paragraph ?? false,
      });
    }
  }

  // Force first segment to start a new paragraph
  if (!decisionMap.has(0)) {
    decisionMap.set(0, {
      order_index: 0,
      section_header: null,
      starts_new_paragraph: true,
    });
  } else {
    const first = decisionMap.get(0)!;
    decisionMap.set(0, { ...first, starts_new_paragraph: true });
  }

  // Fill in default decisions for segments not mentioned
  const resultArray: SegmentFormatDecision[] = segments.map((s) => {
    const d = decisionMap.get(s.order_index);
    if (d) return d;
    return {
      order_index: s.order_index,
      section_header: null,
      starts_new_paragraph: false,
    };
  });

  return resultArray;
}
