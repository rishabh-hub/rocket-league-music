// ABOUTME: Site footer rendered under every route by the root layout.
// ABOUTME: Closes the page with the wordmark and credits the replay and track data sources.

export const Footer = () => {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="container flex h-16 items-center justify-between text-xs text-muted-foreground">
        <span>ReplayRhythms</span>
        <span>Replay data via ballchasing.com · Tracks via Spotify</span>
      </div>
    </footer>
  );
};
