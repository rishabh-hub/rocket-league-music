// app/replays/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast'; // Changed from sonner to shadcn toast
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Info,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Share2,
  Music,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import ReplayStats from '@/components/ReplayStats';
import PlayerStats from '@/components/PlayerStats';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'motion/react';
import VisibilityToggle from '@/components/VisibilityToggle';
import { Badge } from '@/components/ui/badge';
import SongRecommendations from '@/components/SongRecommendations';

interface ReplayData {
  id: string;
  fileName: string;
  ballchasingId?: string;
  visibility: string;
  createdAt: string;
  metrics?: any;
  user_id?: string;
}

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
              title: 'Access Denied',
              description: 'You do not have permission to view this replay',
            });
            router.push('/replays');
            return;
          }
          if (response.status === 409) {
            // Replay exists
            toast({
              variant: 'default',
              title: 'Replay already exists',
              description: 'This replay file has already been uploaded',
            });
            router.push('/replays');
            return;
          }
          console.log(`RESPONSE NOT OK ${JSON.stringify(response)}`);
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
              title: 'Processing Complete',
              description: 'Replay statistics are ready to view',
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
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
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
              Error Loading Replay
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
    let message = '';
    let progress = 0;

    if (status === 'uploaded') {
      message =
        'Your replay has been uploaded and is waiting to be processed by ballchasing.com';
      progress = 25;
    } else if (status === 'processing') {
      message = 'Your replay is being processed by ballchasing.com';
      progress = 50;
    } else if (status === 'pending') {
      message = 'Extracting replay statistics...';
      progress = 75;
    }

    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push(isShowcase ? '/showcase' : '/replays')}
        >
          {isShowcase ? 'Back to Showcase' : 'Back to Replays'}
        </Button>

        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <h1 className="text-xl font-semibold">Processing Replay</h1>
            </div>

            <Progress value={progress} className="mb-4" />

            <p className="text-muted-foreground mb-4">{message}</p>

            <div className="rounded-md bg-muted p-4 text-sm">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p>
                    This page will automatically update when processing is
                    complete
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Depending on the size of the replay file, this might take
                    1-2 minutes
                  </p>
                </div>
              </div>
            </div>
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
            <h1 className="text-2xl font-semibold mb-4">
              Replay Processing Failed
            </h1>
            <p className="text-muted-foreground mb-6">
              Unfortunately, ballchasing.com was unable to process this replay
            </p>
            {errorMessage && (
              <p className="text-destructive mb-6">{errorMessage}</p>
            )}
            <Button onClick={() => router.push('/upload')}>
              Upload a different replay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!replay) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Replay not found</p>
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
    <motion.div
      className="container mx-auto py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Public Showcase
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
                  title: 'Link copied!',
                  description: 'Share this replay with your friends',
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
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Sign up to upload your replays
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
          <TabsTrigger value="players">Player Stats</TabsTrigger>
          <TabsTrigger value="boost">Boost Analysis</TabsTrigger>
          <TabsTrigger value="positioning">Positioning</TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2"
          >
            <Music className="h-4 w-4" />
            Song Recommendations
          </TabsTrigger>
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
          <SongRecommendations replayData={replay} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
