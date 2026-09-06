// ABOUTME: Share sheet for a public match page: the link, X, Discord, and the OS share sheet.
// ABOUTME: Discord has no web share intent, so that option copies a message to paste instead.

'use client';

import { useState } from 'react';
import { Check, Copy, Link2, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface ShareDialogProps {
  /** The page being shared. */
  url: string;
  /** How the match reads in a sentence — its title, or the scoreline. */
  summary: string;
}

/**
 * What gets posted, in the player's name rather than the app's.
 *
 * The match and the music sit either side of one comma, because the pairing is
 * the whole point and a stat on its own is not worth anyone's timeline. It ends
 * without a full stop and reads lowercase after the summary, since that is how
 * a result gets typed on a phone, and the scoreline's en dash becomes a hyphen
 * for the same reason — correct typography is what marks a line as written by
 * software. Nothing here names or explains the app: a stranger should be able
 * to read it as plain English and still feel the strangeness of the pairing.
 */
export function sharePost(summary: string): string {
  return `${summary.replace(/–/g, '-')}, and this is what it sounded like`;
}

export function ShareDialog({ url, summary }: ShareDialogProps) {
  const [copied, setCopied] = useState<'link' | 'discord' | null>(null);
  const { toast } = useToast();

  const post = sharePost(summary);

  const copy = async (text: string, which: 'link' | 'discord') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard is unavailable on insecure origins and when permission is
      // denied, and the browser gives no way to ask first.
      toast({
        title: 'Could not copy',
        description: 'Your browser blocked clipboard access.',
        variant: 'destructive',
      });
    }
  };

  const openX = () => {
    const intent = new URL('https://twitter.com/intent/tweet');
    intent.searchParams.set('text', post);
    intent.searchParams.set('url', url);
    window.open(intent.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this match</DialogTitle>
          <DialogDescription>{post}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => copy(url, 'link')}
            className="justify-start gap-2"
          >
            {copied === 'link' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {copied === 'link' ? 'Link copied' : 'Copy link'}
          </Button>

          <Button
            variant="outline"
            onClick={openX}
            className="justify-start gap-2"
          >
            <Share2 className="h-4 w-4" />
            Post on X
          </Button>

          <Button
            variant="outline"
            onClick={() => copy(`${post}\n${url}`, 'discord')}
            className="justify-start gap-2"
          >
            {copied === 'discord' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied === 'discord' ? 'Copied for Discord' : 'Copy for Discord'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
