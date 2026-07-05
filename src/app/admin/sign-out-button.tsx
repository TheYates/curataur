"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}
