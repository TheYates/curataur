import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: video, error } = await supabase
    .from("videos")
    .select("*, channels(name), categories(name)")
    .eq("id", id)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Also fetch transcript segments
  const { data: segments } = await supabase
    .from("transcript_segments")
    .select("*")
    .eq("video_id", id)
    .order("order_index", { ascending: true });

  return NextResponse.json({ video, segments });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  // Build update object from allowed fields
  const allowedFields = [
    "title",
    "slug",
    "difficulty",
    "category_id",
    "status",
    "ai_summary",
    "key_takeaways",
    "chapters",
    "formatted_transcript",
    "thumbnail_url",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  // Handle category name → id resolution if category_name is provided
  if (body.category_name && typeof body.category_name === "string") {
    const catSlug = body.category_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    const { data: category } = await supabase
      .from("categories")
      .upsert(
        { name: body.category_name.trim(), slug: catSlug },
        { onConflict: "name" },
      )
      .select("id")
      .single();

    if (category) {
      updates.category_id = category.id;
    }
    delete updates.category_name;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("videos")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
