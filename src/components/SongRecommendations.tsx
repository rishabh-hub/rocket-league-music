// components/SongRecommendations.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Music,
  Loader2,
  Zap,
  Users,
  Trophy,
  Target,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SpotifySongCard from './SpotifySongCard';
// Replace the interface definitions at the top with this import:
import { RecommendationResult, Player } from '../types/spotify';

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
          replay_data: replayData?.metrics || null, // Send actual replay data
          top_n: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const result: RecommendationResult = await response.json();

      if (result.success) {
        console.log('API Response:', result); // Log the entire response for debugging purposes
        setRecommendations(result);
        setSelectedPlayer({ id: playerId, name: playerName });
        toast({
          title: 'Recommendations Generated!',
          description: `Found ${result.recommendations.length} songs for ${playerName}`,
        });

        // Trigger contextual feedback after recommendations are loaded
        onMusicRecommendationsViewed?.();
      } else {
        throw new Error(result.error || 'Failed to generate recommendations');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithSampleData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: 'ce45140fcd644755b01660aa2dc6977b',
          top_n: 3,
        }),
      });

      if (!response.ok) {
        console.error('API request failed:', response.status); // Log the status code for debugging purposes
        throw new Error(`API request failed: ${response.status}`);
      }

      const result: RecommendationResult = await response.json();

      if (result.success) {
        setRecommendations(result);
        setSelectedPlayer({ id: 'sample', name: 'Sample Player' });
        toast({
          title: 'Sample Recommendations Generated!',
          description: `Using sample replay data`,
        });
      } else {
        console.error('API request failed:', response.status); // Log the status code for debugging purposes
        throw new Error(
          result.error || 'Failed to generate sample recommendations'
        );
      }
    } catch (err) {
      console.error('API request failed:', err); // Log the status code for debugging purposes
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'high':
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'medium':
      case 'good':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'low':
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
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
            Song Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Player Selection */}
          {players.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">
                Select a player to generate recommendations:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {players.map((player) => (
                  <Button
                    key={player.id}
                    variant="outline"
                    onClick={() =>
                      generateRecommendations(player.id, player.name)
                    }
                    disabled={loading}
                    className="flex items-center justify-between p-3 h-auto"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.name}</span>
                      {player.mvp && (
                        <Badge variant="secondary" className="text-xs">
                          MVP
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.goals || 0}G {player.saves || 0}S{' '}
                      {player.assists || 0}A
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Test Button */}
          <div className="mb-6">
            <Button
              variant="secondary"
              onClick={testWithSampleData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Test with Sample Data
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating recommendations...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
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

                  {/* Performance Categories */}
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
                          <Badge
                            className={getCategoryColor(value)}
                            variant="secondary"
                          >
                            {value}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">Intensity Score</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {recommendations.profile.metrics.intensity_score}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Performance Score</div>
                      <div className="text-2xl font-bold text-green-600">
                        {recommendations.profile.metrics.performance_score}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Teamwork Factor</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {recommendations.profile.metrics.teamwork_factor}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Song Recommendations */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Recommended Songs
                    <Badge variant="outline" className="text-xs">
                      {recommendations.recommendations.length} tracks
                    </Badge>
                  </h4>

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
                              setCurrentlyPlaying(null);
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No song recommendations found</p>
                    </div>
                  )}
                </div>
                {/* Metadata */}
                {recommendations.metadata && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    {recommendations.metadata.used_sample_data && (
                      <p>⚠️ Using sample data for demonstration</p>
                    )}
                    <p>
                      Generated at:{' '}
                      {new Date(
                        recommendations.metadata.processed_at
                      ).toLocaleString()}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
