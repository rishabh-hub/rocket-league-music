// ABOUTME: Merges Tailwind class strings, resolving conflicts via tailwind-merge.
// ABOUTME: Used as cn() by every component in src/components.
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
