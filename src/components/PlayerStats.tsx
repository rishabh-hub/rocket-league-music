// components/PlayerStats.tsx
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
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

interface PlayerStatsProps {
  replayData: ReplayData;
  statType: 'core' | 'boost' | 'positioning';
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ replayData, statType }) => {
  const { theme } = useTheme();
  // Get stat labels and values based on statType
  const getStatConfig = () => {
    switch (statType) {
      case 'boost':
        return {
          title: 'Boost Stats',
          stats: [
            {
              id: 'avg_amount',
              label: 'Average Boost',
              path: 'boost.avg_amount',
            },
            {
              id: 'amount_collected',
              label: 'Boost Collected',
              path: 'boost.amount_collected',
            },
            {
              id: 'amount_stolen',
              label: 'Boost Stolen',
              path: 'boost.amount_stolen',
            },
            {
              id: 'time_zero_boost_percent',
              label: 'Time at Zero Boost (%)',
              path: 'boost.time_zero_boost_percent',
            },
            {
              id: 'time_full_boost_percent',
              label: 'Time at Full Boost (%)',
              path: 'boost.time_full_boost_percent',
            },
          ],
        };
      case 'positioning':
        return {
          title: 'Positioning Stats',
          stats: [
            {
              id: 'time_defensive_third_percent',
              label: 'Time in Defensive Third (%)',
              path: 'positioning.time_defensive_third_percent',
            },
            {
              id: 'time_neutral_third_percent',
              label: 'Time in Neutral Third (%)',
              path: 'positioning.time_neutral_third_percent',
            },
            {
              id: 'time_offensive_third_percent',
              label: 'Time in Offensive Third (%)',
              path: 'positioning.time_offensive_third_percent',
            },
            {
              id: 'time_behind_ball_percent',
              label: 'Time Behind Ball (%)',
              path: 'positioning.time_behind_ball_percent',
            },
            {
              id: 'avg_speed',
              label: 'Average Speed',
              path: 'movement.avg_speed',
            },
            {
              id: 'time_supersonic_speed_percent',
              label: 'Time at Supersonic (%)',
              path: 'movement.time_supersonic_speed_percent',
            },
          ],
        };
      case 'core':
      default:
        return {
          title: 'Core Stats',
          stats: [
            { id: 'score', label: 'Score', path: 'score' },
            { id: 'goals', label: 'Goals', path: 'goals' },
            { id: 'assists', label: 'Assists', path: 'assists' },
            { id: 'saves', label: 'Saves', path: 'saves' },
            { id: 'shots', label: 'Shots', path: 'shots' },
            {
              id: 'shooting_percentage',
              label: 'Shooting Percentage (%)',
              path: 'shooting_percentage',
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
          <p>No replay metrics available</p>
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
      teamName: blueTeam.name,
    })),
    ...orangeTeam.players.map((player) => ({
      ...player,
      team: 'orange',
      teamName: orangeTeam.name,
    })),
  ];

  //   const statConfig = getStatConfig();

  // Get the value from a nested path
  const getValueByPath = (obj: any, path: string) => {
    return path
      .split('.')
      .reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  };

  // Get chart colors based on theme
  const getTeamColor = (team: string) => {
    if (team === 'blue') {
      return {
        background:
          theme === 'dark'
            ? 'rgba(59, 130, 246, 0.8)'
            : 'rgba(59, 130, 246, 0.7)',
        border:
          theme === 'dark' ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)',
      };
    } else {
      return {
        background:
          theme === 'dark'
            ? 'rgba(249, 115, 22, 0.8)'
            : 'rgba(249, 115, 22, 0.7)',
        border:
          theme === 'dark' ? 'rgba(249, 115, 22, 1)' : 'rgba(234, 88, 12, 1)',
      };
    }
  };

  // Prepare chart data
  const selectedStatConfig = statConfig.stats.find(
    (s) => s.id === selectedStat
  );

  const chartData: ChartData<'bar'> = {
    labels: allPlayers.map((p) => p.name),
    datasets: [
      {
        label: selectedStatConfig?.label || '',
        data: allPlayers.map((p) =>
          getValueByPath(p, selectedStatConfig?.path || '')
        ),
        backgroundColor: allPlayers.map((p) => getTeamColor(p.team).background),
        borderColor: allPlayers.map((p) => getTeamColor(p.team).border),
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
        text: selectedStatConfig?.label || '',
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{statConfig.title}</CardTitle>
          <Select value={selectedStat} onValueChange={setSelectedStat}>
            <SelectTrigger className="w-[200px]">
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
          <div className="h-[300px] w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Player Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Player Stats Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  {statConfig.stats.map((stat) => (
                    <TableHead key={stat.id}>{stat.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPlayers.map((player, index) => (
                  <TableRow
                    key={index}
                    className={
                      player.mvp ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                    }
                  >
                    <TableCell className="font-medium">
                      {player.name}
                      {player.mvp && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        >
                          MVP
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          player.team === 'blue'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                        }
                      >
                        {player.teamName}
                      </Badge>
                    </TableCell>
                    {statConfig.stats.map((stat) => {
                      const value = getValueByPath(player, stat.path);
                      return (
                        <TableCell key={stat.id}>
                          {stat.id === 'shooting_percentage' ||
                          stat.id.includes('percent')
                            ? `${value?.toFixed(1)}%`
                            : value}
                        </TableCell>
                      );
                    })}
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
