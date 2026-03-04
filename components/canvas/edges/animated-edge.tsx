"use client";

import { type EdgeProps, getBezierPath } from "@xyflow/react";

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const pathId = `edge-path-${id}`;
  const baseOpacity = selected ? 0.7 : undefined;

  return (
    <>
      {/* SVG Filters (defined per edge for isolation) */}
      <defs>
        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`particle-glow-${id}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Invisible wider path for easier hover/click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />

      {/* Base glow line */}
      <path
        id={pathId}
        d={edgePath}
        fill="none"
        stroke="rgba(99, 102, 241, 0.4)"
        strokeWidth={2}
        filter={`url(#glow-${id})`}
        className={selected ? "" : "animate-pulse-opacity"}
        style={baseOpacity !== undefined ? { opacity: baseOpacity } : undefined}
      />

      {/* Brighter core line */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(99, 102, 241, 0.6)"
        strokeWidth={1}
        style={{ opacity: selected ? 0.9 : 0.5 }}
      />

      {/* Animated particle */}
      <circle
        r={4}
        fill="#818CF8"
        filter={`url(#particle-glow-${id})`}
      >
        <animateMotion
          dur="2.5s"
          repeatCount="indefinite"
        >
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>

      {/* Second particle offset for richer effect */}
      <circle
        r={2.5}
        fill="#A5B4FC"
        opacity={0.6}
      >
        <animateMotion
          dur="2.5s"
          repeatCount="indefinite"
          begin="1.25s"
        >
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
    </>
  );
}
