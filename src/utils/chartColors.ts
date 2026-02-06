// ABOUTME: Utility for generating consistent team colors for Chart.js visualizations.
// ABOUTME: Provides theme-aware colors for blue and orange teams.

export interface TeamColorSet {
  background: string;
  border: string;
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
        ? 'rgba(59, 130, 246, 0.8)'
        : 'rgba(59, 130, 246, 0.7)',
      border: isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)',
    },
    orange: {
      background: isDark
        ? 'rgba(249, 115, 22, 0.8)'
        : 'rgba(249, 115, 22, 0.7)',
      border: isDark ? 'rgba(249, 115, 22, 1)' : 'rgba(234, 88, 12, 1)',
    },
  };
  return colors[team];
}
