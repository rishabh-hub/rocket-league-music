// ABOUTME: Site footer rendered under every route by the root layout.
// ABOUTME: Closes the page with the wordmark and credits the replay and track data sources.

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="container flex min-h-16 flex-col items-start justify-between gap-1 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4 sm:py-0">
        <span>ReplayRhythms</span>
        <span>Replay data via ballchasing.com · Tracks via Spotify</span>
      </div>
    </footer>
  );
};
