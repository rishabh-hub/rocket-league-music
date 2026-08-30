import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Sign-in link expired',
};

export default function AuthCodeErrorPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Card className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-4 text-2xl font-semibold">
          That sign-in link expired
        </h1>
        <p className="text-muted-foreground mb-6">
          Google sign-in links are only good for a few minutes. Start again and
          you will be straight back in.
        </p>
        <Button asChild>
          <Link href="/login">Sign in with Google</Link>
        </Button>
      </Card>
    </div>
  );
}
