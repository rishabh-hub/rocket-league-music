'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { User } from 'lucide-react';

import { signOut } from '@/app/login/action';
// import Image from 'next/image';
// import { Session } from 'next-auth';
// import { signOut } from 'next-auth/react';
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
import { env } from '@/env.mjs';
import * as m from '@/paraglide/messages';

export const UserDropdown = ({
  session,
}: {
  session: string | { email: string };
}) => {
  const [isPending, setIsPending] = useState(false);

  const handleCreateCheckoutSession = async () => {
    setIsPending(true);

    const res = await fetch('/api/stripe/checkout-session');
    const checkoutSession = await res.json().then(({ session }) => session);
    const stripe = await loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    await stripe!.redirectToCheckout({
      sessionId: checkoutSession.id,
    });
  };

  console.log(`USER IS ${session}`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {/* <Image
          // src={User.}
          className="overflow-hidden rounded-full"
          // src={User}
          alt={`${user?.email}`}
          width={32}
          height={32}
        > */}
        <User width={32} height={32} />
        {/* <h1>{user}</h1> */}
        {/* </Image> */}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{m.my_account()}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col items-center justify-center p-2">
          {/* <Image
            className="overflow-hidden rounded-full"
            // src={`${user?.image}`}
            alt={`${user?.email}`}
            width={100}
            height={100}
          /> */}
          <User height={32} width={32} />
          <h2 className="py-2 text-lg font-bold">{session.toString()}</h2>
          <Button
            onClick={handleCreateCheckoutSession}
            disabled={true || isPending}
            className="w-64"
          >
            {session?.email ? (
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
        {/* <DropdownMenuItem onClick={() => signOut()}> */}
        <DropdownMenuItem onClick={() => signOut()}>
          <Icons.logOut className="mr-2 size-4" /> <span>{m.log_out()}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
