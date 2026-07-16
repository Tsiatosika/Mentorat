'use client';

interface DomainItem {
  domaine: string;
  total: number;
}

interface DomainDistributionProps {
  data: DomainItem[];
}

const DOMAIN_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', 
  '#06B6D4', '#EF4444', '#6366F1', '#14B8A6', '#F97316'
];

export function DomainDistribution({ data }: DomainDistributionProps) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="domain-distribution">
      {data.slice(0, 8).map((item, idx) => {
        const percentage = total > 0 ? (item.total / total) * 100 : 0;
        const color = DOMAIN_COLORS[idx % DOMAIN_COLORS.length];
        
        return (
          <div key={item.domaine} className="domain-item">
            <div className="domain-header">
              <div className="domain-name">
                <span className="domain-dot" style={{ backgroundColor: color }} />
                <span>{item.domaine}</span>
              </div>
              <span className="domain-count">{item.total}</span>
            </div>
            <div className="domain-bar-bg">
              <div 
                className="domain-bar-fill"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .domain-distribution {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .domain-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .domain-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .domain-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .domain-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .domain-count {
          font-size: 0.8rem;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
          color: var(--text-primary);
        }
        .domain-bar-bg {
          width: 100%;
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
        }
        .domain-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1s ease;
        }
      `}</style>
    </div>
  );
}