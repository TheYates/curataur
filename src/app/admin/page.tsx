import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminSession } from "@/lib/admin-auth";
import AdminLogin from "./admin-login";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    if (await isAdminSession(user.id)) {
      redirect("/admin/dashboard");
    }
    // Signed in but not in admin_users — show error instead of looping
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Signed in as <strong>{user.email}</strong>, but that account is not
          authorized for admin access.
        </p>
        <AdminLogin />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold mb-2 text-center">Admin</h1>
      <p className="text-sm text-muted-foreground text-center mb-8">
        Enter your email to receive a one-time sign-in link.
      </p>
      <AdminLogin />
    </div>
  );
}
