// ABOUTME: Segment-level layout for the replay detail page.
// ABOUTME: Exports metadata since the page itself is a client component and cannot export metadata directly.

import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Replay Details | ReplayRhythms',
  description:
    'Match stats, playstyle breakdown, and the songs that match how you played.',
  robots: { index: false, follow: true },
};

export default function ReplayDetailLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
