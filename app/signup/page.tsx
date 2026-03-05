"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // If Supabase returns a session, email confirmation is disabled — go straight in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        // Email confirmation required — show the user a message
        setConfirmationSent(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    border: "1px solid rgba(255, 255, 255, 0.07)",
    background: "#0e1115",
    color: "#f0f2f5",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    color: "#A1A1A1",
    fontWeight: 500 as const,
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "#080a0c" }}
    >
      <div className="w-full max-w-sm space-y-6">
        {confirmationSent ? (
          <div className="text-center space-y-4">
            <div
              className="mx-auto flex items-center justify-center"
              style={{ width: 56, height: 56 }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00D4D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(18px, 2.5vw, 24px)",
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              Check your email
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1", lineHeight: 1.6 }}>
              We sent a confirmation link to <span style={{ color: "#f0f2f5", fontWeight: 500 }}>{email}</span>.
              Click the link in the email to activate your account, then come back and log in.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 px-6 py-2.5 rounded-lg transition-all hover:opacity-90"
              style={{
                background: "#ff3333",
                color: "#FFFFFF",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Go to login
            </Link>
          </div>
        ) : (
        <>
        <div className="text-center">
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(18px, 2.5vw, 24px)",
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            Create your account
          </h1>
          <p
            className="mt-3"
            style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}
          >
            Sign up to get started with Eyeballs.ai
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
                color: "#ff3333",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" style={labelStyle}>
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff3333]"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              border: "1px solid #ff3333",
              background: "#ff3333",
              color: "#FFFFFF",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p
          className="text-center"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="transition-colors hover:text-[#FF5555]"
            style={{ color: "#ff3333" }}
          >
            Log in
          </Link>
        </p>
        </>
        )}
      </div>
    </main>
  );
}
