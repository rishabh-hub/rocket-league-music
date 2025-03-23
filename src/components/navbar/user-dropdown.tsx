'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { signOut } from '@/app/login/action';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as m from '@/paraglide/messages';

interface UserDropdownProps {
  session: string;
  isProUser?: boolean;
  userImage?: string;
  userName?: string;
}

export const UserDropdown = ({
  session,
  isProUser = false,
  userImage,
  userName,
}: UserDropdownProps) => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleCreateCheckoutSession = async () => {
    setIsPending(true);

    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await res.json();

      // Load Stripe
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );

      if (stripe) {
        // Redirect to checkout
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsPending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  // Determine if we should show avatar or initials
  const hasUserImage = !!userImage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {hasUserImage ? (
          <Image
            className="overflow-hidden rounded-full"
            src={userImage!}
            alt={userName || session}
            width={32}
            height={32}
          />
        ) : (
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full">
            {session.charAt(0).toUpperCase()}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{m.my_account()}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col items-center justify-center p-2">
          {hasUserImage ? (
            <Image
              className="overflow-hidden rounded-full"
              src={userImage!}
              alt={userName || session}
              width={100}
              height={100}
            />
          ) : (
            <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full text-3xl">
              {session.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="py-2 text-lg font-bold">{userName || session}</h2>
          <Button
            onClick={handleCreateCheckoutSession}
            disabled={isProUser || isPending}
            className="w-64"
          >
            {isProUser ? (
              m.you_are_a_pro()
            ) : (
              <>
                {isPending && (
                  <Icons.loader className="mr-2 size-4 animate-spin" />
                )}
                {m.upgrade_to_pro_cta()}
              </>
            )}
          </Button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <Icons.logOut className="mr-2 size-4" /> <span>{m.log_out()}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
