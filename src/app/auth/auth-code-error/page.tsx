import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold">Authentication Error</h1>
      <p className="mb-8 text-center">
        There was a problem with the authentication process. This could be due
        to an expired or invalid authentication code.
      </p>
      <Button asChild>
        <Link href="/login">Try Again</Link>
      </Button>
    </div>
  );
}
