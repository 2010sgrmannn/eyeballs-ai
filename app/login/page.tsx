"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "#0A0A0A" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(18px, 2.5vw, 24px)",
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            Log in to Eyeballs.ai
          </h1>
          <p
            className="mt-3"
            style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}
          >
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="px-4 py-3 text-sm rounded-lg"
              style={{
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.08)",
                color: "#EF4444",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "#A1A1A1",
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF2D2D]"
              style={{
                border: "1px solid #1F1F1F",
                background: "#111111",
                color: "#FAFAFA",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "#A1A1A1",
                fontWeight: 500,
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF2D2D]"
              style={{
                border: "1px solid #1F1F1F",
                background: "#111111",
                color: "#FAFAFA",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              border: "1px solid #FF2D2D",
              background: "#FF2D2D",
              color: "#FFFFFF",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p
          className="text-center"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#888888" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="transition-colors hover:text-[#FF5555]"
            style={{ color: "#FF2D2D" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
