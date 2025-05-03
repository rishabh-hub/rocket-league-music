// components/ReplayStats.tsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Player {
  name: string;
  platform?: string;
  id?: string;
  mvp: boolean;
  car_name?: string;
  car_id?: number;
  score: number;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  shooting_percentage: number;
  boost: {
    avg_amount: number;
    amount_collected: number;
    amount_stolen: number;
    time_zero_boost_percent: number;
    time_full_boost_percent: number;
  };
  movement: {
    avg_speed: number;
    total_distance: number;
    time_supersonic_speed_percent: number;
  };
  positioning: {
    time_defensive_third_percent: number;
    time_neutral_third_percent: number;
    time_offensive_third_percent: number;
    time_behind_ball_percent: number;
  };
}

interface Team {
  name: string;
  goals: number;
  shots: number;
  saves: number;
  assists: number;
  score: number;
  shooting_percentage: number;
  players: Player[];
}

interface ReplayMetrics {
  title: string;
  map_name: string;
  duration: number;
  date: string;
  playlist: string;
  overtime?: boolean;
  overtime_seconds?: number;
  season?: string;
  teams: {
    blue: Team;
    orange: Team;
  };
}

interface ReplayData {
  id: string;
  fileName: string;
  ballchasingId?: string;
  visibility: string;
  createdAt: string;
  metrics?: ReplayMetrics;
}

interface ReplayStatsProps {
  replayData: ReplayData;
}

const ReplayStats: React.FC<ReplayStatsProps> = ({ replayData }) => {
  const { theme } = useTheme();
  const [selectedMetric, setSelectedMetric] = React.useState<string>('score');

  if (!replayData || !replayData.metrics) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>No replay metrics available</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = replayData.metrics;
  const blueTeam = metrics.teams.blue;
  const orangeTeam = metrics.teams.orange;

  // Determine winner
  let winner = null;
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
        team: team.name,
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
  const getChartColors = () => {
    return {
      blue: {
        background:
          theme === 'dark'
            ? 'rgba(59, 130, 246, 0.8)'
            : 'rgba(59, 130, 246, 0.7)',
        border:
          theme === 'dark' ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)',
      },
      orange: {
        background:
          theme === 'dark'
            ? 'rgba(249, 115, 22, 0.8)'
            : 'rgba(249, 115, 22, 0.7)',
        border:
          theme === 'dark' ? 'rgba(249, 115, 22, 1)' : 'rgba(234, 88, 12, 1)',
      },
    };
  };

  const chartColors = getChartColors();

  const chartData: ChartData<'bar'> = {
    labels: ['Blue Team', 'Orange Team'],
    datasets: [
      {
        label:
          metricOptions.find((m) => m.id === selectedMetric)?.label || 'Score',
        data: [
          blueTeam[selectedMetric as keyof Team] as number,
          orangeTeam[selectedMetric as keyof Team] as number,
        ],
        backgroundColor: [
          chartColors.blue.background,
          chartColors.orange.background,
        ],
        borderColor: [chartColors.blue.border, chartColors.orange.border],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Team ${metricOptions.find((m) => m.id === selectedMetric)?.label || 'Score'} Comparison`,
        color: theme === 'dark' ? '#e2e8f0' : '#1e293b', // text color based on theme
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color:
            theme === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
        },
      },
      x: {
        grid: {
          color:
            theme === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
        },
      },
    },
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Game Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Game Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-3">
                <CardDescription>Final Score</CardDescription>
              </CardHeader>
              <CardContent className="py-1">
                <div className="text-3xl font-bold">
                  {blueTeam.goals} - {orangeTeam.goals}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {winner === 'Draw'
                    ? 'Match ended in a draw'
                    : `${winner} wins`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardDescription>Duration</CardDescription>
              </CardHeader>
              <CardContent className="py-1">
                <div className="text-3xl font-bold">
                  {formatDuration(metrics.duration)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.overtime
                    ? `Including ${formatDuration(metrics.overtime_seconds || 0)} overtime`
                    : 'No overtime'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardDescription>Map</CardDescription>
              </CardHeader>
              <CardContent className="py-1">
                <div className="text-2xl font-bold truncate">
                  {metrics.map_name}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.playlist || 'Unknown playlist'}
                  {metrics.season ? ` • Season ${metrics.season}` : ''}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Team Comparison */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Comparison</CardTitle>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[160px]">
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
          <div className="h-[300px] w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blue Team */}
        <Card className="border-blue-500 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">
              {blueTeam.name || 'Blue Team'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Goals</p>
                <p className="text-2xl font-bold">{blueTeam.goals}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shots</p>
                <p className="text-2xl font-bold">{blueTeam.shots}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shooting %</p>
                <p className="text-2xl font-bold">
                  {blueTeam.shooting_percentage.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saves</p>
                <p className="text-2xl font-bold">{blueTeam.saves}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assists</p>
                <p className="text-2xl font-bold">{blueTeam.assists}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{blueTeam.score}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orange Team */}
        <Card className="border-orange-500 dark:border-orange-700">
          <CardHeader>
            <CardTitle className="text-orange-600 dark:text-orange-400">
              {orangeTeam.name || 'Orange Team'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Goals</p>
                <p className="text-2xl font-bold">{orangeTeam.goals}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shots</p>
                <p className="text-2xl font-bold">{orangeTeam.shots}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shooting %</p>
                <p className="text-2xl font-bold">
                  {orangeTeam.shooting_percentage.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saves</p>
                <p className="text-2xl font-bold">{orangeTeam.saves}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assists</p>
                <p className="text-2xl font-bold">{orangeTeam.assists}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{orangeTeam.score}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MVP */}
      {mvpPlayer && (
        <Card>
          <CardHeader>
            <CardTitle>Most Valuable Player</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center justify-center h-16 w-16 rounded-full ${
                  mvpPlayer.teamColor === 'blue'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                }`}
              >
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <div className="font-medium text-lg">{mvpPlayer.name}</div>
                <div className="text-sm text-muted-foreground">
                  {mvpPlayer.team}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Score:</span>
                    <span>{mvpPlayer.score}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Goals:</span>
                    <span>{mvpPlayer.goals}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Assists:</span>
                    <span>{mvpPlayer.assists}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Saves:</span>
                    <span>{mvpPlayer.saves}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replay Info */}
      <Card>
        <CardHeader>
          <CardTitle>Replay Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(metrics.date)}</p>
            </div>
            {replayData.ballchasingId && (
              <div>
                <p className="text-sm text-muted-foreground">Ballchasing ID</p>
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
                    {replayData.ballchasingId.substring(0, 12)}...
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
