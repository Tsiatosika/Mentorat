interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ 
  value, 
  max = 100, 
  color = 'var(--accent)', 
  showLabel = true,
  label = 'Progression',
  size = 'md'
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const heights = {
    sm: '4px',
    md: '8px',
    lg: '12px'
  };
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span className="font-mono-data font-semibold" style={{ color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="progress-bar" style={{ height: heights[size] }}>
        <div
          className="progress-bar-fill"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color,
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
    </div>
  );
}