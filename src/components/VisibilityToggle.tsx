// ABOUTME: Switch that flips a replay between private and public showcase visibility.
// ABOUTME: Writes directly to the replays table and toasts the result.
'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VisibilityToggleProps {
  replayId: string;
  initialVisibility: string;
  onVisibilityChange?: (newVisibility: string) => void;
}

export default function VisibilityToggle({
  replayId,
  initialVisibility,
  onVisibilityChange,
}: VisibilityToggleProps) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isUpdating, setIsUpdating] = useState(false);
  const isPublic = visibility === 'public';
  const supabase = createClient();
  const { toast } = useToast();

  const toggleVisibility = async () => {
    try {
      setIsUpdating(true);
      const newVisibility = isPublic ? 'private' : 'public';

      const { error } = await supabase
        .from('replays')
        .update({ visibility: newVisibility })
        .eq('id', replayId);

      if (error) throw error;

      setVisibility(newVisibility);
      if (onVisibilityChange) {
        onVisibilityChange(newVisibility);
      }

      toast({
        title: 'Visibility updated',
        description: `Replay is now ${newVisibility}`,
      });
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast({
        variant: 'destructive',
        title: 'Could not change visibility',
        description: 'Try again in a moment.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // An unlisted replay stays out of the showcase, but its ballchasing.com link
  // works for anyone holding it, so it cannot claim to be for the owner alone.
  const visibilityDescription = isPublic
    ? 'Anyone with the link can see this replay in the showcase.'
    : visibility === 'unlisted'
      ? 'Unlisted: not in the showcase, but anyone with the ballchasing.com link can open it.'
      : 'Only you can see this replay.';

  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <Switch
                id="visibility-toggle"
                checked={isPublic}
                onCheckedChange={toggleVisibility}
                disabled={isUpdating}
                aria-label="Toggle replay visibility"
              />
              <Label
                htmlFor="visibility-toggle"
                className="cursor-pointer flex items-center gap-1"
              >
                {isPublic ? (
                  <>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span>Private</span>
                  </>
                )}
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent>{visibilityDescription}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
