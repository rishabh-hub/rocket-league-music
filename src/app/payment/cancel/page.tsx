// src/app/payment/cancel/page.tsx
import { XCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Checkout cancelled',
  description: 'Nothing was charged, and your account is untouched.',
};

export default function PaymentCancelPage() {
  return (
    <div className="container flex flex-1 flex-col items-center justify-center text-center">
      <Card className="mx-auto max-w-md p-6">
        <XCircle
          className="text-muted-foreground mx-auto mb-4 size-10"
          aria-hidden="true"
        />
        <h1 className="mb-4 text-3xl font-semibold">Checkout cancelled</h1>
        <p className="text-muted-foreground mb-6">
          Nothing was charged, and your account is untouched.
        </p>
        <Button asChild size="lg">
          <Link href="/replays">Back to your replays</Link>
        </Button>
      </Card>
    </div>
  );
}
