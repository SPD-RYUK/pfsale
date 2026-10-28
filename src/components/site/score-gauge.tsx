"use client";
// Radial/gauge readiness score visualization. In Phase A the score is
// admin-assigned (manual), so it's labeled "Assigned by PatentSale team" —
// never presented as an algorithmic output it isn't. Prompt 3 introduces
// computed scoring.
import { useEffect, useState } from "react";
import { useReducedMotion, animate, motion } from "framer-motion";
import { scoreColor, scoreLabel } from "@/lib/format";

export function ScoreGauge({
  score,
  size = 120,
  label = "Commercial Readiness",
  showAssignedBy = true,
}: {
  score: number | null | undefined;
  size?: number;
  label?: string;
  showAssignedBy?: boolean;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const hasScore = score != null;
  const target = hasScore ? Math.max(0, Math.min(100, score)) : 0;

  useEffect(() => {
    if (!hasScore || reduce) {
      // Non-animated path: defer the set to avoid a synchronous setState in effect.
      const raf = requestAnimationFrame(() => setDisplay(target));
      return () => cancelAnimationFrame(raf);
    }
    const controls = animate(0, target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [target, hasScore, reduce]);

  const stroke = size * 0.085;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270° gauge
  const offset = c - (display / 100) * c * arc;
  const colorClass = scoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-[135deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/50"
            strokeDasharray={`${c * arc} ${c}`}
            strokeLinecap="round"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className={colorClass}
            strokeDasharray={`${c * arc} ${c}`}
            strokeLinecap="round"
            initial={false}
            style={{ strokeDashoffset: offset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold tabular-nums ${colorClass}`}>
            {hasScore ? Math.round(display) : "—"}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className={`text-xs font-semibold ${colorClass}`}>{scoreLabel(score)}</p>
        {showAssignedBy ? (
          <p className="mt-0.5 text-[10px] text-muted-foreground">Assigned by PatentSale team</p>
        ) : null}
      </div>
    </div>
  );
}
