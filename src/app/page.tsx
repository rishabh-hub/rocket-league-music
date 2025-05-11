// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUp, BarChart, LogOut, UserCircle, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      // Redirect to login if not authenticated
      if (!session) {
        router.push('/login');
      }
    };

    checkUser();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login via useEffect
  }

  return (
    <div className="container py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Rocket League Replay Analyzer</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Replay</CardTitle>
            <CardDescription>
              Upload a new Rocket League replay file for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Upload your .replay files to see detailed stats, boost usage,
              positioning data and more from your games.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/upload-replay')}
              className="w-full"
            >
              <FileUp className="mr-2 h-4 w-4" /> Upload Replay
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Your Replays</CardTitle>
            <CardDescription>
              View and analyze your previously uploaded replays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Browse your replay collection, check processing status, and view
              detailed analysis of your gameplay.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/replays')} className="w-full">
              <BarChart className="mr-2 h-4 w-4" /> View Replays
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
