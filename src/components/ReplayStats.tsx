// ABOUTME: Component for displaying replay game summary and team comparison charts.
// ABOUTME: Shows final score, duration, map, team stats, MVP, and replay info.
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
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import '@/lib/chartjs';
import { cn } from '@/lib/utils';
import { ReplayData, Team } from '@/types/replay';
import { formatDateTime } from '@/utils/formatDate';
import { getChartInk, getTeamColors, TEAM_CLASSES } from '@/utils/chartColors';

interface ReplayStatsProps {
  replayData: ReplayData;
}

const TeamCard = ({ team, side }: { team: Team; side: 'blue' | 'orange' }) => (
  <Card className={TEAM_CLASSES[side].border}>
    <CardHeader>
      <CardSectionLabel className={TEAM_CLASSES[side].text}>
        {team.name || (side === 'blue' ? 'Blue Team' : 'Orange Team')}
      </CardSectionLabel>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline gap-3">
        <p className="text-5xl font-bold tabular-nums leading-none">
          {team.goals}
        </p>
        <p className="text-sm text-muted-foreground">
          goals · {team.shots} shots · {team.shooting_percentage.toFixed(0)}%
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Saves
          </p>
          <p className="text-xl font-semibold tabular-nums">{team.saves}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Assists
          </p>
          <p className="text-xl font-semibold tabular-nums">{team.assists}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Score
          </p>
          <p className="text-xl font-semibold tabular-nums">{team.score}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ReplayStats: React.FC<ReplayStatsProps> = ({ replayData }) => {
  const { resolvedTheme } = useTheme();
  const [selectedMetric, setSelectedMetric] = React.useState<string>('score');

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

  // Determine winner
  let winner: string;
  if (blueTeam.goals > orangeTeam.goals) {
    winner = blueTeam.name;
  } else if (orangeTeam.goals > blueTeam.goals) {
    winner = orangeTeam.name;
  } else {
    winner = 'Draw';
  }

  // Find MVP if any
  let mvpPlayer = null;
  for (const teamColor of ['blue', 'orange'] as const) {
    const team = metrics.teams[teamColor];
    const mvp = team.players.find((player) => player.mvp);
    if (mvp) {
      mvpPlayer = {
        ...mvp,
        team: team.name || (teamColor === 'blue' ? 'Blue' : 'Orange'),
        teamColor,
      };
      break;
    }
  }

  // Prepare chart data
  const metricOptions = [
    { id: 'score', label: 'Score' },
    { id: 'goals', label: 'Goals' },
    { id: 'shots', label: 'Shots' },
    { id: 'saves', label: 'Saves' },
    { id: 'assists', label: 'Assists' },
  ];

  // Get chart colors based on theme
  const isDark = resolvedTheme === 'dark';
  const blueColors = getTeamColors('blue', isDark);
  const orangeColors = getTeamColors('orange', isDark);
  const chartInk = getChartInk(isDark);

  const selectedMetricLabel =
    metricOptions.find((m) => m.id === selectedMetric)?.label || 'Score';
  const blueValue = blueTeam[selectedMetric as keyof Team] as number;
  const orangeValue = orangeTeam[selectedMetric as keyof Team] as number;

  const chartData: ChartData<'bar'> = {
    labels: ['Blue Team', 'Orange Team'],
    datasets: [
      {
        label: selectedMetricLabel,
        data: [blueValue, orangeValue],
        backgroundColor: [blueColors.background, orangeColors.background],
        borderColor: [blueColors.border, orangeColors.border],
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

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Game Summary */}
      <Card>
        <CardHeader>
          <CardSectionLabel>Game summary</CardSectionLabel>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x [&>div]:md:pl-6 [&>div:first-child]:md:pl-0">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Final score
              </p>
              <p className="text-3xl font-bold tabular-nums mt-1">
                {blueTeam.goals} - {orangeTeam.goals}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {winner === 'Draw' ? 'Match ended in a draw' : `${winner} wins`}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Duration
              </p>
              <p className="text-3xl font-bold tabular-nums mt-1">
                {formatDuration(metrics.duration)}
              </p>
              {metrics.overtime && (
                <p className="text-sm text-muted-foreground mt-1">
                  Including {formatDuration(metrics.overtime_seconds || 0)}{' '}
                  overtime
                </p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Map
              </p>
              <p className="text-3xl font-bold truncate mt-1">
                {metrics.map_name}
              </p>
              {metrics.playlist && (
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.playlist}
                  {metrics.season ? ` • Season ${metrics.season}` : ''}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Comparison */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardSectionLabel>Team comparison</CardSectionLabel>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((option) => (
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
              aria-label={`${selectedMetricLabel} by team: ${
                blueTeam.name || 'Blue Team'
              } ${blueValue}, ${orangeTeam.name || 'Orange Team'} ${orangeValue}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamCard team={blueTeam} side="blue" />
        <TeamCard team={orangeTeam} side="orange" />
      </div>

      {/* MVP */}
      {mvpPlayer && (
        <Card>
          <CardHeader>
            <CardSectionLabel>MVP</CardSectionLabel>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span
                className={cn(
                  'text-lg font-medium',
                  TEAM_CLASSES[mvpPlayer.teamColor].text
                )}
              >
                {mvpPlayer.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {mvpPlayer.team}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-x-6 mt-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Score
                </p>
                <p className="text-xl font-semibold tabular-nums">
                  {mvpPlayer.score}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Goals
                </p>
                <p className="text-xl font-semibold tabular-nums">
                  {mvpPlayer.goals}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assists
                </p>
                <p className="text-xl font-semibold tabular-nums">
                  {mvpPlayer.assists}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Saves
                </p>
                <p className="text-xl font-semibold tabular-nums">
                  {mvpPlayer.saves}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replay Info */}
      <Card>
        <CardHeader>
          <CardSectionLabel>Source</CardSectionLabel>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium tabular-nums">
                {formatDateTime(metrics.date)}
              </p>
            </div>
            {replayData.ballchasingId && (
              <div>
                <p className="text-sm text-muted-foreground">Full stats</p>
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  asChild
                >
                  <a
                    href={`https://ballchasing.com/replay/${replayData.ballchasingId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on ballchasing.com
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReplayStats;
