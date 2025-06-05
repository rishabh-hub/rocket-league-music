// @ts-nocheck
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Payment Successful | ReplayRhythms',
  description: 'Your payment was successful. Welcome to ReplayRhythms Pro!',
};

export default async function PaymentSuccessPage({ searchParams }) {
  // If no session_id, redirect to home
  if (!searchParams.session_id) {
    redirect('/');
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
      <div className="bg-card mx-auto max-w-md rounded-lg p-6 shadow-lg">
        <CheckCircle
          className="mx-auto mb-4 size-16 text-green-500"
          aria-hidden="true"
        />
        <h1 className="mb-4 text-3xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for upgrading to Pro! Your account has been upgraded and you
          now have access to all premium features.
        </p>
        <Button asChild size="lg">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
