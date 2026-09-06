// ABOUTME: Unit tests for the HTML escaper used in notification emails.
// ABOUTME: Feedback text is written by visitors, so it is never trusted in markup.

import { escapeHtml } from '@/utils/escapeHtml';

describe('escapeHtml', () => {
  it('neutralises a script tag someone puts in their feedback', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('escapes the characters that could break out of an attribute', () => {
    expect(escapeHtml(`" onload='x'`)).toBe('&quot; onload=&#039;x&#039;');
  });

  it('escapes ampersands first, so an entity is not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves ordinary prose alone', () => {
    const message = 'The upload spinner never stops on Farmstead replays.';
    expect(escapeHtml(message)).toBe(message);
  });

  it('reads as absent rather than blank when there is no value', () => {
    expect(escapeHtml(undefined)).toBe('Not available');
    expect(escapeHtml(null)).toBe('Not available');
    expect(escapeHtml('')).toBe('Not available');
  });
});
