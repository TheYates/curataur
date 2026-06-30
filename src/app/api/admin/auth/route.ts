import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, error: "Invalid password" },
    { status: 401 },
  );
}

export async function GET() {
  // Check if already authenticated
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_session")?.value === "authenticated";

  return NextResponse.json({ authenticated: isAdmin });
}
