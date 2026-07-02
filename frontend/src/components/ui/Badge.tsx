interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  pulse?: boolean;
  dot?: boolean;
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm',
  pulse = false,
  dot = false,
  className = ''
}: BadgeProps) {
  const variants = {
    default: { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    success: { bg: 'var(--success-soft)', color: 'var(--success)' },
    warning: { bg: 'var(--warm-soft)', color: 'var(--warm-text-on-soft)' },
    danger: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    info: { bg: 'var(--info-soft)', color: 'var(--info)' },
  };
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };
  
  const v = variants[variant];
  
  return (
    <span
      className={`badge ${sizes[size]} ${pulse ? 'badge-pulse' : ''} ${dot ? 'badge-dot' : ''} ${className}`}
      style={{ backgroundColor: v.bg, color: v.color }}
    >
      {children}
    </span>
  );
}