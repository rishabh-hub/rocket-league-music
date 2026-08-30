// import { auth } from '@/app/api/auth/[...nextauth]/auth-options';
import { SignInButton } from '@/components/navbar/sign-in-button';
import { UserDropdown } from '@/components/navbar/user-dropdown';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Link } from '@/lib/i18n';
import { createClient } from '@/utils/supabase/server';

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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          ReplayRhythms
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <Link
            href="/upload-replay"
            className="text-muted-foreground transition-colors duration-instant hover:text-foreground"
          >
            Upload replay
          </Link>
          <Link
            href="/replays"
            className="text-muted-foreground transition-colors duration-instant hover:text-foreground"
          >
            My replays
          </Link>
          <Link
            href="/showcase"
            className="text-muted-foreground transition-colors duration-instant hover:text-foreground"
          >
            Showcase
          </Link>
        </nav>
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

          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};
