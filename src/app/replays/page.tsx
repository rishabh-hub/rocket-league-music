// app/replays/page.tsx
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
  Upload,
  FileUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Replay {
  id: string;
  file_name: string;
  status: string;
  ballchasing_id?: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export default function ReplaysPage() {
  const router = useRouter();
  const supabase = createClient();

  const [replays, setReplays] = useState<Replay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReplays = async () => {
      try {
        setLoading(true);

        // Check if user is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch replays from the database
        const { data, error } = await supabase
          .from('replays')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setReplays(data || []);
      } catch (err: any) {
        console.error('Error fetching replays:', err);
        setError(err.message || 'Failed to fetch replays');
      } finally {
        setLoading(false);
      }
    };

    fetchReplays();
  }, [router, supabase]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
          >
            <Clock className="h-3 w-3" /> Uploaded
          </Badge>
        );
      case 'processing':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
          >
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </Badge>
        );
      case 'ready':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          >
            <CheckCircle2 className="h-3 w-3" /> Ready
          </Badge>
        );
      case 'failed':
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
          >
            <AlertTriangle className="h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          <h1 className="text-3xl font-bold">Your Replays</h1>
        </div>
        <Button onClick={() => router.push('/upload')}>
          <Upload className="mr-2 h-4 w-4" /> Upload New Replay
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Error Loading Replays
              </h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : replays.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Replays Found</h2>
              <p className="text-muted-foreground mb-4">
                Upload your first Rocket League replay file to get started
              </p>
              <Button onClick={() => router.push('/upload')}>
                Upload Replay
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Replay Files</CardTitle>
            <CardDescription>
              View and analyze your uploaded Rocket League replays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replays.map((replay) => (
                  <TableRow key={replay.id}>
                    <TableCell className="font-medium">
                      {replay.file_name}
                    </TableCell>
                    <TableCell>{getStatusBadge(replay.status)}</TableCell>
                    <TableCell className="capitalize">
                      {replay.visibility}
                    </TableCell>
                    <TableCell>{formatDate(replay.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/replays/${replay.id}`)}
                        disabled={replay.status === 'failed'}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
