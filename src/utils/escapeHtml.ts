// ABOUTME: Escapes a string for safe interpolation into an HTML email body.
// ABOUTME: Notification emails carry visitor-supplied text, which is never trusted.

export function escapeHtml(value: string | undefined | null): string {
  if (!value) return 'Not available';

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
