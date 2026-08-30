// ABOUTME: Utility for generating consistent team colors for Chart.js visualizations.
// ABOUTME: Provides theme-aware colors and class tokens for blue and orange teams.

export interface TeamColorSet {
  background: string;
  border: string;
}

export interface ChartInkSet {
  tick: string;
  grid: string;
}

/**
 * Returns the background and border colors for a team based on the current theme.
 *
 * @param team - The team color: 'blue' or 'orange'
 * @param isDark - Whether dark mode is currently active
 * @returns Object containing background and border color strings
 */
export function getTeamColors(
  team: 'blue' | 'orange',
  isDark: boolean
): TeamColorSet {
  const colors = {
    blue: {
      background: isDark
        ? 'hsla(221, 76%, 62%, 0.8)'
        : 'hsla(221, 72%, 46%, 0.7)',
      border: isDark ? 'hsla(221, 76%, 62%, 1)' : 'hsla(221, 72%, 46%, 1)',
    },
    orange: {
      background: isDark
        ? 'hsla(22, 92%, 60%, 0.8)'
        : 'hsla(20, 84%, 44%, 0.7)',
      border: isDark ? 'hsla(22, 92%, 60%, 1)' : 'hsla(20, 84%, 44%, 1)',
    },
  };
  return colors[team];
}

/**
 * Returns the tick and grid colors for a chart based on the current theme.
 * Mirrors --muted-foreground and --border, which Chart.js cannot read itself
 * because it paints to a canvas rather than to styled DOM nodes.
 *
 * @param isDark - Whether dark mode is currently active
 * @returns Object containing tick and grid color strings
 */
export function getChartInk(isDark: boolean): ChartInkSet {
  return isDark
    ? { tick: 'hsla(218, 12%, 63%, 1)', grid: 'hsla(220, 10%, 18%, 1)' }
    : { tick: 'hsla(224, 12%, 42%, 1)', grid: 'hsla(226, 16%, 88%, 1)' };
}

/**
 * Tailwind class strings for team identity in the DOM, so blue and orange are
 * described in exactly one place. Blue is the user's own team (--primary),
 * orange is the opponent (--signal).
 */
export const TEAM_CLASSES = {
  blue: {
    text: 'text-primary',
    border: 'border-primary/40',
    chip: 'bg-primary/15 text-primary border-primary/30',
  },
  orange: {
    text: 'text-signal',
    border: 'border-signal/40',
    chip: 'bg-signal/15 text-signal border-signal/30',
  },
} as const;
