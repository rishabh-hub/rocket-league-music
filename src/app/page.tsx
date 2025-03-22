import Link from 'next/link';

import { HeroForm } from '@/components/form';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import * as m from '@/paraglide/messages';
import { createClient } from '@/utils/supabase/server';

const Home = async () => {
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
      user: {
        /* eslint-disable @typescript-eslint/no-unused-vars */ user_metadata,
      },
    },
  } = session;

  //TODO: Add user avatar gotten from google's oauth.
  // const { user_name } = user_metadata;

  // const userName = user_name ? `@${user_name}` : 'User Name Not Set';

  console.log(session);
  console.log(` USER SESSION IS ${JSON.stringify(session)}`);

  return (
    <section className="container mt-10 flex flex-col items-center gap-3 text-center md:absolute md:left-1/2 md:top-1/2 md:mt-0 md:-translate-x-1/2 md:-translate-y-1/2">
      <h1 className="mb-1 font-mono text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        {m.nextjs_starter_template_headline()}
      </h1>
      <p className="text-muted-foreground max-w-2xl">
        {m.nextjs_starter_template_description()}
      </p>
      <div className="mt-1">
        <HeroForm />
      </div>
      <div className="mt-2 flex gap-4">
        <Button asChild>
          <a
            href="https://github.com/Skolaczk/next-starter/blob/main/README.md#getting-started"
            target="_blank"
          >
            {m.get_started()}
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://github.com/Skolaczk/next-starter" target="_blank">
            <Icons.github className="mr-2 size-4" /> {m.github()}
          </a>
        </Button>
      </div>
    </section>
  );
};

export default Home;
