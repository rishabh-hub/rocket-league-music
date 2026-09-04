// ABOUTME: Recomputes WCAG 2.x sRGB contrast for the palette combinations the UI actually paints.
// ABOUTME: Also pins chartColors' literal HSL copies to the tokens in globals.css so they cannot drift.
import fs from 'fs';
import path from 'path';

import { badgeVariants } from '@/components/ui/badge';
import { getTeamColors } from '@/utils/chartColors';

type Rgb = [number, number, number];

const css = fs.readFileSync(
  path.join(process.cwd(), 'src/styles/globals.css'),
  'utf8'
);

/** Reads an `--x: h s% l%` token out of the :root or .dark block of globals.css. */
function token(theme: 'light' | 'dark', name: string): string {
  const selector = theme === 'light' ? ':root' : '\\.dark';
  const block = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n  \\}`).exec(css);
  if (!block) throw new Error(`no ${theme} block in globals.css`);
  const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(block[1]);
  if (!value) throw new Error(`no --${name} in the ${theme} block`);
  return value[1].trim();
}

function hsl(value: string): Rgb {
  const [h, s, l] = value
    .split(/\s+/)
    .map((part) => parseFloat(part.replace('%', '')));
  const sat = s / 100;
  const light = l / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = h / 60;
  const x = chroma * (1 - Math.abs((hp % 2) - 1));
  const rgb: Rgb =
    hp < 1
      ? [chroma, x, 0]
      : hp < 2
        ? [x, chroma, 0]
        : hp < 3
          ? [0, chroma, x]
          : hp < 4
            ? [0, x, chroma]
            : hp < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const m = light - chroma / 2;
  return rgb.map((c) => (c + m) * 255) as Rgb;
}

/** Composites a translucent fill (a Tailwind `/alpha` tint) over an opaque surface. */
function over(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA_SMALL_TEXT = 4.5;
const NON_TEXT = 3;

describe('palette contrast', () => {
  it.each([
    // [theme, label, ink, surface, tint alpha]
    ['light', 'opponent name on a card', 'signal', 'card', 0],
    ['light', 'opponent chip', 'signal', 'card', 0.15],
    ['light', 'own-team chip', 'primary', 'card', 0.15],
    ['light', 'status chip', 'primary', 'card', 0.1],
    ['light', 'alert body', 'primary', 'background', 0.1],
    ['light', 'failed chip', 'destructive', 'card', 0.1],
    ['light', 'destructive alert body', 'destructive', 'background', 0.1],
    ['dark', 'opponent name on a card', 'signal', 'card', 0],
    ['dark', 'opponent chip', 'signal', 'card', 0.15],
    ['dark', 'own-team chip', 'primary', 'card', 0.15],
    ['dark', 'status chip', 'primary', 'card', 0.1],
    ['dark', 'alert body', 'primary', 'background', 0.1],
    ['dark', 'failed chip', 'destructive', 'card', 0.1],
    ['dark', 'destructive alert body', 'destructive', 'background', 0.1],
  ] as const)(
    '%s: %s clears AA for small text',
    (theme, _label, ink, surface, alpha) => {
      const text = hsl(token(theme, ink));
      const base = hsl(token(theme, surface));
      const fill = alpha ? over(text, base, alpha) : base;
      expect(contrast(text, fill)).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
    }
  );

  it.each([
    ['light', 'primary'],
    ['light', 'signal'],
    ['light', 'destructive'],
    ['dark', 'primary'],
    ['dark', 'signal'],
    ['dark', 'destructive'],
  ] as const)('%s: %s-foreground clears AA on a solid fill', (theme, role) => {
    expect(
      contrast(hsl(token(theme, `${role}-foreground`)), hsl(token(theme, role)))
    ).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
  });

  it.each([
    ['light', 'background'],
    ['light', 'card'],
    ['dark', 'background'],
    ['dark', 'card'],
  ] as const)('%s: the focus ring clears 3:1 against %s', (theme, surface) => {
    expect(
      contrast(hsl(token(theme, 'ring')), hsl(token(theme, surface)))
    ).toBeGreaterThanOrEqual(NON_TEXT);
  });
});

describe('chart colours mirror the tokens', () => {
  it.each([
    ['blue', 'primary'],
    ['orange', 'signal'],
  ] as const)('%s matches --%s in both themes', (team, role) => {
    for (const isDark of [false, true]) {
      const [h, s, l] = token(isDark ? 'dark' : 'light', role).split(/\s+/);
      expect(getTeamColors(team, isDark).border).toBe(
        `hsla(${h}, ${s}, ${l}, 1)`
      );
    }
  });
});

describe('badge variants', () => {
  it.each(['default', 'secondary'] as const)(
    'the static %s chip declares no hover fill',
    (variant) => {
      expect(badgeVariants({ variant })).not.toMatch(/hover:bg-/);
    }
  );
});
