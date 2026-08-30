// ABOUTME: Segment-level layout for the showcase page.
// ABOUTME: Exports metadata since the page itself is a client component and cannot export metadata directly.

import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Showcase',
  description:
    'Public Rocket League replays from other players, and the songs their stats produced.',
  openGraph: {
    title: 'Showcase',
    description: "See what other players' matches sound like.",
    type: 'website',
  },
};

export default function ShowcaseLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
