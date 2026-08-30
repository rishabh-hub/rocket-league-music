// ABOUTME: Maps the CSS custom properties in src/styles/globals.css to Tailwind utilities.
// ABOUTME: Also defines the type scale, radius scale and motion tokens the design system uses.
import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
      },
      screens: {
        '2xl': '1320px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
        mono: [
          'var(--font-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.35', letterSpacing: '0.01em' }],
        sm: ['0.875rem', { lineHeight: '1.45', letterSpacing: '0' }],
        base: ['1rem', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        lg: ['1.125rem', { lineHeight: '1.45', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.014em' }],
        '2xl': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.018em' }],
        '3xl': ['1.875rem', { lineHeight: '1.16', letterSpacing: '-0.024em' }],
        '4xl': ['2.25rem', { lineHeight: '1.08', letterSpacing: '-0.028em' }],
        '5xl': ['3rem', { lineHeight: '1.02', letterSpacing: '-0.034em' }],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        signal: {
          DEFAULT: 'hsl(var(--signal))',
          foreground: 'hsl(var(--signal-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionDuration: {
        instant: '120ms',
        fast: '180ms',
        base: '240ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.65, 0, 0.35, 1)',
        entrance: 'cubic-bezier(0.32, 0.72, 0, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        overshoot: 'cubic-bezier(0.34, 1.32, 0.64, 1)',
      },
      keyframes: {
        meter: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        meter: 'meter 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
