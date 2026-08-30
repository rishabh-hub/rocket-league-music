// ABOUTME: Page displaying detailed replay analysis with tabs for different stat views.
// ABOUTME: Shows processing status, game stats, player stats, and song recommendations.
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Share2,
} from 'lucide-react';
import ReplayStats from '@/components/ReplayStats';
import PlayerStats from '@/components/PlayerStats';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AnimatePresence } from 'motion/react';
import VisibilityToggle from '@/components/VisibilityToggle';
import { Badge } from '@/components/ui/badge';
import SongRecommendations from '@/components/SongRecommendations';
import { useContextualFeedbackContext } from '@/contexts/ContextualFeedbackContext';
import { ContextualPrompt } from '@/components/feedback/ContextualPrompt';
import { ReplayData } from '@/types/replay';

export default function ReplayDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast(); // Using shadcn toast hook

  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [status, setStatus] = useState<string>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isShowcase, setIsShowcase] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [isUserOwner, setIsUserOwner] = useState<boolean>(false);

  // Contextual feedback hook
  const {
    activePrompt,
    dismissPrompt,
    completePrompt,
    triggerReplayStatsEngagement,
    triggerMusicRecommendationsViewed,
    triggerSpotifyIntegrationUsed,
    triggerFullFeedback,
  } = useContextualFeedbackContext();

  // Check user authentication status
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();
  }, [supabase]);

  // Update owner status when user or replay changes
  useEffect(() => {
    if (replay && user) {
      setIsUserOwner(replay.user_id === user.id);
    } else {
      setIsUserOwner(false);
    }
  }, [replay, user]);

  // Track time spent on replay stats for contextual feedback
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Only trigger for stats-related tabs when replay is ready
    if (
      status === 'ready' &&
      ['overview', 'players', 'boost', 'positioning'].includes(activeTab)
    ) {
      timer = setTimeout(() => {
        triggerReplayStatsEngagement();
      }, 120000); // 2 minutes
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [activeTab, status, triggerReplayStatsEngagement]);

  // Poll for updates while processing
  useEffect(() => {
    const fetchReplayData = async () => {
      try {
        const response = await fetch(`/api/replay/${id}`);

        if (!response.ok) {
          if (response.status === 403) {
            // User doesn't have access to this replay
            toast({
              variant: 'destructive',
              title: 'That replay is private',
              description: 'Only the person who uploaded it can open it.',
            });
            router.push('/replays');
            return;
          }
          if (response.status === 409) {
            // Replay exists
            toast({
              variant: 'default',
              title: 'You already uploaded this one',
              description: 'Opening the version you have.',
            });
            router.push('/replays');
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch replay data');
        }

        const data = await response.json();
        setStatus(data.status);
        setReplay(data.replay);

        // Check if this is a showcase replay (public visibility)
        if (data.replay && data.replay.visibility === 'public') {
          setIsShowcase(true);
        }

        if (data.error) {
          setErrorMessage(data.error);
        }

        // If still processing, continue polling
        if (
          data.status === 'processing' ||
          data.status === 'uploaded' ||
          data.status === 'pending'
        ) {
          // Keep polling
          return false;
        } else {
          // Stop polling and show success toast if we just completed processing
          if (status === 'processing' && data.status === 'ready') {
            toast({
              title: 'Your match is ready',
              description: 'Open the Songs tab to hear it.',
            });
          }
          // Stop polling
          return true;
        }
      } catch (error) {
        console.error('Error fetching replay data:', error);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'An unknown error occurred'
        );

        toast({
          variant: 'destructive',
          title: 'Could not load that replay',
          description:
            'Give it a moment and refresh. If it keeps failing, the replay may not have finished processing.',
        });

        return true; // Stop polling on error
      }
    };

    // Initial fetch
    fetchReplayData();

    // Setup polling
    const pollingInterval = setInterval(async () => {
      const shouldStopPolling = await fetchReplayData();
      if (shouldStopPolling) {
        clearInterval(pollingInterval);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [id, router, status, toast]);

  // Handle different states
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading replay details...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push(isShowcase ? '/showcase' : '/replays')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isShowcase ? 'Back to Showcase' : 'Back to Replays'}
        </Button>

        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-4">
              Could not load this replay
            </h1>
            <p className="text-destructive mb-6">
              {errorMessage || 'An unknown error occurred'}
            </p>
            <Button
              onClick={() => router.push(isShowcase ? '/showcase' : '/replays')}
            >
              {isShowcase ? 'Back to Showcase' : 'Back to Replays'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing states (uploaded, processing, pending)
  if (
    status === 'uploaded' ||
    status === 'processing' ||
    status === 'pending'
  ) {
    const stages: [string, string][] = [
      ['uploaded', 'Uploaded to ballchasing.com'],
      ['processing', 'ballchasing.com is parsing the match'],
      ['pending', 'Pulling the stats back'],
    ];

    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push(isShowcase ? '/showcase' : '/replays')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isShowcase ? 'Back to Showcase' : 'Back to Replays'}
        </Button>

        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <h1 className="text-xl font-semibold">Processing replay</h1>
            </div>

            <ol className="mb-4 space-y-2 text-sm">
              {stages.map(([stage, label]) => (
                <li key={stage} className="flex items-center gap-2">
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                    {status === stage ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </span>
                  <span
                    className={
                      status === stage
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>

            <p className="text-sm text-muted-foreground">
              Most replays are done in under a minute. You can close this tab —
              it keeps going without you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push(isShowcase ? '/showcase' : '/replays')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{' '}
          {isShowcase ? 'Back to Showcase' : 'Back to Replays'}
        </Button>

        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-4">Processing failed</h1>
            <p className="text-muted-foreground mb-6">
              ballchasing.com could not read this replay file. That usually
              means it is from an older game version or the recording was cut
              short.
            </p>
            {errorMessage && (
              <p className="text-destructive mb-6">{errorMessage}</p>
            )}
            <Button onClick={() => router.push('/upload-replay')}>
              Upload a different replay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!replay) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-4">
              That replay does not exist
            </h1>
            <p className="text-muted-foreground mb-6">
              It may have been deleted, or the link is wrong.
            </p>
            <Button onClick={() => router.push('/replays')}>
              Back to your replays
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get team names and scores for title
  const blueTeam = replay.metrics?.teams?.blue;
  const orangeTeam = replay.metrics?.teams?.orange;
  let pageTitle = replay.fileName;

  if (blueTeam && orangeTeam) {
    pageTitle = `${blueTeam.name} ${blueTeam.goals} - ${orangeTeam.goals} ${orangeTeam.name}`;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(isShowcase ? '/showcase' : '/replays')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{' '}
          {isShowcase ? 'Back to Showcase' : 'Back to Replays'}
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">
            {replay.metrics?.title || pageTitle}
          </h1>

          {replay.visibility === 'public' && (
            <Badge
              variant="outline"
              className="border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/25"
            >
              Public
            </Badge>
          )}
        </div>

        <div className="mt-2 flex items-center gap-4">
          {replay.ballchasingId && (
            <Button variant="link" className="h-auto p-0" asChild>
              <a
                href={`https://ballchasing.com/replay/${replay.ballchasingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm"
              >
                View on ballchasing.com
                <ChevronRight className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}

          {/* Share button for showcase replays */}
          {replay.visibility === 'public' && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                toast({
                  title: 'Link copied',
                });
              }}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          )}
          {!isShowcase && isUserOwner && (
            <div className="ml-auto">
              <VisibilityToggle
                replayId={replay.id}
                initialVisibility={replay.visibility}
                onVisibilityChange={(newVisibility) => {
                  if (replay) {
                    setReplay({
                      ...replay,
                      visibility: newVisibility,
                    });
                    setIsShowcase(newVisibility === 'public');
                  }
                }}
              />
            </div>
          )}

          {/* Call-to-action for unauthenticated users viewing public replays */}
          {replay.visibility === 'public' && !user && (
            <div className="ml-auto">
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/login')}
              >
                Analyze your own replay
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="boost">Boost</TabsTrigger>
          <TabsTrigger value="positioning">Positioning</TabsTrigger>
          <TabsTrigger value="recommendations">Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ReplayStats replayData={replay} />
        </TabsContent>

        <TabsContent value="players">
          <PlayerStats replayData={replay} statType="core" />
        </TabsContent>

        <TabsContent value="boost">
          <PlayerStats replayData={replay} statType="boost" />
        </TabsContent>

        <TabsContent value="positioning">
          <PlayerStats replayData={replay} statType="positioning" />
        </TabsContent>
        <TabsContent value="recommendations">
          <SongRecommendations
            replayData={replay}
            onMusicRecommendationsViewed={triggerMusicRecommendationsViewed}
            onSpotifyIntegrationUsed={triggerSpotifyIntegrationUsed}
          />
        </TabsContent>
      </Tabs>

      {/* Contextual Feedback Prompt */}
      <AnimatePresence>
        {activePrompt && (
          <ContextualPrompt
            context={activePrompt.context}
            message={activePrompt.message}
            onDismiss={dismissPrompt}
            onOpenFullFeedback={() => {
              // Trigger the global FeedbackWidget to open with the contextual context
              if (activePrompt) {
                triggerFullFeedback(activePrompt.context);
              }
              completePrompt();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
