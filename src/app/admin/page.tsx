import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLogin from "./admin-login";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated =
    cookieStore.get("admin_session")?.value === "authenticated";

  if (isAuthenticated) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold mb-2 text-center">Admin</h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Enter the admin password to continue.
      </p>
      <AdminLogin />
    </div>
  );
}
