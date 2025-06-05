// app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { CardTitle } from '@/components/ui/card';
import { Loader2, ArrowUpRight } from 'lucide-react';
import {
  CardCurtain,
  CardCurtainReveal,
  CardCurtainRevealBody,
  CardCurtainRevealDescription,
  CardCurtainRevealFooter,
  CardCurtainRevealTitle,
} from '@/components/ui/card-curtain-reveal';
import { CurtainRevealButton } from '@/components/ui/CurtainRevealButton';
import Image from 'next/image';
import { motion } from 'motion/react';
import ShowcaseButton from '@/components/ShowcaseButton';

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

  // Show different content based on authentication status
  const isAuthenticated = !!user;

  return (
    <div className="container max-w-5xl py-8 px-4">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
          Rocket League Replay Analyzer
        </h1>

        <motion.p className="dark:text-zinc-400 text-zinc-600 max-w-md">
          Elevate your game with detailed insights and analytics from your match
          replays
        </motion.p>
        <ShowcaseButton />
      </motion.div>

      <motion.p
        className="text-center text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        See what others are analyzing
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
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
          className="cursor-pointer transition-transform hover:scale-[1.01]"
          role="button"
          tabIndex={0}
          aria-label="Navigate to upload replay page"
        >
          {/* Card with background image */}
          <div className="relative">
            {/* Background image positioned absolute to fill the entire card */}
            <div className="absolute inset-0 z-0">
              <Image
                fill
                alt="Rocket League car in arena - Upload replay files to analyze your gameplay"
                src="/images/porsche.webp"
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                priority
              />
              {/* Gradient overlay that adapts to theme */}
              <div className="absolute inset-0 bg-gradient-to-b dark:from-zinc-950 dark:via-zinc-950/90 dark:to-zinc-950/50 from-white/90 via-white/75 to-white/50"></div>
            </div>

            {/* CardCurtainReveal positioned relative on top of the background */}
            <CardCurtainReveal className="relative z-10 h-[600px] w-full border border-zinc-100 dark:border-zinc-800 bg-transparent dark:text-zinc-50 text-zinc-900 shadow dark:hover:text-zinc-50 hover:text-zinc-900">
              <CardCurtainRevealBody className="p-8">
                <CardCurtainRevealTitle className="text-3xl font-medium tracking-tight mb-6 dark:text-zinc-50 text-zinc-700">
                  <CardTitle>Upload Replay</CardTitle>
                </CardCurtainRevealTitle>
                <CardCurtainRevealDescription className="mb-8">
                  <p className="text-base leading-relaxed text-zinc-300">
                    Upload your .replay files and discover detailed insights
                    about your gameplay. Analyze boost usage patterns,
                    positioning data, and performance metrics to elevate your
                    skills and strategy. Identify areas for improvement with our
                    comprehensive dashboard.
                    {!isAuthenticated && (
                      <span className="block mt-2 text-sm text-blue-400">
                        Sign in to get started!
                      </span>
                    )}
                  </p>
                </CardCurtainRevealDescription>

                <CurtainRevealButton
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
                >
                  <ArrowUpRight />
                </CurtainRevealButton>
                <CardCurtain className="dark:bg-zinc-50 bg-white" />
              </CardCurtainRevealBody>
              {/* No image in the footer since it's already in the background */}
              <CardCurtainRevealFooter className="mt-auto">
                {/* Empty footer to maintain the layout */}
              </CardCurtainRevealFooter>
            </CardCurtainReveal>
          </div>
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
          className="cursor-pointer transition-transform hover:scale-[1.01]"
          role="button"
          tabIndex={0}
          aria-label="Navigate to view replays page"
        >
          {/* Card with background image */}
          <div className="relative">
            {/* Background image positioned absolute to fill the entire card */}
            <div className="absolute inset-0 z-0">
              <Image
                fill
                alt="Rocket League analytics dashboard showing match statistics and gameplay metrics"
                src="/images/dashboard.png"
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                priority
              />
              {/* Gradient overlay that adapts to theme */}
              <div className="absolute inset-0 bg-gradient-to-b dark:from-zinc-950 dark:via-zinc-950/90 dark:to-zinc-950/50 from-white/90 via-white/75 to-white/50"></div>
            </div>

            {/* CardCurtainReveal positioned relative on top of the background */}
            <CardCurtainReveal className="relative z-10 h-[600px] w-full border border-zinc-100 dark:border-zinc-800 bg-transparent dark:text-zinc-50 text-zinc-900 shadow dark:hover:text-zinc-50 hover:text-zinc-900">
              <CardCurtainRevealBody className="p-8">
                <CardCurtainRevealTitle className="text-3xl font-medium tracking-tight mb-6 dark:text-zinc-50 text-zinc-700">
                  <CardTitle>View Your Replays</CardTitle>
                </CardCurtainRevealTitle>
                <CardCurtainRevealDescription className="mb-8">
                  <p className="text-base leading-relaxed text-zinc-300">
                    Browse and analyze your match history with our interactive
                    visualizations. Track your progress over time, compare stats
                    between matches, and gain strategic insights to help you
                    rank up faster. Filter replays by map, game mode, and
                    teammates to discover your winning patterns.
                    {!isAuthenticated && (
                      <span className="block mt-2 text-sm text-blue-400">
                        Sign in to access your replays!
                      </span>
                    )}
                  </p>
                </CardCurtainRevealDescription>

                <CurtainRevealButton
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
                >
                  <ArrowUpRight />
                </CurtainRevealButton>
                <CardCurtain className="dark:bg-zinc-50 bg-white" />
              </CardCurtainRevealBody>
              {/* No image in the footer since it's already in the background */}
              <CardCurtainRevealFooter className="mt-auto">
                {/* Empty footer to maintain the layout */}
              </CardCurtainRevealFooter>
            </CardCurtainReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
