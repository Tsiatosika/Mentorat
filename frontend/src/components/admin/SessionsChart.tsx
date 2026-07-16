'use client';

interface SessionsByMonth {
  mois: string;
  total: number;
}

interface SessionsChartProps {
  data: SessionsByMonth[];
  maxValue?: number;
}

export function SessionsChart({ data, maxValue }: SessionsChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.total), 1);
  
  const monthLabels: Record<string, string> = {
    '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
    '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
  };

  return (
    <div className="sessions-chart">
      <div className="chart-bars">
        {data.map((item) => {
          const month = item.mois.split('-')[1];
          const label = monthLabels[month] || item.mois;
          const height = (item.total / max) * 100;
          
          return (
            <div key={item.mois} className="chart-bar-wrapper">
              <div className="chart-bar-container">
                <div 
                  className="chart-bar"
                  style={{ height: `${height}%` }}
                >
                  <span className="chart-bar-value">{item.total}</span>
                </div>
              </div>
              <span className="chart-bar-label">{label}</span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .sessions-chart {
          width: 100%;
        }
        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 180px;
          gap: 8px;
          padding: 0 8px;
        }
        .chart-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .chart-bar-container {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .chart-bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(180deg, #3B82F6, #8B5CF6);
          border-radius: 8px 8px 0 0;
          position: relative;
          transition: all 0.5s ease;
          min-height: 4px;
        }
        .chart-bar:hover {
          filter: brightness(1.2);
          transform: scaleY(1.05);
          transform-origin: bottom;
        }
        .chart-bar-value {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.65rem;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
          color: var(--text-primary);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .chart-bar:hover .chart-bar-value {
          opacity: 1;
        }
        .chart-bar-label {
          font-size: 0.65rem;
          color: var(--text-tertiary);
          margin-top: 8px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}