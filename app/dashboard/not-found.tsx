import Link from "next/link";

export default function DashboardNotFound() {
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
          className="mx-auto mb-4"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "48px",
            fontWeight: 700,
            color: "#FF2D2D",
          }}
        >
          404
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
          Page not found
        </h2>

        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "#888",
          }}
        >
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          href="/dashboard"
          className="inline-block rounded-lg px-6 py-2.5 font-medium transition-colors"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            background: "#FF2D2D",
            color: "#fff",
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
