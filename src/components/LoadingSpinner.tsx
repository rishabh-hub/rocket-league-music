// components/LoadingSpinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
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
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={cn(`animate-spin ${sizeClasses[size]}`, className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
