"use client";

import { useEffect, useState } from "react";

export interface WheelPrize {
  id: string;
  label: string;
}

interface WheelProps {
  prizes: WheelPrize[];
  /** Degrees (0-360) measured clockwise from the top, matching the server's slice layout. Undefined = idle. */
  stopAngle?: number;
  /** Bump this on every new spin so the component knows to animate even if stopAngle repeats. */
  spinToken?: number;
  size?: number;
}

const SLICE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#8b5cf6", "#84cc16"];

export function Wheel({ prizes, stopAngle, spinToken, size = 360 }: WheelProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (stopAngle === undefined) return;
    setRotation((prev) => {
      const target = (360 - stopAngle + 360) % 360;
      const delta = ((target - (prev % 360)) + 360) % 360;
      return prev + 5 * 360 + delta;
    });
    // Re-run only when a fresh spin result arrives, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken]);

  const sliceAngle = prizes.length > 0 ? 360 / prizes.length : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
          style={{
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "22px solid #facc15",
          }}
        />
        <div
          className="h-full w-full rounded-full border-4 border-slate-800 shadow-2xl transition-transform ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: "4s",
            background:
              prizes.length > 0
                ? `conic-gradient(${prizes
                    .map((_, i) => `${SLICE_COLORS[i % SLICE_COLORS.length]} ${i * sliceAngle}deg ${
                        (i + 1) * sliceAngle
                      }deg`)
                    .join(", ")})`
                : "#1e293b",
          }}
        >
          {prizes.map((prize, i) => (
            <div
              key={prize.id}
              className="absolute left-1/2 top-1/2 origin-left text-xs font-semibold text-white"
              style={{
                transform: `rotate(${i * sliceAngle + sliceAngle / 2}deg) translateX(${size / 2 - 36}px) translateY(-50%)`,
                width: 72,
                textAlign: "center",
              }}
            >
              {prize.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
