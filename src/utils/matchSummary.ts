// ABOUTME: Builds the two-line summary a replay shows in list views.
// ABOUTME: Reads the nested metrics shape extractMetrics writes and degrades to the file name.

import { Replay } from '@/types/replay';

/**
 * The two lines a replay row renders: a headline and its supporting detail.
 */
export interface MatchSummary {
  /** The player's own replay title, else the scoreline, else the file name. */
  primary: string;
  /** Scoreline, playlist and map, or the failure message, or nothing. */
  secondary: string | null;
}

const DETAIL_SEPARATOR = ' · ';

/**
 * Builds "Blue 2–5 Orange" from the teams nested inside a processed replay's
 * metrics. Returns null for a replay that is still processing or has failed,
 * since those rows carry no teams.
 */
function scoreline(metrics: any): string | null {
  const blue = metrics?.teams?.blue;
  const orange = metrics?.teams?.orange;

  if (!blue?.name || !orange?.name) {
    return null;
  }
  if (typeof blue.goals !== 'number' || typeof orange.goals !== 'number') {
    return null;
  }

  const line = `${blue.name} ${blue.goals}–${orange.goals} ${orange.name}`;
  return metrics.overtime ? `${line} (OT)` : line;
}

/**
 * The message stored on a replay whose processing failed, so the row explains
 * itself instead of showing a bare status badge.
 */
function failureMessage(metrics: any): string | null {
  return typeof metrics?.error === 'string' && metrics.error
    ? metrics.error
    : null;
}

/**
 * Summarises a replay for a list row. Leads with the name the player gave the
 * replay in game, since that is the line they recognise, and falls back through
 * the scoreline to the uploaded file name.
 */
export function matchSummary(replay: Replay): MatchSummary {
  const metrics = replay.metrics;
  const score = scoreline(metrics);
  const title = typeof metrics?.title === 'string' ? metrics.title.trim() : '';

  const primary = title || score || replay.file_name;

  const details = [
    primary === score ? null : score,
    typeof metrics?.playlist === 'string' ? metrics.playlist : null,
    typeof metrics?.map_name === 'string' ? metrics.map_name : null,
  ].filter((part): part is string => Boolean(part));

  return {
    primary,
    secondary: details.length
      ? details.join(DETAIL_SEPARATOR)
      : failureMessage(metrics),
  };
}
