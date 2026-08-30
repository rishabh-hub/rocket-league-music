'use client';

import { useState } from 'react';
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

      // Dynamic import — only fetches Stripe SDK when user clicks
      const { loadStripe } = await import('@stripe/stripe-js');
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
      <DropdownMenuTrigger
        className="rounded-full outline-none transition-opacity duration-instant hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Open account menu"
      >
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
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{m.my_account()}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-3 px-2 py-1.5">
          {hasUserImage ? (
            <Image
              className="overflow-hidden rounded-full"
              src={userImage!}
              alt={userName || session}
              width={36}
              height={36}
            />
          ) : (
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full">
              {session.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {userName || session}
            </span>
            {userName && (
              <span className="text-muted-foreground truncate text-xs">
                {session}
              </span>
            )}
          </div>
        </div>
        <div className="px-2 pb-2">
          <Button
            onClick={handleCreateCheckoutSession}
            disabled={isProUser || isPending}
            className="w-full"
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
