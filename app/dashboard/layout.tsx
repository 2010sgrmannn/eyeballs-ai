import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <span className="text-lg font-semibold">eyeballs.ai</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.email}</span>
          <LogoutButton />
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
