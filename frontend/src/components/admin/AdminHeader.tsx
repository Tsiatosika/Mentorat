'use client';

import { ReactNode } from 'react';

// Fixed node/edge layout so SSR and client render identically (no Math.random).
const NODES = [
  { x: 6, y: 22 }, { x: 18, y: 62 }, { x: 30, y: 14 }, { x: 42, y: 48 },
  { x: 55, y: 20 }, { x: 63, y: 70 }, { x: 74, y: 34 }, { x: 86, y: 58 },
  { x: 95, y: 16 }, { x: 12, y: 88 }, { x: 68, y: 90 }, { x: 90, y: 84 },
];
const EDGES: [number, number][] = [
  [0, 1], [1, 3], [2, 3], [3, 4], [4, 6], [5, 6], [6, 7], [7, 8],
  [3, 5], [1, 9], [5, 10], [7, 11], [0, 2],
];

interface AdminHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** @deprecated no longer rendered — kept optional so existing call sites don't need to change */
  backHref?: string;
  /** @deprecated no longer rendered — kept optional so existing call sites don't need to change */
  backLabel?: string;
  accent: string;
  icon?: ReactNode;
  right?: ReactNode;
}

export default function AdminHeader({ eyebrow, title, subtitle, accent, icon, right }: AdminHeaderProps) {
  return (
    <div className="admin-header" style={{ position: 'relative', overflow: 'hidden', padding: '36px 24px 40px' }}>
      {/* Signature: connection lattice — echoes the mentor/mentee AI matching graph */}
      <svg
        className="admin-lattice-drift"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0.35, animation: 'adminLatticeDrift 14s ease-in-out infinite',
        }}
      >
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
            stroke={accent} strokeWidth="0.15" opacity="0.5"
          />
        ))}
        {NODES.map((n, i) => (
          <circle
            key={i} cx={n.x} cy={n.y} r={i % 3 === 0 ? 1.1 : 0.7}
            fill={accent}
            style={{ animation: `adminPulseDot ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite` }}
          />
        ))}
      </svg>

      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="admin-fade-up">
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <span
                className="text-xs font-bold uppercase"
                style={{ color: accent, letterSpacing: '0.14em' }}
              >
                {eyebrow}
              </span>
            </div>
            <h1 className="admin-display admin-header-title text-3xl md:text-4xl font-bold">{title}</h1>
            <p className="admin-header-subtitle mt-1.5">{subtitle}</p>
          </div>
          {right && (
            <div className="admin-fade-up flex items-center gap-3 flex-wrap" style={{ ['--base-delay' as any]: '120ms' }}>
              {right}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}