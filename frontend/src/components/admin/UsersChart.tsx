'use client';

interface UsersByMonth {
  mois: string;
  total: number;
}

interface UsersChartProps {
  data: UsersByMonth[];
}

export function UsersChart({ data }: UsersChartProps) {
  const max = Math.max(...data.map(d => d.total), 1);
  
  const monthLabels: Record<string, string> = {
    '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
    '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
  };

  return (
    <div className="users-chart">
      <svg viewBox={`0 0 ${data.length * 80} 200`} className="chart-svg">
        {/* Ligne de fond */}
        <line x1="0" y1="180" x2={data.length * 80} y2="180" stroke="var(--border)" strokeWidth="1" />
        
        {/* Points et lignes */}
        {data.map((item, idx) => {
          const x = idx * 80 + 40;
          const y = 180 - (item.total / max) * 160;
          const nextItem = data[idx + 1];
          
          return (
            <g key={item.mois}>
              {/* Ligne vers le point suivant */}
              {nextItem && (
                <line
                  x1={x}
                  y1={y}
                  x2={(idx + 1) * 80 + 40}
                  y2={180 - (nextItem.total / max) * 160}
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
              {/* Point */}
              <circle cx={x} cy={y} r="5" fill="#3B82F6" stroke="white" strokeWidth="2">
                <title>{item.total} inscrits</title>
              </circle>
              {/* Valeur */}
              <text x={x} y={y - 12} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                {item.total}
              </text>
              {/* Mois */}
              <text x={x} y={198} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">
                {monthLabels[item.mois.split('-')[1]] || item.mois}
              </text>
            </g>
          );
        })}
        
        {/* Dégradé */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>

      <style jsx>{`
        .users-chart {
          width: 100%;
          overflow-x: auto;
        }
        .chart-svg {
          width: 100%;
          min-width: 400px;
          height: auto;
        }
      `}</style>
    </div>
  );
}