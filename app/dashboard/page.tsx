import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 700, color: "#FFFFFF" }}
        >
          Welcome to Eyeballs.ai
        </h1>
        <p
          className="mt-3"
          style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#A1A1A1" }}
        >
          Turn viral content into your next script. Here&apos;s how to get started.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-stagger-fade-up">
        {/* Step 1: Scraper */}
        <Link
          href="/dashboard/scraper"
          className="group flex flex-col p-6 rounded-xl glass-card transition-all hover:scale-[1.02]"
        >
          <div
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-lg"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#FF2D2D", background: "rgba(255, 45, 45, 0.1)" }}
          >
            1
          </div>
          <h2
            style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "16px", color: "#FAFAFA" }}
          >
            Scrape creators
          </h2>
          <p
            className="mt-2"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1", lineHeight: 1.5 }}
          >
            Add your favorite creators and download their top-performing content from Instagram.
          </p>
          <span
            className="mt-4 inline-block"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: "#FF2D2D" }}
          >
            Start scraping &rarr;
          </span>
        </Link>

        {/* Step 2: Library */}
        <Link
          href="/dashboard/library"
          className="group flex flex-col p-6 rounded-xl glass-card transition-all hover:scale-[1.02]"
        >
          <div
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-lg"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#00D4D4", background: "rgba(0, 212, 212, 0.1)" }}
          >
            2
          </div>
          <h2
            style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "16px", color: "#FAFAFA" }}
          >
            Browse your library
          </h2>
          <p
            className="mt-2"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1", lineHeight: 1.5 }}
          >
            Filter, sort, and explore analyzed content. Find the hooks and patterns that go viral.
          </p>
          <span
            className="mt-4 inline-block"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: "#00D4D4" }}
          >
            Open library &rarr;
          </span>
        </Link>

        {/* Step 3: Scripts */}
        <Link
          href="/dashboard/scripts"
          className="group flex flex-col p-6 rounded-xl glass-card transition-all hover:scale-[1.02]"
        >
          <div
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-lg"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "#FF2D2D", background: "rgba(255, 45, 45, 0.1)" }}
          >
            3
          </div>
          <h2
            style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "16px", color: "#FAFAFA" }}
          >
            Generate scripts
          </h2>
          <p
            className="mt-2"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#A1A1A1", lineHeight: 1.5 }}
          >
            AI writes scripts in your brand voice using the best-performing content as inspiration.
          </p>
          <span
            className="mt-4 inline-block"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: "#FF2D2D" }}
          >
            Create script &rarr;
          </span>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3 animate-stagger-fade-up">
        {[
          { label: "Creators tracked", value: "0", color: "#00D4D4" },
          { label: "Content analyzed", value: "0", color: "#FF2D2D" },
          { label: "Scripts generated", value: "0", color: "#FF2D2D" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-xl glass-card"
          >
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#6B6B6B", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {stat.label}
            </p>
            <p
              className="mt-2 animate-count-up"
              style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 500, color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="mt-8 p-5 rounded-xl glass-card">
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#A1A1A1", lineHeight: 1.6 }}>
          <span style={{ color: "#FF2D2D", fontFamily: "var(--font-heading)", fontSize: "12px", fontWeight: 600 }}>Pro tip:</span>{" "}
          Start by scraping 2-3 creators in your niche. The AI works best when it has at least 20 pieces of content to analyze patterns from.
        </p>
      </div>
    </div>
  );
}
