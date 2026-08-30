// ABOUTME: Card component for displaying a song recommendation with Spotify embed.
// ABOUTME: Supports both deterministic and agentic pipeline song fields.
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
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

  // Matched items lead each list so a match is never the entry that gets cut
  const matchedFirst = (items: string[]): string[] =>
    [...items].sort(
      (a, b) => Number(isMatchedCriteria(b)) - Number(isMatchedCriteria(a))
    );

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // Notify parent in both directions so the now-playing highlight clears
    onPlayStateChange?.(!isExpanded, index);
  };

  // Spotify embed URL; theme=0 pins the player to dark so it sits on the app canvas.
  const getSpotifyEmbedUrl = (trackId: string) => {
    const baseUrl = 'https://open.spotify.com/embed/track/';
    const params = new URLSearchParams({
      utm_source: 'generator',
      theme: '0', // Force dark theme
    });

    return `${baseUrl}${trackId}?${params.toString()}`;
  };

  const listCap = 3;
  const moods = matchedFirst(song.moods || []);
  const themes = matchedFirst(song.themes || []);
  const moments = song.llm_game_moments || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.24,
        delay: Math.min(index, 5) * 0.04,
        ease: [0.32, 0.72, 0, 1],
      }}
      className="group"
    >
      <Card
        className={`transition-colors duration-instant hover:border-foreground/25 ${
          isPlaying ? 'border-foreground/25 bg-muted/30' : ''
        }`}
      >
        <div className="p-4 space-y-3">
          {/* Song Info Header */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 grow">
                <h5 className="font-semibold truncate" title={song.title}>
                  {song.title}
                </h5>
                <p
                  className="text-muted-foreground text-sm truncate"
                  title={song.artist}
                >
                  {song.artist}
                </p>
              </div>

              <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                {song.bpm} BPM • {normalizeEnergy(song.energy)}
              </div>
            </div>

            {song.llm_vibe && (
              <p className="text-sm leading-relaxed text-foreground/80">
                {song.llm_vibe}
              </p>
            )}
          </div>

          {/* Single Animated Spotify Player with Border Fix */}
          {trackId && (
            <motion.div
              className="overflow-hidden rounded-lg bg-surface border border-border/50"
              animate={{
                height: isExpanded ? 352 : 152,
              }}
              transition={{
                duration: 0.4,
                ease: 'easeInOut',
              }}
            >
              <iframe
                src={getSpotifyEmbedUrl(trackId)}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="block h-full w-full border-none bg-transparent"
                title={`Spotify player for ${song.title} by ${song.artist}`}
              />
            </motion.div>
          )}
          {/* No Spotify URL Fallback */}
          {!trackId && (
            <p className="text-sm text-muted-foreground">
              No preview for this track.
            </p>
          )}
          {/* Moods and Themes */}
          <div className="flex flex-wrap gap-1">
            {/* Moods */}
            {moods.slice(0, listCap).map((mood, idx) => (
              <Badge
                key={`mood-${idx}`}
                variant={isMatchedCriteria(mood) ? 'default' : 'outline'}
                className={`text-xs ${isMatchedCriteria(mood) ? 'bg-primary text-primary-foreground border-primary' : ''}`}
              >
                {mood}
              </Badge>
            ))}
            {moods.length > listCap && (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                +{moods.length - listCap}
              </Badge>
            )}

            {/* Themes */}
            {themes.slice(0, listCap).map((theme, idx) => (
              <Badge
                key={`theme-${idx}`}
                variant={isMatchedCriteria(theme) ? 'default' : 'secondary'}
                className={`text-xs ${isMatchedCriteria(theme) ? 'bg-primary/15 text-primary border-primary/30' : ''}`}
              >
                {theme}
              </Badge>
            ))}
            {themes.length > listCap && (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                +{themes.length - listCap}
              </Badge>
            )}
          </div>
          {/* Game Moments */}
          {moments.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {moments.slice(0, listCap).map((moment, idx) => (
                <Badge
                  key={`moment-${idx}`}
                  variant="outline"
                  className="text-xs"
                >
                  {moment}
                </Badge>
              ))}
              {moments.length > listCap && (
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  +{moments.length - listCap}
                </Badge>
              )}
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
                      Collapse
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3 w-3" />
                      Expand
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
                    Open in Spotify
                  </a>
                </Button>
              )}
            </div>

            <span className="text-xs tabular-nums text-muted-foreground">
              {song.match_score}% match
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
