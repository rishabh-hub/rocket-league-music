// ABOUTME: Component that fetches and displays music recommendations for replay players.
// ABOUTME: Supports both deterministic (metrics/categories) and agentic (game_reading) profiles.
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Music, Zap, Users, Trophy, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SpotifySongCard from './SpotifySongCard';
import {
  RecommendationResult,
  Player,
  isAgenticProfile,
  isDeterministicProfile,
} from '../types/spotify';

interface SongRecommendationsProps {
  replayData: any;
  className?: string;
  onMusicRecommendationsViewed?: () => void;
  onSpotifyIntegrationUsed?: () => void;
}

export default function SongRecommendations({
  replayData,
  className,
  onMusicRecommendationsViewed,
  onSpotifyIntegrationUsed,
}: SongRecommendationsProps) {
  const [recommendations, setRecommendations] =
    useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string>('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Extract players from replay data
  const getPlayersFromReplay = (): Player[] => {
    const players: Player[] = [];

    if (replayData?.metrics?.teams?.blue?.players) {
      players.push(...replayData.metrics.teams.blue.players);
    }

    if (replayData?.metrics?.teams?.orange?.players) {
      players.push(...replayData.metrics.teams.orange.players);
    }

    return players;
  };

  const players = getPlayersFromReplay();

  const generateRecommendations = async (
    playerId: string,
    playerName: string
  ) => {
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          replay_data: replayData?.metrics || null,
          top_n: 5,
        }),
        signal: abortControllerRef.current.signal,
      });

      // Check if request was aborted before processing response
      if (abortControllerRef.current.signal.aborted) return;

      if (!response.ok) {
        console.error(
          'Recommendation request failed:',
          response.status,
          response.statusText
        );
        throw new Error(
          'Could not reach the song matcher. It sleeps when idle — give it about thirty seconds and try again.'
        );
      }

      const result: RecommendationResult = await response.json();

      // Check again before state updates
      if (abortControllerRef.current.signal.aborted) return;

      if (result.success) {
        setRecommendations(result);
        setSelectedPlayer({ id: playerId, name: playerName });
        toast({
          title: `${result.recommendations.length} tracks for ${playerName}`,
          description: 'Scored against how they played this match.',
        });

        // Trigger contextual feedback after recommendations are loaded
        onMusicRecommendationsViewed?.();
      } else {
        throw new Error(result.error || 'Failed to generate recommendations');
      }
    } catch (err) {
      // Don't show error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') return;

      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      // Only update loading state if not aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  };

  // Category strength is a three-step ladder of badge variants: an accent tint
  // for the top rung, a filled grey for the middle, an outline for the rest.
  const getCategoryVariant = (
    category: string
  ): 'success' | 'secondary' | 'outline' => {
    switch (category.toLowerCase()) {
      case 'high':
      case 'excellent':
        return 'success';
      case 'medium':
      case 'good':
        return 'secondary';
      case 'low':
      case 'poor':
      default:
        return 'outline';
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'intensity':
        return <Zap className="h-4 w-4" />;
      case 'performance':
        return <Trophy className="h-4 w-4" />;
      case 'teamwork':
        return <Users className="h-4 w-4" />;
      case 'closeness':
        return <Target className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Songs for this match
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Player Selection */}
          {players.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">Who were you?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {players.map((player) => (
                  <Button
                    key={player.id}
                    variant="outline"
                    onClick={() =>
                      generateRecommendations(player.id, player.name)
                    }
                    disabled={loading}
                    className="flex h-auto flex-col items-start justify-between gap-1 whitespace-normal p-3 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">
                        {player.name}
                      </span>
                      {player.mvp && (
                        <Badge variant="secondary" className="text-xs">
                          MVP
                        </Badge>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {player.goals || 0} goals · {player.saves || 0} saves ·{' '}
                      {player.assists || 0} assists
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Reading the replay
              </p>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[220px] rounded-lg border border-border bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Recommendations Display */}
          <AnimatePresence>
            {recommendations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Player Profile */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">
                    Recommendations for {selectedPlayer?.name}
                  </h3>

                  {/* Deterministic Profile: Performance Categories + Metrics */}
                  {isDeterministicProfile(recommendations.profile) && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {Object.entries(recommendations.profile.categories).map(
                          ([key, value]) => (
                            <div key={key} className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                {getCategoryIcon(key)}
                                <span className="text-sm font-medium capitalize">
                                  {key}
                                </span>
                              </div>
                              <Badge variant={getCategoryVariant(value)}>
                                {value}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">Intensity</div>
                          <div className="text-2xl font-bold tabular-nums text-foreground">
                            {recommendations.profile.metrics.intensity_score}
                            /100
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Performance</div>
                          <div className="text-2xl font-bold tabular-nums text-foreground">
                            {recommendations.profile.metrics.performance_score}
                            /100
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Teamwork</div>
                          <div className="text-2xl font-bold tabular-nums text-foreground">
                            {recommendations.profile.metrics.teamwork_factor}
                            /100
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Agentic Profile: Game Reading */}
                  {isAgenticProfile(recommendations.profile) && (
                    <div className="space-y-4 mb-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm leading-relaxed">
                          {recommendations.profile.game_reading.narrative}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            How you played
                          </div>
                          <div className="text-lg font-semibold">
                            {
                              recommendations.profile.game_reading
                                .player_archetype
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            How the match went
                          </div>
                          <div className="text-lg font-semibold">
                            {recommendations.profile.game_reading.emotional_arc}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          What stood out
                        </div>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          {recommendations.profile.game_reading.key_observations.map(
                            (observation, idx) => (
                              <li
                                key={idx}
                                className="border-l-2 border-primary/40 pl-3"
                              >
                                {observation}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Song Recommendations */}
                <div>
                  <div className="mb-3">
                    <Badge variant="outline" className="text-xs">
                      {recommendations.recommendations.length} tracks
                    </Badge>
                  </div>

                  {recommendations.recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.recommendations.map((song, index) => (
                        <SpotifySongCard
                          key={index}
                          song={song}
                          index={index}
                          isPlaying={currentlyPlaying === index}
                          onPlayStateChange={(isPlaying, songIndex) => {
                            if (isPlaying) {
                              setCurrentlyPlaying(songIndex);
                              // Trigger contextual feedback when user engages with Spotify
                              onSpotifyIntegrationUsed?.();
                            } else {
                              // Only the card holding the highlight may clear it
                              setCurrentlyPlaying((current) =>
                                current === songIndex ? null : current
                              );
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border py-10 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nothing matched this match. Try another player from the
                        list.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
