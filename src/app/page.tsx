// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { CardTitle } from '@/components/ui/card';
import { FileUp, BarChart, Loader2 } from 'lucide-react';
import {
  CardCurtain,
  CardCurtainReveal,
  CardCurtainRevealBody,
  CardCurtainRevealDescription,
  CardCurtainRevealFooter,
  CardCurtainRevealTitle,
} from '@/components/ui/card-curtain-reveal';
import { CurtainRevealButton } from '@/components/ui/CurtainRevealButton';

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
        <CardCurtainReveal className="h-[760px] w-120 border border-zinc-100 bg-zinc-950 text-zinc-50 shadow">
          <CardCurtainRevealBody className="">
            <CardCurtainRevealTitle className="text-3xl font-medium tracking-tight">
              <CardTitle>Upload Replay</CardTitle>
            </CardCurtainRevealTitle>
            <CardCurtainRevealDescription className="my-4">
              Upload your .replay files to see <br /> detailed stats, boost
              usage, positioning data and more from your games.
            </CardCurtainRevealDescription>

            <CurtainRevealButton onClick={() => router.push('/upload-replay')}>
              <FileUp className="mr-2 h-4 w-4" /> Upload Replay
            </CurtainRevealButton>
            <CardCurtain className=" bg-zinc-50" />
          </CardCurtainRevealBody>
          <CardCurtainRevealFooter className="mt-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              width="100%"
              height="100%"
              alt="Tokyo street"
              className=""
              src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2388&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            />
          </CardCurtainRevealFooter>
        </CardCurtainReveal>

        <CardCurtainReveal className="h-[760px] w-120 border border-zinc-100 bg-zinc-950 text-zinc-50 shadow">
          <CardCurtainRevealBody className="">
            <CardCurtainRevealTitle className="text-3xl font-medium tracking-tight">
              <CardTitle>View Your Replays</CardTitle>
            </CardCurtainRevealTitle>
            <CardCurtainRevealDescription className=" my-4">
              View and analyze <br /> your previously uploaded replays
            </CardCurtainRevealDescription>
            <CurtainRevealButton onClick={() => router.push('/replays')}>
              <BarChart className="mr-2 h-4 w-4" /> View Replays
            </CurtainRevealButton>
            <CardCurtain className=" bg-zinc-50" />
          </CardCurtainRevealBody>

          <CardCurtainRevealFooter className="mt-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              width="100%"
              height="100%"
              alt="Tokyo street"
              className=""
              src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2388&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            />
          </CardCurtainRevealFooter>
        </CardCurtainReveal>
      </div>
    </div>
  );
}
