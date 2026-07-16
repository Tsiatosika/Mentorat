'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  trend?: { value: number; positive: boolean };
}

export function StatsCard({ label, value, icon: Icon, color, bg, trend }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="flex items-center justify-between mb-3">
        <div className="stats-card-icon" style={{ backgroundColor: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span 
            className="stats-card-trend"
            style={{ color: trend.positive ? '#10B981' : '#EF4444' }}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div className="stats-card-value">{value}</div>
      <div className="stats-card-label">{label}</div>
      
      <style jsx>{`
        .stats-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.3s ease;
          cursor: default;
        }
        .stats-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border-color: ${color};
        }
        .stats-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }
        .stats-card:hover .stats-card-icon {
          transform: scale(1.1) rotate(-5deg);
        }
        .stats-card-trend {
          font-size: 0.75rem;
          font-weight: 600;
        }
        .stats-card-value {
          font-size: 1.75rem;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          color: var(--text-primary);
        }
        .stats-card-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}