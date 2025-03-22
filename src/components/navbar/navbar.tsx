import { LanguageSwitcher } from './language-switcher';

// import { auth } from '@/app/api/auth/[...nextauth]/auth-options';
import { SignInButton } from '@/components/navbar/sign-in-button';
import { UserDropdown } from '@/components/navbar/user-dropdown';
import { Link } from '@/lib/i18n';
import * as m from '@/paraglide/messages';
import { createClient } from '@/utils/supabase/server';

export const Navbar = async () => {
  const supabase = await createClient();

  const session = await supabase.auth.getUser();

  if (!session.data.user)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">Not Authenticated</h1>
        <Link className="btn" href="/login">
          Sign in
        </Link>
      </div>
    );

  const {
    data: {
      user: { user_metadata },
    },
  } = session;

  const { email } = user_metadata;

  // const userName = user_name ? `@${user_name}` : 'User Name Not Set';

  return (
    <header className="w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-mono text-lg font-bold">
          {m.app_name()}
        </Link>
        <div className="flex items-center gap-2">
          {session ? <UserDropdown session={email} /> : <SignInButton />}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};
