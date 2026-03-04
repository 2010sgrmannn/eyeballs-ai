"use client";

export function GlowingBorder({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glow-border relative rounded-2xl p-[2px] ${className}`}>
      <div className="relative z-10 rounded-2xl bg-[#0F1923] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
