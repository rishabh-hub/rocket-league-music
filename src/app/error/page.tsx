export const metadata = {
  title: 'Error | ReplayRhythms',
  description: 'An error occurred while processing your request.',
};

export default function ErrorPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground mb-6">
        We apologize for the inconvenience. Please try again later.
      </p>
    </div>
  );
}
