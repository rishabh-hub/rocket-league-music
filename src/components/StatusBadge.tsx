// ABOUTME: Reusable badge component for displaying replay processing status.
// ABOUTME: Renders appropriate colors and icons for uploaded, processing, pending, ready, and failed states.
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

/**
 * Renders a colored badge with an icon based on replay processing status.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'uploaded':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-transparent bg-muted text-muted-foreground"
        >
          <Clock className="h-3 w-3" /> Queued
        </Badge>
      );
    case 'processing':
    case 'pending':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/25"
        >
          <Loader2 className="h-3 w-3 animate-spin" /> Reading stats
        </Badge>
      );
    case 'ready':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-transparent bg-primary/15 text-primary ring-1 ring-inset ring-primary/30"
        >
          <CheckCircle2 className="h-3 w-3" /> Ready
        </Badge>
      );
    case 'failed':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-transparent bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25"
        >
          <AlertTriangle className="h-3 w-3" /> Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="capitalize">
          {status}
        </Badge>
      );
  }
}
