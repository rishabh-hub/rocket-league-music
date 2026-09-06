// ABOUTME: The routes the navbar offers, shared by its wide and narrow layouts.
// ABOUTME: One list so a new route cannot appear on a laptop and go missing on a phone.

export const NAV_LINKS = [
  { href: '/upload-replay', label: 'Upload replay' },
  { href: '/replays', label: 'My replays' },
  { href: '/showcase', label: 'Showcase' },
] as const;
