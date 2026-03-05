import Link from "next/link";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: "#080a0c" }}
    >
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 700,
          color: "#FFFFFF",
          letterSpacing: "1px",
        }}
      >
        EYEBALLS.AI
      </h1>
      <p
        className="mt-4"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "16px",
          color: "#A1A1A1",
        }}
      >
        Turn viral content into your next script.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="px-6 py-2.5 text-sm rounded-lg transition-all"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            fontWeight: 500,
            border: "1px solid #333333",
            color: "#f0f2f5",
            background: "transparent",
          }}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="px-6 py-2.5 text-sm rounded-lg transition-all"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            fontWeight: 500,
            border: "1px solid #ff3333",
            color: "#FFFFFF",
            background: "#ff3333",
          }}
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
