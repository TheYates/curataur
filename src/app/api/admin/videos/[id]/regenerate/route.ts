import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function POST() {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  return NextResponse.json(
    { error: "AI regeneration is temporarily disabled (Gemini quota exhausted, Groq request too large)." },
    { status: 503 },
  );
}
