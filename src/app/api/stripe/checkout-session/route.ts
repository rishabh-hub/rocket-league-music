import { NextResponse } from 'next/server';

import { env } from '@/env.mjs';
import { stripeServer } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Get the user from Supabase
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const checkoutSession = await stripeServer.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: env.STRIPE_SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/payment/cancel`,

      metadata: {
        userId: userData.user.id,
      },
    });

    return NextResponse.json({ session: checkoutSession }, { status: 200 });
  } catch (error) {
    // Option 1: Type it as unknown first, then check its type
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to create checkout session';

    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
