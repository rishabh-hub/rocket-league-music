// ABOUTME: Public showcase page displaying community-shared Rocket League replays.
// ABOUTME: Lists public replays newest first with game summaries and navigation to details.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowUpRight, FileUp, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Variants, motion } from 'motion/react';
import { Replay } from '@/types/replay';
import { formatDate } from '@/utils/formatDate';
import { matchSummary } from '@/utils/matchSummary';

// A replay carries the New badge for this long after it is uploaded.
const NEW_REPLAY_WINDOW_MS = 24 * 60 * 60 * 1000;

export default function ShowcasePage() {
  const router = useRouter();
  const supabase = createClient();

  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShowcaseReplays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch public replays from the database
      const { data, error } = await supabase
        .from('replays')
        .select('*')
        .eq('visibility', 'public')
        .eq('status', 'ready') // Only show ready replays
        .order('created_at', { ascending: false })
        .limit(10); // Limit to recent 10 showcase replays

      if (error) {
        throw error;
      }

      setReplays(data || []);
    } catch (err: any) {
      console.error('Error fetching showcase replays:', err);
      setError(err.message || 'Failed to fetch showcase replays');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchShowcaseReplays();
  }, [fetchShowcaseReplays]);

  // Card variants for framer-motion
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] },
    },
  };

  return (
    <div className="container py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Showcase</h1>
          <p className="text-muted-foreground mt-2">
            Real matches other players made public, and the songs each one
            produced. Newest first.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Could not load the showcase
              </h2>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchShowcaseReplays}
              >
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : replays.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nothing public yet</h2>
              <p className="text-muted-foreground mb-4">
                Set a replay to Public when you upload it and it shows up here.
              </p>
              <Button onClick={() => router.push('/upload-replay')}>
                Upload a replay
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show">
          {replays.map((replay) => {
            const summary = matchSummary(replay);
            const isNew =
              Date.now() - new Date(replay.created_at).getTime() <
              NEW_REPLAY_WINDOW_MS;

            return (
              <motion.div key={replay.id} variants={item} className="mb-4">
                <Card className="transition-colors duration-instant hover:border-border/80">
                  <CardContent className="p-0">
                    <div
                      className="cursor-pointer p-4"
                      onClick={() => router.push(`/replays/${replay.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/replays/${replay.id}`);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View analysis for ${summary.primary}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            {summary.primary}
                          </h3>
                          <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-2">
                            {summary.secondary && (
                              <>
                                <span>{summary.secondary}</span>
                                <span className="mx-2">·</span>
                              </>
                            )}
                            <span>{formatDate(replay.created_at)}</span>
                          </div>
                          {isNew && <Badge variant="secondary">New</Badge>}
                        </div>
                        <ArrowUpRight className="h-4 w-4 mt-1 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
