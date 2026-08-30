// components/LoadingSpinner.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3 gap-[2px]',
    md: 'h-5 w-5 gap-[3px]',
    lg: 'h-8 w-8 gap-1',
  };

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn('flex items-end', sizeClasses[size])}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-full w-[3px] flex-1 origin-bottom rounded-[1px] bg-primary motion-safe:animate-meter"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
