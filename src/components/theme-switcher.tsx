'use client';

import { ComponentProps, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

type ThemeSwitcherProps = {
  className?: ComponentProps<'button'>['className'];
};

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is undefined on the server and on the first client render,
  // so the label stays theme-neutral until mount to keep both passes identical.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = !mounted
    ? 'Switch theme'
    : resolvedTheme === 'dark'
      ? 'Switch to light theme'
      : 'Switch to dark theme';

  return (
    <Button
      className={className}
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Icons.sun className="size-[1.15rem] dark:hidden" />
      <Icons.moon className="hidden size-[1.15rem] dark:block" />
    </Button>
  );
};
