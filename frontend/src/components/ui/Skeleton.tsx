interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <Skeleton width="48px" height="48px" className="rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height="16px" />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>
      <Skeleton width="100%" height="12px" />
      <Skeleton width="80%" height="12px" />
      <div className="flex gap-2 pt-2">
        <Skeleton width="100px" height="32px" className="rounded-lg" />
        <Skeleton width="100px" height="32px" className="rounded-lg" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-fade-in">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 card">
          <Skeleton width="40px" height="40px" className="rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton width="50%" height="14px" />
            <Skeleton width="30%" height="10px" />
          </div>
          <Skeleton width="80px" height="28px" className="rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6 flex items-center gap-4">
        <Skeleton width="80px" height="80px" className="rounded-full" />
        <div className="space-y-2">
          <Skeleton width="200px" height="20px" />
          <Skeleton width="150px" height="14px" />
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <Skeleton width="120px" height="18px" />
        <Skeleton width="100%" height="40px" className="rounded-lg" />
        <Skeleton width="100%" height="40px" className="rounded-lg" />
        <Skeleton width="100%" height="100px" className="rounded-lg" />
      </div>
    </div>
  );
}