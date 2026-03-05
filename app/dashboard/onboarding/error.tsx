"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[onboarding] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-xl border p-8 text-center"
        style={{
          background: "rgba(20, 20, 20, 0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid #2A2A2A",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(255, 45, 45, 0.1)" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF2D2D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2
          className="mb-2"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "20px",
            fontWeight: 700,
            color: "#E0E0E0",
          }}
        >
          Onboarding error
        </h2>

        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "#888",
          }}
        >
          Something went wrong during setup. You can try again or return to the
          dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-6 py-2.5 font-medium transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              background: "#FF2D2D",
              color: "#fff",
            }}
          >
            Try again
          </button>

          <Link
            href="/dashboard"
            className="rounded-lg border px-6 py-2.5 font-medium transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              border: "1px solid #2A2A2A",
              background: "transparent",
              color: "#888",
            }}
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
