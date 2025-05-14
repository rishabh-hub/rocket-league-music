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
  const [isPublic, setIsPublic] = useState(initialVisibility === 'public');
  const [isUpdating, setIsUpdating] = useState(false);
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

      setIsPublic(!isPublic);
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
        title: 'Update failed',
        description: 'Could not update replay visibility',
      });
    } finally {
      setIsUpdating(false);
    }
  };

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
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-amber-500" />
                    <span>Private</span>
                  </>
                )}
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isPublic
              ? 'This replay is visible in the public showcase'
              : 'Make this replay visible in the public showcase'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
