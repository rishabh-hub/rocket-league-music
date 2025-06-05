// src/app/payment/cancel/page.tsx
import { XCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Payment Cancelled | ReplayRhythms',
  description:
    'Your payment was cancelled. No changes were made to your account.',
};

export default function PaymentCancelPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
      <div className="bg-card mx-auto max-w-md rounded-lg p-6 shadow-lg">
        <XCircle
          className="mx-auto mb-4 size-16 text-red-500"
          aria-hidden="true"
        />
        <h1 className="mb-4 text-3xl font-bold">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-6">
          The payment process was cancelled. No changes have been made to your
          account.
        </p>
        <Button asChild size="lg">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
