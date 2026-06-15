'use client';

import { useEffect, useState } from 'react';

interface CallTimerProps {
  isActive: boolean;
  onStart?: () => void;
  onStop?: () => void;
}

export function CallTimer({ isActive, onStart, onStop }: CallTimerProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      setDuration(0);
      if (onStart) onStart();
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (onStop && duration > 0) onStop();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive && duration === 0) return null;

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
      <span className="text-white font-mono text-sm">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
