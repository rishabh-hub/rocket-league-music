// ABOUTME: Segment-level layout for the replay detail page.
// ABOUTME: Builds the share card, since the page itself is a client component and cannot.

import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

import { createClient } from '@/utils/supabase/server';
import { matchSummary } from '@/utils/matchSummary';

/**
 * The card X and Discord unfurl when someone shares a match.
 *
 * Only a public replay gets its details out: an unlisted or private one keeps
 * the generic card and stays out of search, so the metadata never says more
 * about a match than its owner chose to.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const generic: Metadata = {
    title: 'Replay Details | ReplayRhythms',
    description:
      'Match stats, playstyle breakdown, and the songs that match how you played.',
    robots: { index: false, follow: true },
  };

  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await supabase
      .from('replays')
      .select('file_name, metrics, visibility')
      .eq('id', id)
      .eq('visibility', 'public')
      .single();

    if (!data) return generic;

    const summary = matchSummary(data.metrics, data.file_name);
    const title = `${summary.primary} | ReplayRhythms`;
    const description =
      summary.secondary ?? 'The songs that match how this match was played.';

    return {
      title,
      description,
      robots: { index: true, follow: true },
      openGraph: { title, description, type: 'article' },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    // A metadata lookup must never take the page down with it.
    return generic;
  }
}

export default function ReplayDetailLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
