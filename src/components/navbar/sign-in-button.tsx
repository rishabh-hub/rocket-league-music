'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import * as m from '@/paraglide/messages';

export const SignInButton = () => {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/login');
  };

  return <Button onClick={handleSignIn}>{m.sign_in()}</Button>;
};
