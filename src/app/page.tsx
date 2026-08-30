'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Loader2, ArrowUpRight } from 'lucide-react';
import {
  CardCurtain,
  CardCurtainReveal,
  CardCurtainRevealBody,
  CardCurtainRevealDescription,
  CardCurtainRevealFooter,
  CardCurtainRevealTitle,
} from '@/components/ui/card-curtain-reveal';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import ShowcaseButton from '@/components/ShowcaseButton';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex flex-col">
        <h1 className="font-display text-5xl font-semibold tracking-[-0.034em] text-foreground mb-3">
          Hear how you play
        </h1>

        <p className="text-muted-foreground max-w-lg">
          Upload a replay. ReplayRhythms reads your boost, pace and positioning
          off ballchasing.com and hands back songs that fit.
        </p>
        <p className="text-muted-foreground mt-2 max-w-lg text-sm">
          On Windows, Rocket League saves every match to Documents\My
          Games\Rocket League\TAGame\Demos.
        </p>
        <div className="self-start">
          <ShowcaseButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-12">
        <div
          onClick={() => {
            if (isAuthenticated) {
              router.push('/upload-replay');
            } else {
              router.push('/login');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (isAuthenticated) {
                router.push('/upload-replay');
              } else {
                router.push('/login');
              }
            }
          }}
          className="md:col-span-3 cursor-pointer rounded-lg border border-transparent transition-colors duration-instant hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          role="button"
          tabIndex={0}
          aria-label="Upload a replay"
        >
          <div className="relative">
            <div className="absolute inset-0 z-0">
              <Image
                fill
                alt="A Rocket League car mid-air in an arena"
                src="/images/porsche.webp"
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 60vw"
                quality={75}
                priority
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--overlay))] via-[hsl(var(--overlay)_/_0.9)] to-[hsl(var(--overlay)_/_0.5)]"></div>
            </div>

            <CardCurtainReveal className="relative z-10 h-[600px] w-full border border-border bg-transparent text-zinc-50">
              <CardCurtainRevealBody className="p-8">
                <CardCurtainRevealTitle className="text-3xl font-medium tracking-tight mb-6 text-zinc-50">
                  Upload Replay
                </CardCurtainRevealTitle>
                <CardCurtainRevealDescription className="mb-8">
                  <p className="text-base leading-relaxed text-zinc-300">
                    Drop in a .replay file. ballchasing.com breaks out the match
                    — boost usage, time behind the ball, supersonic time, shots
                    — and those numbers pick the songs. Usually done in two
                    minutes.
                    {!isAuthenticated && (
                      <span className="block mt-2 text-sm text-zinc-400">
                        Sign in first
                      </span>
                    )}
                  </p>
                </CardCurtainRevealDescription>

                <Button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents the outer div's onClick from firing
                    if (isAuthenticated) {
                      router.push('/upload-replay');
                    } else {
                      router.push('/login');
                    }
                  }}
                  variant={'secondary'}
                  size={'icon'}
                  className="aspect-square rounded-full"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <ArrowUpRight />
                </Button>
                <CardCurtain className="bg-zinc-50" />
              </CardCurtainRevealBody>
              <CardCurtainRevealFooter className="mt-auto" />
            </CardCurtainReveal>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Drop a .replay file, get a playlist.
          </p>
        </div>

        <div
          onClick={() => {
            if (isAuthenticated) {
              router.push('/replays');
            } else {
              router.push('/login');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (isAuthenticated) {
                router.push('/replays');
              } else {
                router.push('/login');
              }
            }
          }}
          className="md:col-span-2 md:mt-16 cursor-pointer rounded-lg border border-transparent transition-colors duration-instant hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          role="button"
          tabIndex={0}
          aria-label="Your replays"
        >
          <div className="relative">
            <div className="absolute inset-0 z-0">
              <Image
                fill
                alt="A ReplayRhythms stats screen for a finished match"
                src="/images/dashboard.png"
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 40vw"
                quality={75}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--overlay))] via-[hsl(var(--overlay)_/_0.9)] to-[hsl(var(--overlay)_/_0.5)]"></div>
            </div>

            <CardCurtainReveal className="relative z-10 h-[520px] w-full border border-border bg-transparent text-zinc-50">
              <CardCurtainRevealBody className="p-8">
                <CardCurtainRevealTitle className="text-3xl font-medium tracking-tight mb-6 text-zinc-50">
                  View Your Replays
                </CardCurtainRevealTitle>
                <CardCurtainRevealDescription className="mb-8">
                  <p className="text-base leading-relaxed text-zinc-300">
                    Every replay you have uploaded, and the songs each one
                    produced. Play them inline, or open them in Spotify.
                    {!isAuthenticated && (
                      <span className="block mt-2 text-sm text-zinc-400">
                        Sign in to see yours
                      </span>
                    )}
                  </p>
                </CardCurtainRevealDescription>

                <Button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents the outer div's onClick from firing
                    if (isAuthenticated) {
                      router.push('/replays');
                    } else {
                      router.push('/login');
                    }
                  }}
                  variant={'secondary'}
                  size={'icon'}
                  className="aspect-square rounded-full"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <ArrowUpRight />
                </Button>
                <CardCurtain className="bg-zinc-50" />
              </CardCurtainRevealBody>
              <CardCurtainRevealFooter className="mt-auto" />
            </CardCurtainReveal>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Every upload keeps its track list.
          </p>
        </div>
      </div>
    </div>
  );
}
