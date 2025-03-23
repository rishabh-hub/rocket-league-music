// src/app / api / webhooks / stripe / route.ts;
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    // Option 1: Type it as unknown first, then check its type
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to create checkout session';

    console.error(`Webhook signature verification failed: ${error}`);

    return NextResponse.json(
      { error: `Invalid signature` + errorMessage },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutSessionCompleted(session);
  } else if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionUpdated(subscription);
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionDeleted(subscription);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const supabase = await createClient();
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('No userId found in session metadata');
    return;
  }

  // Retrieve the subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Store subscription details in Supabase
  const { error } = await supabase.from('subscriptions').upsert({
    id: subscription.id,
    user_id: userId,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    created_at: new Date(subscription.created * 1000).toISOString(),
    ended_at: subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : null,
  });

  if (error) {
    console.error('Error inserting subscription:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await createClient();

  // Update subscription details in Supabase
  const { error } = await supabase.from('subscriptions').upsert({
    id: subscription.id,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    created_at: new Date(subscription.created * 1000).toISOString(),
    ended_at: subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : null,
  });

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createClient();

  // Update subscription status in Supabase
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      ended_at: new Date(Date.now()).toISOString(),
    })
    .eq('id', subscription.id);

  if (error) {
    console.error('Error updating deleted subscription:', error);
  }
}
