// ABOUTME: Unit tests for the card X and Discord unfurl from a shared match link.
// ABOUTME: A match's details may only appear once its owner has made it public.

import { generateMetadata } from '@/app/replays/[id]/layout';

// The query chains .eq() twice before .single(), so the mock returns itself.
type Chain = { eq: jest.Mock; single: jest.Mock };

const single = jest.fn();
const eq: jest.Mock = jest.fn((): Chain => ({ eq, single }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select }));

jest.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({ from }),
}));

const READY_METRICS = {
  title: 'buena partida para subir a c2',
  map_name: 'Farmstead (Pitched)',
  playlist: 'Ranked Doubles',
  teams: {
    blue: { name: 'Blue', goals: 2 },
    orange: { name: 'Orange', goals: 5 },
  },
};

const params = Promise.resolve({ id: 'abc123' });

describe('the shared match card', () => {
  beforeEach(() => jest.clearAllMocks());

  it('names the match, so a shared link is worth opening', async () => {
    single.mockResolvedValue({
      data: {
        file_name: 'x.replay',
        metrics: READY_METRICS,
        visibility: 'public',
      },
    });

    const meta = await generateMetadata({ params });

    expect(meta.title).toContain('buena partida para subir a c2');
    expect(meta.openGraph?.title).toContain('buena partida para subir a c2');
    expect(meta.openGraph?.description).toContain('Farmstead (Pitched)');
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  // The query filters on visibility, so anything not public comes back empty.
  it('says nothing about a match its owner has not made public', async () => {
    single.mockResolvedValue({ data: null });

    const meta = await generateMetadata({ params });

    expect(meta.title).toBe('Replay Details | ReplayRhythms');
    expect(meta.openGraph).toBeUndefined();
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it('only ever asks for public rows', async () => {
    single.mockResolvedValue({ data: null });

    await generateMetadata({ params });

    expect(eq).toHaveBeenCalledWith('visibility', 'public');
  });

  it('falls back to the generic card rather than failing the page', async () => {
    single.mockRejectedValue(new Error('supabase is down'));

    const meta = await generateMetadata({ params });

    expect(meta.title).toBe('Replay Details | ReplayRhythms');
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});
