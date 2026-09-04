// ABOUTME: Unit tests for the match summary shared by the replays list and the showcase.
// ABOUTME: Fixtures are the real metrics shapes Supabase stores for ready, processing and failed replays.

import { matchSummary } from '@/utils/matchSummary';
import { Replay } from '@/types/replay';

const FILE_NAME = '9F3C1D2A-4B5E-6789-ABCD-0123456789EF.replay';

// A row copied from the replays table for a replay that finished processing.
const readyMetrics = {
  date: '2026-03-25T15:32:58-05:00',
  teams: {
    blue: {
      name: 'Blue',
      goals: 2,
      saves: 2,
      score: 754,
      shots: 3,
      assists: 1,
      players: [
        { id: 'b8b68a19ff010900', mvp: false, name: 'MlxIy', goals: 1 },
        { id: '89ef629af7134926', mvp: false, name: 'Slick_FR', goals: 1 },
      ],
      shooting_percentage: 66.666664,
    },
    orange: {
      name: 'Orange',
      goals: 5,
      saves: 0,
      score: 961,
      shots: 7,
      assists: 0,
      players: [
        { id: 'b42325f5d1324f74', mvp: true, name: 'co.ve', goals: 4 },
        { id: 'kingjames908', mvp: false, name: 'kingjames908', goals: 1 },
      ],
      shooting_percentage: 71.42857,
    },
  },
  title: 'buena partida para subir a c2',
  season: 21,
  duration: 325,
  map_name: 'Farmstead (Pitched)',
  overtime: false,
  playlist: 'Ranked Doubles',
  overtime_seconds: 0,
};

const replay = (metrics: any): Replay => ({
  id: 'a1b2c3',
  file_name: FILE_NAME,
  status: 'ready',
  visibility: 'private',
  created_at: '2026-03-25T20:40:00Z',
  updated_at: '2026-03-25T20:41:00Z',
  metrics,
});

describe('matchSummary for a processed replay', () => {
  it('leads with the name the player gave the replay, not the file name', () => {
    const summary = matchSummary(replay(readyMetrics));

    expect(summary.primary).toBe('buena partida para subir a c2');
    expect(summary.primary).not.toBe(FILE_NAME);
  });

  it('reads the scoreline through teams and carries playlist and map', () => {
    const summary = matchSummary(replay(readyMetrics));

    expect(summary.secondary).toBe(
      'Blue 2–5 Orange · Ranked Doubles · Farmstead (Pitched)'
    );
  });

  it('promotes the scoreline when the replay was never named', () => {
    const summary = matchSummary(replay({ ...readyMetrics, title: '' }));

    expect(summary.primary).toBe('Blue 2–5 Orange');
    expect(summary.secondary).toBe('Ranked Doubles · Farmstead (Pitched)');
  });

  it('marks a match that went to overtime', () => {
    const summary = matchSummary(replay({ ...readyMetrics, overtime: true }));

    expect(summary.secondary).toContain('Blue 2–5 Orange (OT)');
  });
});

describe('matchSummary for a replay that is not ready', () => {
  it('falls back to the file name once while processing, with no second line', () => {
    const summary = matchSummary(
      replay({ check_failures: 3, last_check_error: 'timeout' })
    );

    expect(summary.primary).toBe(FILE_NAME);
    expect(summary.secondary).toBeNull();
  });

  it('explains a failure instead of repeating the file name', () => {
    const summary = matchSummary(
      replay({
        error:
          'Upload to ballchasing.com did not complete. Please try uploading again.',
        failure_reason: 'missing_ballchasing_id',
      })
    );

    expect(summary.primary).toBe(FILE_NAME);
    expect(summary.secondary).toBe(
      'Upload to ballchasing.com did not complete. Please try uploading again.'
    );
  });

  it('handles a replay whose metrics column is still empty', () => {
    const summary = matchSummary(replay(undefined));

    expect(summary.primary).toBe(FILE_NAME);
    expect(summary.secondary).toBeNull();
  });
});
