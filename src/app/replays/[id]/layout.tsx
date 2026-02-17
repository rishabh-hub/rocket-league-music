// ABOUTME: Segment-level layout for the replay detail page.
// ABOUTME: Exports metadata since the page itself is a client component and cannot export metadata directly.

import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Replay Details | ReplayRhythms',
  description:
    'View detailed Rocket League replay analysis with personalized music recommendations based on gameplay stats and playstyle.',
  robots: { index: true, follow: true },
};

export default function ReplayDetailLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
