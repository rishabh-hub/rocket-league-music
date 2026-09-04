// ABOUTME: Page displaying the user's uploaded Rocket League replay files.
// ABOUTME: Shows replay list with status badges and navigation to detail views.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Upload,
  FileUp,
  Globe,
  Link2,
  Lock,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';
import { Replay } from '@/types/replay';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime } from '@/utils/formatDate';
import { matchSummary } from '@/utils/matchSummary';

/**
 * How each stored visibility value reads to the person who uploaded the
 * replay. Unlisted is its own state: it stays out of the showcase, but the
 * ballchasing.com link works for anyone who has it.
 */
const VISIBILITY_STATES: Record<
  string,
  { icon: LucideIcon; label: string; detail: string }
> = {
  public: {
    icon: Globe,
    label: 'Public',
    detail: 'Listed in the showcase for everyone.',
  },
  unlisted: {
    icon: Link2,
    label: 'Unlisted',
    detail: 'Anyone with the ballchasing.com link can open it.',
  },
  private: {
    icon: Lock,
    label: 'Private',
    detail: 'Only you can see this replay.',
  },
};

/**
 * Renders a replay's stored visibility. An unrecognised value is shown as
 * itself rather than being flattened into one of the known states.
 */
function VisibilityLabel({ visibility }: { visibility: string }) {
  const state = VISIBILITY_STATES[visibility];

  if (!state) {
    return (
      <span className="text-xs capitalize text-muted-foreground">
        {visibility}
      </span>
    );
  }

  const Icon = state.icon;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-muted-foreground"
      title={state.detail}
    >
      <Icon className="h-3 w-3" />
      {state.label}
    </span>
  );
}

export default function ReplaysPage() {
  const router = useRouter();
  const supabase = createClient();

  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReplays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch replays from the database (filtered by current user)
      const { data, error } = await supabase
        .from('replays')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReplays(data || []);
    } catch (err: any) {
      console.error('Error fetching replays:', err);
      setError(err.message || 'Failed to fetch replays');
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchReplays();
  }, [fetchReplays]);

  return (
    <div className="container py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          <h1 className="text-3xl font-bold">Your Replays</h1>
          {replays.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1 tabular-nums">
              {replays.length} uploaded
            </p>
          )}
        </div>
        <Button onClick={() => router.push('/upload-replay')}>
          <Upload className="mr-2 h-4 w-4" /> Upload a replay
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
            ))}
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Could not load your replays
              </h2>
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchReplays}>
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
              <h2 className="text-xl font-semibold mb-2">
                Nothing uploaded yet
              </h2>
              <p className="text-muted-foreground mb-4">
                On Windows, Rocket League keeps your replays in{' '}
                <span className="font-mono text-xs text-foreground">
                  Documents\My Games\Rocket League\TAGame\Demos
                </span>
                . Grab your last match and drop it in.
              </p>
              <Button onClick={() => router.push('/upload-replay')}>
                Upload your first replay
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replays.map((replay) => {
                  const summary = matchSummary(replay);

                  return (
                    <TableRow key={replay.id}>
                      <TableCell className="font-medium tabular-nums">
                        {summary.primary}
                        {summary.secondary && (
                          <div className="text-xs font-normal text-muted-foreground">
                            {summary.secondary}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={replay.status} />
                      </TableCell>
                      <TableCell>
                        <VisibilityLabel visibility={replay.visibility} />
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDateTime(replay.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/replays/${replay.id}`)}
                        >
                          View analysis
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
