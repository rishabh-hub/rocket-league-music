// ABOUTME: Card component for displaying a song recommendation with Spotify embed.
// ABOUTME: Supports both deterministic and agentic pipeline song fields.
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Music, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Song } from '../types/spotify';

interface SpotifySongCardProps {
  song: Song;
  index: number;
  isPlaying?: boolean;
  onPlayStateChange?: (isPlaying: boolean, songIndex: number) => void;
}

export default function SpotifySongCard({
  song,
  index,
  isPlaying = false,
  onPlayStateChange,
}: SpotifySongCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);

  // Extract Spotify track ID from URL
  useEffect(() => {
    if (song.source_url) {
      const match = song.source_url.match(/track\/([a-zA-Z0-9]+)/);
      if (match) {
        setTrackId(match[1]);
      }
    }
  }, [song.source_url]);

  // Helper function to normalize energy value
  const normalizeEnergy = (energy: string | number): string => {
    if (typeof energy === 'string') {
      return energy;
    }
    if (typeof energy === 'number') {
      if (energy >= 0.7) return 'High';
      if (energy >= 0.4) return 'Medium';
      return 'Low';
    }
    return 'N/A';
  };

  // Helper function to check if a mood/theme matches the criteria
  const isMatchedCriteria = (item: string): boolean => {
    const matchedText = (song.matched_criteria || []).join(' ').toLowerCase();
    return matchedText.includes(item.toLowerCase());
  };

  // Helper function to get badge styling based on match status
  const getBadgeVariant = (item: string, isTheme: boolean = false) => {
    if (isMatchedCriteria(item)) {
      return isTheme ? 'default' : 'default'; // Highlighted style for matches
    }
    return isTheme ? 'secondary' : 'outline'; // Normal style for non-matches
  };

  const getBadgeClassName = (item: string, isTheme: boolean = false) => {
    if (isMatchedCriteria(item)) {
      return isTheme
        ? 'text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200'
        : 'text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200';
    }
    return 'text-xs';
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // Notify parent about play state when expanding
    if (!isExpanded && onPlayStateChange) {
      onPlayStateChange(true, index);
    }
  };

  // Also update your getSpotifyEmbedUrl function to force dark theme:
  const getSpotifyEmbedUrl = (trackId: string, compact: boolean = true) => {
    const baseUrl = 'https://open.spotify.com/embed/track/';
    const params = new URLSearchParams({
      utm_source: 'generator',
      theme: '0', // Force dark theme
    });

    return `${baseUrl}${trackId}?${params.toString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card
        className={`transition-all duration-300 hover:shadow-lg ${
          isPlaying ? 'ring-2 ring-green-500 shadow-lg' : ''
        }`}
      >
        <div className="p-4">
          {/* Song Info Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0 grow">
              <h5 className="font-semibold truncate">{song.title}</h5>
              <p className="text-muted-foreground text-sm truncate">
                by {song.artist}
              </p>
            </div>

            <div className="text-right shrink-0 ml-4">
              <div className="text-sm font-medium">
                Match: {song.match_score}%
              </div>
              <div className="text-xs text-muted-foreground">
                {song.bpm} BPM • {normalizeEnergy(song.energy)}
              </div>
            </div>
          </div>

          {/* Single Animated Spotify Player with Border Fix */}
          {trackId && (
            <motion.div
              className="mb-3 overflow-hidden rounded-xl bg-gray-900 dark:bg-gray-800 shadow-lg"
              animate={{
                height: isExpanded ? 352 : 152,
              }}
              transition={{
                duration: 0.4,
                ease: 'easeInOut',
              }}
            >
              <iframe
                src={getSpotifyEmbedUrl(trackId, !isExpanded)}
                width="100%"
                height={isExpanded ? 352 : 152}
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="block border-none bg-transparent"
                title={`Spotify player for ${song.title} by ${song.artist}`}
                style={{
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                }}
                key={`player-${trackId}-${isExpanded}`} // Force reload when size changes
              />
            </motion.div>
          )}
          {/* No Spotify URL Fallback */}
          {!trackId && (
            <div className="mb-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
              <Music className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No Spotify preview available
              </p>
            </div>
          )}
          {/* Enhanced Moods and Themes */}
          <div className="flex flex-wrap gap-1 mb-3">
            {/* Moods */}
            {(song.moods || []).slice(0, 4).map((mood, idx) => {
              const isMatched = (song.matched_criteria || [])
                .join(' ')
                .toLowerCase()
                .includes(mood.toLowerCase());

              return (
                <Badge
                  key={`mood-${idx}`}
                  variant={isMatched ? 'default' : 'outline'}
                  className={`text-xs ${isMatched ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : ''}`}
                >
                  {mood}
                  {isMatched && <span className="ml-1">✓</span>}
                </Badge>
              );
            })}

            {/* Themes */}
            {(song.themes || []).slice(0, 3).map((theme, idx) => {
              const isMatched = (song.matched_criteria || [])
                .join(' ')
                .toLowerCase()
                .includes(theme.toLowerCase());

              return (
                <Badge
                  key={`theme-${idx}`}
                  variant={isMatched ? 'default' : 'secondary'}
                  className={`text-xs ${isMatched ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : ''}`}
                >
                  {theme}
                  {isMatched && <span className="ml-1">★</span>}
                </Badge>
              );
            })}
          </div>
          {/* Agentic LLM Fields */}
          {song.llm_vibe && (
            <p className="text-xs italic text-muted-foreground mb-2">
              {song.llm_vibe}
            </p>
          )}
          {song.llm_game_moments && song.llm_game_moments.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {song.llm_game_moments.map((moment, idx) => (
                <Badge
                  key={`moment-${idx}`}
                  variant="outline"
                  className="text-xs"
                >
                  {moment}
                </Badge>
              ))}
            </div>
          )}
          {/* Match Criteria */}
          {(song.matched_criteria || []).length > 0 && (
            <div className="text-xs text-muted-foreground mb-3">
              Matched: {song.matched_criteria.slice(0, 2).join(', ')}
            </div>
          )}
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {trackId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleExpanded}
                  className="flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 className="h-3 w-3" />
                      Compact
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3 w-3" />
                      Full Player
                    </>
                  )}
                </Button>
              )}

              {song.source_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={song.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Spotify
                  </a>
                </Button>
              )}
            </div>

            {/* Song Quality Indicator */}
            <div className="flex items-center gap-1">
              {song.match_score >= 80 && (
                <Badge variant="default" className="text-xs bg-green-500">
                  Perfect Match
                </Badge>
              )}
              {song.match_score >= 60 && song.match_score < 80 && (
                <Badge variant="default" className="text-xs bg-yellow-500">
                  Good Match
                </Badge>
              )}
              {song.match_score < 60 && (
                <Badge variant="outline" className="text-xs">
                  Fair Match
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
