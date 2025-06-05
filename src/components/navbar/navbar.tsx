import { LanguageSwitcher } from './language-switcher';

// import { auth } from '@/app/api/auth/[...nextauth]/auth-options';
import { SignInButton } from '@/components/navbar/sign-in-button';
import { UserDropdown } from '@/components/navbar/user-dropdown';
import { Link } from '@/lib/i18n';
import * as m from '@/paraglide/messages';
import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';

export const Navbar = async () => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Fetch subscription status from Supabase if user is authenticated
  let isProUser = false;
  let userImage = undefined;
  let userName = undefined;

  if (user) {
    // Get user metadata (including possible profile image from Google auth)
    userImage = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    userName = user.user_metadata?.name || user.user_metadata?.full_name;

    // Fetch subscription data from your subscriptions table
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('status, price_id')
      .eq('user_id', user.id)
      .single();

    // Check if user has an active subscription
    isProUser =
      subscriptionData?.status === 'active' ||
      subscriptionData?.status === 'trialing';
  }

  // const userName = user_name ? `@${user_name}` : 'User Name Not Set';

  return (
    <header className="w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-mono text-lg font-bold">
          {/* <Image
            src="/images/logo.png"
            alt="ReplayRhythms - Rocket League Replay Analysis with Musical Matching"
            width={150}
            height={40}
          /> */}
          Replay Rythms
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <UserDropdown
              session={user.email || user.user_metadata?.email || 'User'}
              isProUser={isProUser}
              userImage={userImage}
              userName={userName}
            />
          ) : (
            <SignInButton />
          )}

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};
