// ABOUTME: Inline monospace path chip with a copy-to-clipboard affordance.
// ABOUTME: Achromatic by design — globals.css reserves colour for CTAs, focus and state.
'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface CopyablePathProps {
  path: string;
  className?: string;
}

export function CopyablePath({ path, className }: CopyablePathProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable on insecure origins or when permission is
      // denied. The path stays selectable, so copying by hand still works.
    }
  };

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-muted px-1.5 py-0.5 align-middle',
        className
      )}
    >
      <code className="break-all font-mono text-xs text-foreground">
        {path}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Path copied' : `Copy path: ${path}`}
        className="-mr-0.5 inline-flex shrink-0 rounded-xs p-0.5 text-muted-foreground transition-colors duration-instant ease-standard hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        {copied ? (
          <Check className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Copy className="h-3 w-3" aria-hidden="true" />
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Path copied to clipboard' : ''}
      </span>
    </span>
  );
}
