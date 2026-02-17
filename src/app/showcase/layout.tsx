// ABOUTME: Segment-level layout for the showcase page.
// ABOUTME: Exports metadata since the page itself is a client component and cannot export metadata directly.

import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Replay Showcase | Community Rocket League Replays',
  description:
    "Browse community-shared Rocket League replays with personalized music recommendations. See how other players' unique playstyles translate into music.",
  openGraph: {
    title: 'Replay Showcase | ReplayRhythms',
    description:
      'Explore community Rocket League replays and their matching music recommendations.',
    type: 'website',
  },
};

export default function ShowcaseLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
