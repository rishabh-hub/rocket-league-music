import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Payment successful',
  description: 'Your ReplayRhythms Pro subscription is active.',
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  // If no session_id, redirect to home
  if (!params.session_id) {
    redirect('/');
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
      <Card className="mx-auto max-w-md p-6">
        <CheckCircle
          className="text-primary mx-auto mb-4 size-10"
          aria-hidden="true"
        />
        <h1 className="mb-4 text-3xl font-semibold">You are on Pro</h1>
        <p className="text-muted-foreground mb-6">
          Your subscription is active and a receipt is on its way to your inbox.
        </p>
        <Button asChild size="lg">
          <Link href="/upload-replay">Upload a replay</Link>
        </Button>
      </Card>
    </div>
  );
}
