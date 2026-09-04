// ABOUTME: Component for displaying detailed player statistics with charts and tables.
// ABOUTME: Supports core stats, boost analysis, and positioning metrics view modes.
import React from 'react';
import { ChartOptions, ChartData } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Card,
  CardContent,
  CardHeader,
  CardSectionLabel,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import '@/lib/chartjs';
import { ReplayData } from '@/types/replay';
import { getChartInk, getTeamColors, TEAM_CLASSES } from '@/utils/chartColors';

interface PlayerStatsProps {
  replayData: ReplayData;
  statType: 'core' | 'boost' | 'positioning';
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ replayData, statType }) => {
  const { resolvedTheme } = useTheme();
  // Get stat labels and values based on statType
  const getStatConfig = () => {
    switch (statType) {
      case 'boost':
        return {
          title: 'Boost',
          stats: [
            {
              id: 'avg_amount',
              label: 'Avg boost',
              path: 'boost.avg_amount',
              unit: '',
              decimals: 0,
            },
            {
              id: 'amount_collected',
              label: 'Boost collected',
              path: 'boost.amount_collected',
              unit: '',
              decimals: 0,
            },
            {
              id: 'amount_stolen',
              label: 'Boost stolen',
              path: 'boost.amount_stolen',
              unit: '',
              decimals: 0,
            },
            {
              id: 'time_zero_boost_percent',
              label: '% Zero boost',
              path: 'boost.time_zero_boost_percent',
              unit: '%',
              decimals: 1,
            },
            {
              id: 'time_full_boost_percent',
              label: '% Full boost',
              path: 'boost.time_full_boost_percent',
              unit: '%',
              decimals: 1,
            },
          ],
        };
      case 'positioning':
        return {
          title: 'Positioning',
          stats: [
            {
              id: 'time_defensive_third_percent',
              label: '% Defensive third',
              path: 'positioning.time_defensive_third_percent',
              unit: '%',
              decimals: 1,
            },
            {
              id: 'time_neutral_third_percent',
              label: '% Neutral third',
              path: 'positioning.time_neutral_third_percent',
              unit: '%',
              decimals: 1,
            },
            {
              id: 'time_offensive_third_percent',
              label: '% Offensive third',
              path: 'positioning.time_offensive_third_percent',
              unit: '%',
              decimals: 1,
            },
            {
              id: 'time_behind_ball_percent',
              label: '% Behind ball',
              path: 'positioning.time_behind_ball_percent',
              unit: '%',
              decimals: 1,
            },
            {
              id: 'avg_speed',
              label: 'Avg speed',
              path: 'movement.avg_speed',
              unit: ' uu/s',
              decimals: 0,
            },
            {
              id: 'time_supersonic_speed_percent',
              label: '% Supersonic',
              path: 'movement.time_supersonic_speed_percent',
              unit: '%',
              decimals: 1,
            },
          ],
        };
      case 'core':
      default:
        return {
          title: 'Scoring',
          stats: [
            {
              id: 'score',
              label: 'Score',
              path: 'score',
              unit: '',
              decimals: 0,
            },
            {
              id: 'goals',
              label: 'Goals',
              path: 'goals',
              unit: '',
              decimals: 0,
            },
            {
              id: 'assists',
              label: 'Assists',
              path: 'assists',
              unit: '',
              decimals: 0,
            },
            {
              id: 'saves',
              label: 'Saves',
              path: 'saves',
              unit: '',
              decimals: 0,
            },
            {
              id: 'shots',
              label: 'Shots',
              path: 'shots',
              unit: '',
              decimals: 0,
            },
            {
              id: 'shooting_percentage',
              label: 'Shooting %',
              path: 'shooting_percentage',
              unit: '%',
              decimals: 1,
            },
          ],
        };
    }
  };
  const statConfig = getStatConfig();
  const [selectedStat, setSelectedStat] = React.useState<string>(
    statConfig.stats[0].id
  );

  if (!replayData || !replayData.metrics) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Ballchasing has not returned stats for this replay yet. Processing
            usually finishes within a minute — refresh, or{' '}
            <Link className="underline underline-offset-4" href="/replays">
              go back to your replays
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = replayData.metrics;
  const blueTeam = metrics.teams.blue;
  const orangeTeam = metrics.teams.orange;

  // Combine all players for chart data
  const allPlayers = [
    ...blueTeam.players.map((player) => ({
      ...player,
      team: 'blue',
      teamName: blueTeam.name || 'Blue',
    })),
    ...orangeTeam.players.map((player) => ({
      ...player,
      team: 'orange',
      teamName: orangeTeam.name || 'Orange',
    })),
  ];

  // Get the value from a nested path
  const getValueByPath = (obj: any, path: string) => {
    return path
      .split('.')
      .reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  };

  // Render a stat value at its own precision, or an em dash when ballchasing
  // did not report it
  const formatStat = (
    value: number | null | undefined,
    stat: { unit: string; decimals: number }
  ) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return <span className="text-muted-foreground">—</span>;
    }
    return `${value.toFixed(stat.decimals)}${stat.unit}`;
  };

  // Helper to get team colors
  const isDark = resolvedTheme === 'dark';
  const chartInk = getChartInk(isDark);
  const getPlayerTeamColor = (team: string) =>
    getTeamColors(team as 'blue' | 'orange', isDark);

  // Prepare chart data
  const selectedStatConfig = statConfig.stats.find(
    (s) => s.id === selectedStat
  );

  const chartData: ChartData<'bar'> = {
    labels: allPlayers.map((p) => [p.name, p.teamName]),
    datasets: [
      {
        label: selectedStatConfig?.label || '',
        data: allPlayers.map((p) =>
          getValueByPath(p, selectedStatConfig?.path || '')
        ),
        backgroundColor: allPlayers.map(
          (p) => getPlayerTeamColor(p.team).background
        ),
        borderColor: allPlayers.map((p) => getPlayerTeamColor(p.team).border),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: chartInk.grid,
        },
        ticks: {
          color: chartInk.tick,
        },
      },
      x: {
        grid: {
          color: chartInk.grid,
        },
        ticks: {
          color: chartInk.tick,
        },
      },
    },
  };

  const chartAriaLabel = `${selectedStatConfig?.label || 'Stat'} by player: ${allPlayers
    .map((p) => {
      const value = getValueByPath(p, selectedStatConfig?.path || '');
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return `${p.name} no data`;
      }
      return `${p.name} ${value.toFixed(selectedStatConfig?.decimals ?? 0)}${
        selectedStatConfig?.unit ?? ''
      }`;
    })
    .join(', ')}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardSectionLabel>{statConfig.title}</CardSectionLabel>
          <Select value={selectedStat} onValueChange={setSelectedStat}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {statConfig.stats.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <Bar
              data={chartData}
              options={chartOptions}
              role="img"
              aria-label={chartAriaLabel}
            />
          </div>
        </CardContent>
      </Card>

      {/* Player Comparison Table */}
      <Card>
        <CardHeader>
          <CardSectionLabel>Every player</CardSectionLabel>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  {statConfig.stats.map((stat) => (
                    <TableHead key={stat.id} className="text-right">
                      {stat.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPlayers.map((player, index) => (
                  <TableRow
                    key={index}
                    className={player.mvp ? 'bg-foreground/[0.06]' : ''}
                  >
                    <TableCell className="font-medium">
                      {player.name}
                      {player.mvp && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-foreground/30 text-foreground text-[10px] tracking-widest"
                        >
                          MVP
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          TEAM_CLASSES[player.team as 'blue' | 'orange'].chip
                        }
                      >
                        {player.teamName}
                      </Badge>
                    </TableCell>
                    {statConfig.stats.map((stat) => (
                      <TableCell
                        key={stat.id}
                        className="text-right tabular-nums"
                      >
                        {formatStat(getValueByPath(player, stat.path), stat)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerStats;
