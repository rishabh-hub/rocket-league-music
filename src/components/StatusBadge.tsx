// ABOUTME: Reusable badge component for displaying replay processing status.
// ABOUTME: Renders appropriate colors and icons for uploaded, processing, ready, and failed states.
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
          className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
        >
          <Clock className="h-3 w-3" /> Uploaded
        </Badge>
      );
    case 'processing':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
        >
          <Loader2 className="h-3 w-3 animate-spin" /> Processing
        </Badge>
      );
    case 'ready':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
        >
          <CheckCircle2 className="h-3 w-3" /> Ready
        </Badge>
      );
    case 'failed':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
        >
          <AlertTriangle className="h-3 w-3" /> Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
