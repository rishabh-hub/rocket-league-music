import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Sign-in failed',
  description:
    'That sign-in did not go through. Start again from the sign-in page.',
};

export default function ErrorPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
      <Card className="mx-auto max-w-md p-6">
        <h1 className="mb-4 text-2xl font-semibold">That did not go through</h1>
        <p className="text-muted-foreground mb-6">
          Either the email and password did not match an account, or the
          confirmation link you clicked has already been used. Both are fixable
          from the sign-in page.
        </p>
        <Button asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </Card>
    </div>
  );
}
