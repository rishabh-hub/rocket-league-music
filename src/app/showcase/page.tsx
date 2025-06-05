'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface Replay {
  id: string;
  file_name: string;
  status: string;
  ballchasing_id?: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  metrics?: any;
}

export default function ShowcasePage() {
  const router = useRouter();
  const supabase = createClient();

  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShowcaseReplays = async () => {
      try {
        setLoading(true);

        // Fetch public replays from the database
        const { data, error } = await supabase
          .from('replays')
          .select('*')
          .eq('visibility', 'public')
          .eq('status', 'ready') // Only show ready replays
          .order('created_at', { ascending: false })
          .limit(10); // Limit to recent 10 showcase replays

        if (error) {
          throw error;
        }

        setReplays(data || []);
      } catch (err: any) {
        console.error('Error fetching showcase replays:', err);
        setError(err.message || 'Failed to fetch showcase replays');
      } finally {
        setLoading(false);
      }
    };

    fetchShowcaseReplays();
  }, [supabase]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          >
            <CheckCircle2 className="h-3 w-3" /> Ready
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get game summary from the metrics if available
  const getGameSummary = (replay: Replay) => {
    if (replay.metrics?.blue?.name && replay.metrics?.orange?.name) {
      return `${replay.metrics.blue.name} ${replay.metrics.blue.goals} - ${replay.metrics.orange.goals} ${replay.metrics.orange.name}`;
    }
    return replay.file_name;
  };

  // Extract map name if available
  const getMapName = (replay: Replay) => {
    return replay.metrics?.map_name || 'Unknown Map';
  };

  // Card variants for framer-motion
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="container py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          <h1 className="text-3xl font-bold">Replay Showcase</h1>
          <p className="text-muted-foreground mt-2">
            Explore public replays from the community
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Error Loading Showcase
              </h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : replays.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <TrendingUp className="h-10 w-10 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                No Showcase Replays Yet
              </h2>
              <p className="text-muted-foreground mb-4">
                Be the first to share your replays with the community!
              </p>
              <Button onClick={() => router.push('/upload')}>
                Upload a Replay
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show">
          {replays.map((replay, index) => (
            <motion.div key={replay.id} variants={item} className="mb-4">
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-0">
                  <div
                    className="cursor-pointer p-4"
                    onClick={() => router.push(`/replays/${replay.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/replays/${replay.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View analysis for ${getGameSummary(replay)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          {getGameSummary(replay)}
                        </h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <span>{getMapName(replay)}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(replay.created_at)}</span>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-amber-500 text-white border-none">
                            <Award className="h-3 w-3 mr-1" /> Featured
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/replays/${replay.id}`);
                        }}
                      >
                        View Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
