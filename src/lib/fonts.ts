// ABOUTME: Loads the display, body and mono typefaces via next/font/google.
// ABOUTME: Exports their CSS variable class names as `fonts` for the root layout.
import { Archivo, Chivo_Mono, Inter } from 'next/font/google';

const fontDisplay = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-display',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

const fontMono = Chivo_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
});

export const fonts = [
  fontDisplay.variable,
  fontSans.variable,
  fontMono.variable,
];
