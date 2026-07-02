import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/admin-auth";
import { callGemini } from "@/lib/gemini";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch the video and its transcript
  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const { data: segments } = await supabase
    .from("transcript_segments")
    .select("text")
    .eq("video_id", id)
    .order("order_index", { ascending: true });

  if (!segments || segments.length === 0) {
    return NextResponse.json(
      { error: "No transcript segments found for this video" },
      { status: 400 },
    );
  }

  const transcriptText = segments.map((s) => s.text).join(" ");

  const systemPrompt =
    "You are a helpful assistant that analyzes video transcripts. " +
    "Return ONLY valid JSON with this exact structure (no markdown, no code fences): " +
    '{ "summary": "2-3 sentence summary", "key_takeaways": ["takeaway1", "takeaway2", ...], "chapters": [{"title": "Chapter name", "start_time": 0}, ...], "formatted_sections": [{"heading": "Section title", "start_time": 0, "end_time": 45, "paragraphs": ["Sentence group 1.", "Sentence group 2."]}, ...] }';

  const userPrompt = `Analyze this transcript and return a summary, key takeaways (4-6), chapters with timestamps, and formatted_sections.\n\nFor formatted_sections: Group the transcript into readable sections with paragraph breaks and section headings. Do NOT change, paraphrase, or reorder any words — only add headings and paragraph breaks. Each section must include its start_time and end_time based on the original transcript timing. Output 3–8 sections depending on transcript length.\n\nTranscript:\n${transcriptText}`;

  try {
    const aiContent = await callGemini(systemPrompt, userPrompt);

    const aiResult = JSON.parse(aiContent);
    const chapters = (aiResult.chapters ?? []).map(
      (ch: { title?: string; start_time?: number }) => ({
        title: ch.title ?? "",
        start_time: Math.round(ch.start_time ?? 0),
      }),
    );

    await supabase
      .from("videos")
      .update({
        ai_summary: aiResult.summary ?? null,
        key_takeaways: aiResult.key_takeaways ?? [],
        chapters,
        formatted_transcript: aiResult.formatted_sections ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Regenerate AI error:", err);
    return NextResponse.json(
      { error: "AI regeneration failed" },
      { status: 500 },
    );
  }
}
