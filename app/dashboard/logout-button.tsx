"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-3 py-1.5 text-sm rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        border: "1px solid #333333",
        color: "#A1A1A1",
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        fontWeight: 500,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#FF2D2D";
        e.currentTarget.style.color = "#FAFAFA";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#333333";
        e.currentTarget.style.color = "#A1A1A1";
      }}
    >
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}
