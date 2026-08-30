# ReplayRhythms — Frontend Craft Audit

## The verdict

This app does not look machine-made because of any single gradient — it looks machine-made because every layer of it is still the layer a generator emitted. `src/styles/globals.css` is the stock shadcn zinc block down to the generator's own fractional saturations (`240 3.7% 15.9%`, `240 5% 64.9%`, `0 62.8% 30.6%`), with `--card` set to the exact same value as `--background`, so nothing in the app has ever had a surface, and `--primary` set to near-white, so the product's blue accent exists in zero tokens and had to be hand-sprayed across thirty files as raw `blue-400` / `indigo-500` / `purple-600` / `green-500` classes. On top of that sit the recognisable signatures: a three-stop rainbow on the `<h1>`, three more of the same ramp stacked on one button with eight looping yellow sparkles orbiting it, Inter + JetBrains Mono with no display face, one `--radius` for every corner in the app, and four identical `opacity:0, y:20` fade-ups gating content that is already above the fold.

The copy is the same story in words. The product is described four different ways inside `src/app/layout.tsx` alone; the hero stacks three lines that state one idea; `personalized`, `unique`, `perfect`, `discover` and `enhance` recur across every route; and the flagship card opens with "Our AI analyzes your gameplay patterns" — a sentence about the pipeline, containing none of the real inputs the pipeline actually reads.

And underneath both, the seams that prove nobody used the running app: the brand is misspelled in the navbar on every page (`Replay Rythms`), three buttons route to `/upload`, which does not exist, the theme toggle reads `theme` instead of `resolvedTheme` so its first click is a no-op, a "Featured" trophy badge means `index < 3` on a `created_at DESC` query, a "Test with Sample Data" button ships on the main payoff screen, and Sentry's own onboarding demo page is live and crawlable on the production domain.

None of that requires a redesign. The layout, the information architecture, the curtain-reveal cards, the image-backed heroes and the dark canvas are all fine. What has to change is the set of specific values that were never chosen.

## Design direction

### Palette — "Boost": one cool accent, one warm signal, a neutral ramp whose hue wanders

**The decision.** A cool graphite neutral ramp whose hue moves from 228 at the canvas to 210 at the ink (stock zinc pins all twenty tokens to 240, and that flatness is the fingerprint); one accent, a periwinkle cobalt at 76% saturation rather than Tailwind `blue-500`'s 91%, because every shipped product accent measured in research sits far below Tailwind's default and the extra saturation is precisely what makes an accent read as "picked from a palette"; and exactly one warm family — Rocket League's own boost orange, lifted to be legible on near-black — reserved for opponent-team identity, negative deltas and destructive states.

**Where the research disagreed, and the call.** Two agents proposed a violet-leaning accent (Linear-style `#6c70da`); one proposed a two-ramp op.gg split with a separate blue-gray for data. I picked neither. Violet is the exact hue family flagged as "AI purple", so it cannot be the escape from looking AI-generated regardless of how well Linear uses it; the two-ramp split is genuinely good but it is a second neutral system to maintain and violates "smallest reasonable change". The blue-vs-orange dichotomy wins because it is not borrowed taste — it is the game's own team system, and ballchasing.com already uses it for the same purpose. A third agent wanted a Spotify-green token; rejected, because the Spotify embed already paints its own green inside the iframe and a second brand green in our chrome would compete with it for no gain. Success states use the accent.

**Rule of use.** `--primary` is permitted in exactly five places: the primary CTA (one per viewport), the focus ring, the active nav/tab indicator, the selected/matched state, and the user's own team in a match view. `--signal` is permitted on: the opponent team, a negative delta, and nothing else. Card fills, section backgrounds, headings, icon washes and hero overlays stay on `--foreground` / `--muted-foreground`. Any hue not in this file is a bug.

```css
/* src/styles/globals.css */
@layer base {
  :root {
    --background: 228 28% 98%;
    --foreground: 228 24% 11%;
    --surface: 228 20% 95%;
    --card: 0 0% 100%;
    --card-foreground: 228 24% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 228 24% 11%;
    --primary: 221 72% 46%;
    --primary-foreground: 0 0% 100%;
    --secondary: 228 18% 94%;
    --secondary-foreground: 228 22% 22%;
    --muted: 228 18% 94%;
    --muted-foreground: 224 12% 42%;
    --accent: 221 40% 93%;
    --accent-foreground: 221 60% 26%;
    --signal: 20 84% 44%;
    --signal-foreground: 0 0% 100%;
    --destructive: 4 70% 46%;
    --destructive-foreground: 0 0% 100%;
    --border: 226 16% 88%;
    --input: 226 16% 82%;
    --ring: 221 72% 46%;
    --overlay: 228 34% 14%;

    --radius: 0.375rem;
    --radius-xs: 0.25rem;
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1.25rem;

    color-scheme: light;
  }

  .dark {
    --background: 228 14% 5%;
    --foreground: 210 16% 95%;
    --surface: 226 13% 8%;
    --card: 225 12% 9%;
    --card-foreground: 210 16% 95%;
    --popover: 224 12% 12%;
    --popover-foreground: 210 16% 95%;
    --primary: 221 76% 62%;
    --primary-foreground: 228 24% 7%;
    --secondary: 222 11% 14%;
    --secondary-foreground: 214 14% 90%;
    --muted: 222 11% 14%;
    --muted-foreground: 218 12% 63%;
    --accent: 221 26% 18%;
    --accent-foreground: 214 20% 92%;
    --signal: 22 92% 60%;
    --signal-foreground: 24 44% 8%;
    --destructive: 6 72% 56%;
    --destructive-foreground: 24 44% 8%;
    --border: 220 10% 18%;
    --input: 220 10% 22%;
    --ring: 221 76% 62%;
    --overlay: 228 44% 3%;

    color-scheme: dark;
  }
}
```

Notes that matter when applying this:

- **No saturation carries a decimal.** Decimals are the theme generator's handwriting.
- **`--surface` is new** and must be registered in `tailwind.config.ts` (`surface: 'hsl(var(--surface))'`), as must `signal` (`signal: { DEFAULT: 'hsl(var(--signal))', foreground: 'hsl(var(--signal-foreground))' }`). This gives dark mode a real four-step ladder: background 5% → surface 8% → card 9% → popover 12%.
- **`color-scheme` is declared** so native scrollbars, `<select>` popups and autofill stop rendering in light chrome over a near-black page.
- **Radius is a scale, not a number.** Replace the `calc()` chain in `tailwind.config.ts` with explicit values: `xs: 'var(--radius-xs)'`, `sm: 'var(--radius-sm)'`, `md: 'var(--radius-md)'`, `lg: 'var(--radius-lg)'`, `xl: 'var(--radius-xl)'`. Apply by element size: chips `rounded-xs`, inputs/menu items `rounded-sm`, buttons `rounded-md`, cards/popovers `rounded-lg`, the two image-backed hero cards `rounded-xl`. Two clearly different radii read as a decision; one radius reads as a default.
- **Depth is the surface step plus a hairline, never a shadow.** A black shadow on `#0b0c0f` is invisible. `shadow-lg` survives only on genuinely floating Radix layers (dialog, popover, dropdown, toast).

### Type — Archivo (display) / Inter (body) / Chivo Mono (numerals)

**The decision.** Add `Archivo` as a display face on `--font-display`, keep `Inter` for body, and replace `JetBrains_Mono` with `Chivo_Mono`. All three are in `next/font/google` (verified against the installed font data), so this adds no dependency.

**Why.** Archivo has a real `wdth` axis (62–125), which is what lets headings sit slightly narrow and read like broadcast/scoreboard type — the register a Rocket League telemetry product should have, and something none of the "tasteful default" escape hatches (Space Grotesk, Geist, Plus Jakarta, Instrument Serif) offer. Chivo Mono comes from the same foundry as Archivo, so the digits are family rather than a stranger, and it sheds JetBrains Mono's code-editor association in a music app. Inter stays as body because the tell was never Inter itself, it was Inter *alone and untouched* — with a display face carrying the personality and stylistic sets switched on, Inter as body is a legitimate choice and the smallest change that lands. (One research agent wanted Inter replaced outright with Instrument Sans; overruled on smallest-reasonable-change grounds.)

```ts
// src/lib/fonts.ts
import { Archivo, Inter, Chivo_Mono } from 'next/font/google';

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

export const fonts = [fontDisplay.variable, fontSans.variable, fontMono.variable];
```

**Scale and tracking.** Redefine the existing `fontSize` keys in `tailwind.config.ts` `theme.extend` so all current call sites are corrected without touching a single page file. The rule the ramp encodes: tracking goes more negative as size goes up, and positive only below 14px.

```ts
fontSize: {
  xs:    ['0.75rem',  { lineHeight: '1.35', letterSpacing: '0.01em' }],
  sm:    ['0.875rem', { lineHeight: '1.45', letterSpacing: '0' }],
  base:  ['1rem',     { lineHeight: '1.55', letterSpacing: '-0.005em' }],
  lg:    ['1.125rem', { lineHeight: '1.45', letterSpacing: '-0.01em' }],
  xl:    ['1.25rem',  { lineHeight: '1.35', letterSpacing: '-0.014em' }],
  '2xl': ['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.018em' }],
  '3xl': ['1.875rem', { lineHeight: '1.16', letterSpacing: '-0.024em' }],
  '4xl': ['2.25rem',  { lineHeight: '1.08', letterSpacing: '-0.028em' }],
  '5xl': ['3rem',     { lineHeight: '1.02', letterSpacing: '-0.034em' }],
},
```

Also in `@layer base` of `globals.css`:

```css
h1, h2 {
  font-family: var(--font-display), system-ui, sans-serif;
  font-variation-settings: 'wdth' 92;
}
body {
  font-feature-settings: 'cv11', 'ss01', 'calt', 'kern';
}
td, th, .tabular {
  font-variant-numeric: tabular-nums;
}
::selection {
  background-color: hsl(var(--primary) / 0.28);
  color: hsl(var(--foreground));
}
```

Hard rules: display weight is capped at `font-semibold` (600) — `font-bold` at 36px is the browser's opinion, not a designer's; `tabular-nums` is mandatory on every number in a stats product (the string appears zero times in the codebase today); mono is for identifiers and 12px uppercase eyebrows only, never a headline, never body, never a stat value.

### Motion — one signature moment, everything else is state feedback

**Tokens** (add to `tailwind.config.ts` `theme.extend`):

```ts
transitionDuration: { instant: '120ms', fast: '180ms', base: '240ms', slow: '400ms' },
transitionTimingFunction: {
  standard:  'cubic-bezier(0.65, 0, 0.35, 1)',
  entrance:  'cubic-bezier(0.32, 0.72, 0, 1)',
  exit:      'cubic-bezier(0.4, 0, 1, 1)',
  overshoot: 'cubic-bezier(0.34, 1.32, 0.64, 1)',
},
```

**The language, in five rules.**

1. Hover, focus and press are `duration-instant ease-standard`, colour and border only. In-place state changes (switch thumb, tab indicator, progress fill) are `duration-fast ease-standard`.
2. Entrances (menus, tooltips, dialogs, toasts, results arriving) are `duration-base ease-entrance`. **Exits are always one step faster than their entrance** and use `ease-exit`. That asymmetry is the single most human decision in a motion system, and the codebase already stumbled into it once in `card-curtain-reveal.tsx` (0.4s in, 0.3s out) — standardise on that instinct.
3. **Only `opacity`, `transform`, `color`, `border-color`, `background-color` and `box-shadow` may animate.** `transition-all` is banned outright: it animates properties nobody chose, which is exactly why it gets written.
4. **The curtain reveal is the page's one motion signature.** Everything competing with it goes: the four `opacity:0, y:20` wrappers on above-the-fold hero content, the `hover:scale-[1.01]` on the cards, the eight looping sparkles. No delay above 200ms on content that is already visible; staggers are 40ms and capped at six items (`delay: Math.min(index, 5) * 0.04`).
5. **No infinite loops anywhere**, and `prefers-reduced-motion` is honoured in both systems — a CSS block in `globals.css` for transitions/animations, plus `<MotionConfig reducedMotion="user">` in `src/app/layout.tsx`, because motion/react animates inline styles through rAF and a CSS media query does not reach it.

### Copy voice — four rules a writer can follow

1. **Name the real thing.** Every sentence must contain at least one noun only this product could use: `.replay`, 10MB, ballchasing.com, boost usage, time behind ball, supersonic time, two minutes, Spotify. Banned words, no exceptions: *personalized, tailored, unique, perfect, discover, explore, enhance, seamless, effortless, vibe, journey*, and the phrase *"Our AI"* — ballchasing.com is the name that builds trust here, and it is real.
2. **Say it once.** One headline and one subhead, never a third line. Delete any `CardDescription` that restates the `CardTitle` above it. Delete any toast description that repeats its title in longer words.
3. **Sentence case, no exclamation marks.** Capitals are for proper nouns only — Rocket League, Spotify, ballchasing.com, Pro. Buttons are verbs (`Upload a replay`, not `Upload New Replay`). Vary sentence length on purpose; a fragment is allowed, and the short one should be short.
4. **Errors name what happened, whose fault it is, and the next click.** No apologies, no hedging ("This could be due to…"), and never expose internals — no HTTP status codes, no route names ("processing page"), no service names ("the recommendation service") in user-facing strings. And never promise something the code does not do: there is no playlist creation in `src/app/api/spotify/`, so nothing may claim it.

One more, applying to all four: do not over-correct. The repo currently has zero em dashes in user-facing copy. Keep it that way — stripping or adding punctuation to dodge a detector is its own kind of inauthenticity. Where you want a pause, use a period.

## Findings by surface

Severity: **P0** = a visitor notices this is machine-made or broken within seconds. **P1** = it reads as unauthored on inspection. **P2** = craft debt that compounds.

### Foundation (tokens, type, motion, radius)

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | All 34 tokens are stock shadcn zinc, decimals included | `src/styles/globals.css:6-49` — `--background: 240 10% 3.9%`, `--border: 240 3.7% 15.9%`, `--muted-foreground: 240 5% 64.9%` | Replace both blocks with the palette above. Integer saturations only, hue wanders 228→210. |
| P0 | Dark mode has no surfaces: `--card` equals `--background` | `globals.css:30-32` — both `240 10% 3.9%` | `--background: 228 14% 5%`, `--surface: 226 13% 8%`, `--card: 225 12% 9%`, `--popover: 224 12% 12%`; register `surface` in `tailwind.config.ts`. |
| P0 | `--primary` is near-white in dark mode, so the app's accent exists in no token | `globals.css:36` — `--primary: 0 0% 98%` | `--primary: 221 76% 62%` / `--primary-foreground: 228 24% 7%`. This is why ~30 raw `blue-*`/`indigo-*`/`purple-*` classes exist across the app. |
| P0 | Inter + JetBrains Mono, no display face | `src/lib/fonts.ts:1` | Archivo / Inter / Chivo Mono per the block above; register `display` in `fontFamily` and move the whole `fontFamily` object into `theme.extend` (it currently sits on `theme`, silently deleting Tailwind's default stacks and `font-serif`). |
| P0 | Zero `tabular-nums` in a stats product | grep across `src/` returns nothing | `td, th, .tabular { font-variant-numeric: tabular-nums; }` in `@layer base`, plus `tabular-nums` on every stat value. |
| P0 | No `prefers-reduced-motion` anywhere | grep for `useReducedMotion|prefers-reduced-motion` across `src/` returns nothing | CSS media block in `globals.css` **and** `<MotionConfig reducedMotion="user">` in `layout.tsx`. |
| P1 | One `--radius: 0.5rem` drives every corner | `globals.css:26`; `tailwind.config.ts:60-64` derives lg/md/sm by `calc()` | Five-step scale (see above), applied by element size. |
| P1 | No type scale: 36px headings at zero tracking | `tailwind.config.ts` `extend` has no `fontSize`; `page.tsx:59` is `text-4xl font-bold` | Redefine the `fontSize` keys with the tracking ramp; cap display weight at 600. |
| P1 | No motion vocabulary: 8 durations, 5 easings, all picked in isolation | `tailwind.config.ts:75-78` only defines the two shadcn accordion keyframes | Add the duration/easing tokens; delete the accordion keyframes (no accordion component exists in `src/components/ui/`). |
| P1 | Focus ring is near-white grey with a 2px offset ring | `globals.css:48` — `--ring: 240 4.9% 83.9%` | `--ring` = `--primary`; primitives move to `focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:border-ring` and drop `ring-offset-*`. |
| P1 | `color-scheme` never declared, so native chrome renders light over a near-black page | `globals.css:6` and `:30` | `color-scheme: light` / `color-scheme: dark` in the respective blocks. |
| P2 | Container padding is a flat 32px at every breakpoint | `tailwind.config.ts:17-23` | `padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem', xl: '2.5rem' }`, `2xl: '1320px'`. |
| P2 | Foundation files missing the repo-mandated ABOUTME headers | `src/lib/utils.ts:1`, `src/lib/fonts.ts:1`, `globals.css:1`, `tailwind.config.ts:1` | Add the two-line header to each, matching `src/lib/chartjs.ts`. |

### Design-system primitives (`src/components/ui/`)

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | Tabs are the grey-trough-with-white-pill — the most recognisable shadcn component on the web — on the app's most-used screen | `tabs.tsx:17` `rounded-md bg-muted p-1` | Underline tabs: list `inline-flex h-9 items-center justify-start gap-5 rounded-none border-b border-border bg-transparent p-0 text-muted-foreground`; trigger `... border-b-2 border-transparent pb-2.5 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none`; content `mt-5`. |
| P0 | `CurtainRevealButton.tsx` is byte-for-byte `button.tsx` with the identifier renamed, and re-exports `buttonVariants` under the same name | `src/components/ui/CurtainRevealButton.tsx:1-56` | Delete the file; `src/app/page.tsx` uses `Button` instead. (Handled in the landing package, which owns both files.) |
| P1 | `CardTitle` at `text-2xl` makes every panel label shout louder than the data | `card.tsx:39` | `'text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground'`; Card shell → `bg-card border border-border/70` and drop `shadow-sm`. |
| P1 | Badge is a `rounded-full font-semibold` pill with only default/destructive variants, so 30+ raw `bg-green-100 text-green-800` chips grew around it | `badge.tsx:7` | Squared telemetry tag: `rounded-sm px-1.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.07em]`; add `success` (accent-tinted) and `signal` variants. |
| P1 | Button has no press feedback and `transition-colors` only | `button.tsx:8-28` | Base: `transition-[background-color,border-color,color,box-shadow,transform] duration-instant ease-standard active:translate-y-px`; sizes tighten one step (`h-9`/`h-8`/`h-11`/`h-9 w-9`). |
| P1 | Inputs have the same background as the page, so a field is only a rectangle of border | `input.tsx:13`, `textarea.tsx:12`, `select.tsx:22` | `h-9 rounded-sm border-input bg-surface` + the new focus halo, on all three, so the controls share one height. |
| P1 | Table cells are `p-4` with no tabular figures and a 48px header row | `table.tsx:76,90` | `TableCell`: `px-3 py-2.5 align-middle tabular-nums`. `TableHead`: `h-9 px-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground`. |
| P1 | Alert ships only default/destructive, so "succeeded" and "still working" got hand-rolled with raw palette classes on the pages | `alert.tsx:10-15` | Base `rounded-md border p-3.5 text-sm`; four variants: default / destructive / success (`border-primary/35 bg-primary/10 text-primary`) / signal. |
| P1 | The curtain's signature easing never runs: a two-element easing array on a single-keyframe animation is discarded | `card-curtain-reveal.tsx:13,21` — `ease: ['easeOut', [0.25, 1.5, 0.5, 1]]` | Line 13: `duration: 0.4, ease: [0.32, 0.72, 0, 1]`. Line 21: `duration: 0.24, ease: [0.4, 0, 1, 1]`. |
| P1 | Curtain reveal binds mouse events only, so its content is unreachable by keyboard | `card-curtain-reveal.tsx:58-59` | Add `onFocus={handleMouseEnter} onBlur={handleMouseLeave}` alongside the mouse handlers. |
| P2 | Dialog scrim is raw `bg-black/80` — a hardcoded colour that switches the lights off on a near-black canvas | `dialog.tsx:24` | `bg-[hsl(var(--overlay)/0.7)] backdrop-blur-[3px]`; content `rounded-lg p-5`, entrance/exit durations split. |
| P2 | Toast is `p-6 pr-8 shadow-lg` — a one-line message in a 96px slab | `toast.tsx:26,30,107` | `rounded-lg border-border/80 bg-popover p-3.5 pr-10 gap-3`; description uses `text-muted-foreground` instead of `opacity-90`. |
| P2 | Tooltip is set at body size and slides 8px | `tooltip.tsx:17,22` | `sideOffset = 6`; `rounded-sm px-2 py-1 text-xs font-medium`; slide distances `-1` not `-2`. |
| P2 | Switch is 44×24 with a `shadow-lg` thumb on Tailwind's default timing | `switch.tsx:14,22` | `h-5 w-9`, thumb `size-4`, `transition-transform duration-fast ease-overshoot`, `translate-x-4`. |
| P2 | Progress is a 16px trough with `transition-all` | `progress.tsx:15,21` | `h-1.5`; indicator `bg-primary transition-transform duration-slow ease-entrance`. |
| P2 | `labelVariants` is a `cva()` wrapping one string with no variants | `label.tsx:9-11` | Inline the classes, drop the `cva`/`VariantProps` import, and match the label voice: `text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground`. |
| P2 | 177 lines of `form.tsx` that nothing imports | `src/components/ui/form.tsx` — grep for the import path returns zero hits | Delete the file. Leave `package.json` alone (concurrent installs are unsafe); dependency pruning is a separate follow-up. |
| P2 | `HtmlHTMLAttributes` (the `<html>` element's type) applied to a div; `curtainVriants` misspelled | `card-curtain-reveal.tsx:89`, `:8` | `React.HTMLAttributes<HTMLDivElement>`; rename to `curtainVariants` at the declaration and its three usages. |
| P2 | `CardCurtainRevealFooter.displayName` is set to the parent's name | `card-curtain-reveal.tsx:85` | `'CardCurtainRevealFooter'`. |

### Landing page (`src/app/page.tsx`, `ShowcaseButton.tsx`)

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | The rainbow `<h1>` — the single most recognisable AI-design signature on the web | `page.tsx:59` `bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400` | `className="font-display text-5xl font-semibold tracking-[-0.034em] text-foreground mb-3"`. No gradient, no `bg-clip-text`. |
| P0 | The same three-stop ramp stacked three deep on one button — fill, blurred glow copy, and an inner sheen | `ShowcaseButton.tsx:101, 114, 119` | Delete the glow div (100-110) and the sheen div (118-128). Line 114 → `className="relative z-20 w-full rounded-md bg-primary px-8 text-primary-foreground transition-colors duration-instant hover:bg-primary/90"`. |
| P0 | Eight yellow sparkles orbiting the button on an infinite loop — the literal glyph the industry uses to mean "a machine made this" | `ShowcaseButton.tsx:9-19, 26-56, 61-88` | Delete `SparkleIcon`, the `sparkles` state and its `useEffect`, and the render loop; drop `useEffect` from the line 3 import. `text-yellow-300` belongs to no palette in this app. |
| P0 | The accent inside the curtain cards paints rust orange, not blue: `mix-blend-difference` inverts it | `page.tsx:135, 222` — `text-blue-400` renders `#9f5a05` in both themes | Use `text-zinc-400` inside `CardCurtainRevealBody`; any true accent must live outside the blend context. |
| P0 | In light mode the card title lands at 1.83:1 on the white curtain panel | `page.tsx:124, 211` — `dark:text-zinc-50 text-zinc-700` over a theme-blind overlay | Unify the cards to one dark treatment: scrim `from-background via-background/90 to-background/50`; card `border border-border bg-transparent text-zinc-50`; title `text-zinc-50`. |
| P0 | All the copy explaining the product lives inside a hover-only reveal, so on a phone the page is two wordless 600px images | `page.tsx:127, 214` | With the keyboard fix in `card-curtain-reveal.tsx`, also render one static line under each grid cell: `<p className="mt-3 text-sm text-muted-foreground">Drop a .replay file, get a playlist.</p>` and `<p className="mt-3 text-sm text-muted-foreground">Every upload keeps its track list.</p>`. |
| P0 | Three stacked lines saying one thing, the third orphaned below the CTA | `page.tsx:59, 63-65, 70-77` | Delete the `motion.p` block at 70-77 entirely. One headline, one subhead. |
| P1 | Four identical `opacity:0, y:20` fade-ups gate above-the-fold content for 500–800ms | `page.tsx:53-77` | Delete the motion wrappers; render `h1` and the subhead as plain elements. The curtain reveal is the page's only motion. |
| P1 | Perfectly symmetric silhouette: centered hero + two identical `h-[600px]` cards | `page.tsx:52-56, 79` | Drop `items-center text-center` from the hero. Grid → `grid grid-cols-1 md:grid-cols-5 gap-8 mt-12`; upload cell `md:col-span-3` at `h-[600px]`, replays cell `md:col-span-2 md:mt-16` at `h-[520px]`. |
| P1 | `hover:scale-[1.01]` on a card containing a photo — 6px of growth that resamples the image and fights the curtain | `page.tsx:98, 185` | `transition-colors duration-instant border-border hover:border-primary/50`, plus `focus-visible:ring-2 focus-visible:ring-ring`. |
| P1 | A div faking a button wrapping a real button that fires the same action, with no focus ring on either | `page.tsx:99-101, 142-156` | Keep the wrapper as the control (add the focus ring); give the inner `Button` `tabIndex={-1} aria-hidden="true"`. Labels → `aria-label="Upload a replay"` / `aria-label="Your replays"`. |
| P1 | Both hero images marked `priority fetchPriority="high"`, so they compete for the LCP slot | `page.tsx:107-108, 201-202` | Second image: remove `priority`/`fetchPriority`, add `loading="lazy"`. |
| P2 | Six comments narrating what the JSX plainly says, plus one restating the file path | `page.tsx:1, 48, 103, 105, 117, 121, 159, 161` and mirrors at 190-248 | Delete them. Keep line 144/231 (`// Prevents the outer div's onClick from firing`) — that one documents non-obvious behaviour. |
| P2 | Comments in `ShowcaseButton.tsx` that grade the code against a version no reader has seen | `ShowcaseButton.tsx:9, 25, 39, 60, 90, 99, 117` | They disappear with the sparkle/gradient deletions. Any survivor states what the code is, not how it rates. |
| P2 | A ternary whose two branches are the same value, driving a five-keyframe label wobble | `ShowcaseButton.tsx:161` — `repeat: isHovered ? 0 : 0` | Replace the `motion.span` (152-165) with `<span className="text-lg font-medium">`. |
| P2 | `useState<any>` on the one piece of state the page branches on | `page.tsx:25` | `import type { User } from '@supabase/supabase-js'` (already a direct dependency) → `useState<User | null>(null)`. |
| P2 | Three width utilities fighting on one div: `container` supplies padding and max-width that `px-4` and `max-w-5xl` then override | `page.tsx:52` | `<div className="mx-auto w-full max-w-5xl px-4 py-12">`. |
| P2 | Hover classes that set the colour the element already has | `page.tsx:122, 209` — `dark:hover:text-zinc-50 hover:text-zinc-900` | Delete both. |
| P2 | A dark variant swapping white for zinc-50 — a difference no eye resolves | `page.tsx:157, 244` | `<CardCurtain className="bg-zinc-50" />`. |

### App chrome and metadata (navbar, theme switcher, layout, i18n)

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | The brand is misspelled in the navbar on every page | `navbar.tsx:53` — `Replay Rythms` | `ReplayRhythms` — one word, with the h, matching all 12 metadata occurrences. |
| P0 | The i18n catalogue is untouched next-starter boilerplate feeding `siteConfig` | `src/messages/en.json:3,12,13,14-23` — `"app_name": "next-starter"`, `"meta_title": "Next.js Starter"`, ten keywords about Prisma/NextAuth/shadcn | Rewrite `app_name`/`meta_title`/`meta_description`; delete the ten `meta_keyword_*` keys and the starter-template/demo-form keys; mirror every change in `pl.json`. |
| P0 | `siteConfig.title/description/keywords` are dead but loaded, so any new route that touches them ships "next-starter" to production | `src/lib/constant.ts:5-18` | Reduce to `{ url, googleSiteVerificationId }` and drop the now-unused paraglide import. |
| P0 | The theme toggle's first click is a no-op: it reads `theme` (which is `"system"`) instead of `resolvedTheme` | `theme-switcher.tsx:23`; `layout.tsx:95` passes no `defaultTheme` | `const { resolvedTheme, setTheme } = useTheme()`; toggle on `resolvedTheme`; set `defaultTheme="dark"` on `ThemeProvider`. |
| P0 | A Polish locale that translates five visible strings while the rest of the product is hardcoded English | only 6 `m.*()` calls exist app-wide, 5 of them in the navbar | Delete `language-switcher.tsx` and its two references in `navbar.tsx`, delete `pl.json`, set `"languageTags": ["en"]` in `project.inlang/settings.json`. Ship one honest locale. |
| P1 | The navbar contains no navigation — `/upload-replay`, `/replays` and `/showcase` are unreachable from every page | `navbar.tsx:55` | Insert a `<nav className="hidden items-center gap-6 text-sm sm:flex">` with the three routes, using the `Link` already imported from `@/lib/i18n`. |
| P1 | Four words of Tailwind is the shadcn scaffold header: no background, not sticky, and an invisible hairline | `navbar.tsx:44` — `<header className="w-full border-b">` | `sticky top-0 z-40 w-full border-b border-border bg-background`. |
| P1 | A monospace text wordmark with no mark reads as a scaffold placeholder | `navbar.tsx:46` | Drop `font-mono`: `flex items-center gap-2 text-[15px] font-semibold tracking-tight`. |
| P1 | The user dropdown is the next-starter demo verbatim: a 100px avatar and a 256px button inside a menu | `user-dropdown.tsx:101-132` | Left-aligned identity row, avatar at 36px, `w-full` button inside `px-2 pb-2`, and `className="w-60"` on `DropdownMenuContent`. |
| P1 | A Pro upgrade button firing live Stripe checkout with no price, no gate and no explanation — `isProUser` is read in exactly two places and gates nothing | `user-dropdown.tsx:116-131`; `navbar.tsx:18-39` | Either name the actual benefit in the label, or delete the button, the `isProUser` prop and its Supabase query. Do not ship a checkout for an undefined product. |
| P1 | Four different taglines for one product inside one file | `layout.tsx:24, 28, 55, 57, 65, 67` | One title string, one long description, one short description. Reuse verbatim. |
| P1 | `og:image` renders with a double slash and the wrong aspect for `summary_large_image` | `layout.tsx:59, 69` — `${siteConfig.url()}/images/logo.png`; declared 1024×1024 | Use the path alone (`'/images/logo.png'`) so `metadataBase` resolves it, or point at the existing `opengraph-image.png` (2048×734) and correct the declared dimensions. |
| P1 | Every sub-route hardcodes the brand into its own title while the layout template appends it again | `login/page.tsx:18`, `error/page.tsx:2`, `payment/success/page.tsx:9`, `payment/cancel/page.tsx:8`, `upload-replay/page.tsx:8`, `showcase/layout.tsx:8` — tabs read `Sign In \| ReplayRhythms \| ReplayRhythms` | Drop the suffix from each; let `template: '%s \| ReplayRhythms'` do it. |
| P2 | Five unresolved scaffold instructions left in shipping metadata | `layout.tsx:70, 77, 78, 83, 84` — `// Replace with your name` etc., above values that are already filled in | Delete the five trailing comments. The values stay. |
| P2 | Commented-out logo block plus a now-dead `next/image` import, and an unused paraglide import whose old call site is still mocked in the spec | `navbar.tsx:8, 10, 47-52`; `src/__tests__/unit/navbar.spec.tsx:56-59` | Delete all four; delete the message mock from the spec. |
| P2 | Theme toggle icons carry no size class, so lucide's 24px default nearly fills a 40px button | `theme-switcher.tsx:25-26` | `size-[1.15rem]` on both; `variant="ghost"` so a nav utility stops rendering as a filled tile. |
| P2 | The accessible name is the scaffold string "theme toggle" — it names the widget, not the action | `theme-switcher.tsx:22` | `aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}`; drop the message key. |
| P2 | No footer anywhere, so every route ends on raw content with no ballchasing.com or Spotify attribution | `layout.tsx:106` | Add `src/components/footer.tsx` (one `<footer className="mt-24 border-t border-border">` with the wordmark and attribution) and mount it after `{children}`. |

### Upload (`UploadReplayPage.tsx`, `/upload-replay`)

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | The progress percentage is invented — a `setInterval` adds 5 every 300ms and parks at 90 | `UploadReplayPage.tsx:392` renders `{uploadProgress}%` | Delete the percentage readout. Keep the paced bar as pacing only: `<Progress value={uploadProgress} className="h-1.5" />`. Label → `Uploading…`. |
| P0 | The only saturated green in the app: the stock four-step success alert | `UploadReplayPage.tsx:253-258` — `border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950` + `text-green-500` | `<Alert variant="success">` off the new token set. Success is the accent here, not a new hue. |
| P1 | `text-primary` as the dropzone accent renders plain white under the current theme | `UploadReplayPage.tsx:320`, and `border-primary` at 292-293 | Correct once `--primary` carries the accent; no per-file colour needed after the foundation lands. |
| P1 | The stock Tailwind UI dropzone string, with the validation rule pasted in as instructions | `UploadReplayPage.tsx:319, 326` — "Click to upload or drag and drop" | `{isDragging ? 'Drop it' : 'Choose a replay'}` + `or drag one here`; hint → `.replay files, up to 10MB`. |
| P1 | A `role="alert"` box announced on page load whose title is the word "Information" | `UploadReplayPage.tsx:370-382` | One line of text: `<p className="mt-4 text-xs text-muted-foreground">Your replay goes to ballchasing.com to be parsed — usually 1–2 minutes.</p>`; drop the `Info` import. |
| P1 | A feedback prompt fires at the exact moment a 1.5s redirect starts, and a second one 5s after a failure while the user is mid-retry | `UploadReplayPage.tsx:192, 214-217` | Delete both triggers and their destructured hooks. |
| P1 | A `max-w-md` card centred in a full-screen void, matching no other route, with `min-h-screen` under a 64px navbar | `UploadReplayPage.tsx:231` | `<div className="container max-w-md py-8 px-4">` + `<Card className="w-full">`, matching `/showcase` and `/replays`. |
| P2 | A bare `<label>` with no `htmlFor` above a Radix `SelectTrigger` | `UploadReplayPage.tsx:343` | `htmlFor="visibility"` + `<SelectTrigger id="visibility">`. |
| P2 | A parenthetical gloss on every option, defining words the user knows and omitting the one that matters | `UploadReplayPage.tsx:355-363` | Bare labels; one line under the select: `Public replays can appear in the showcase.` |
| P2 | `document.getElementById` twice in a React component that already imports `useRef` | `UploadReplayPage.tsx:298, and the duplicate handler` | `const fileInputRef = useRef<HTMLInputElement>(null)`, `ref={fileInputRef}` on the input, `fileInputRef.current?.click()`. |
| P2 | Debug logging of the full API response, including the storage URL, in the shipped client bundle | `UploadReplayPage.tsx:184-186` | Delete. |
| P2 | Hand-rolled disabled styling on a Button that already ships it, including a `cursor-not-allowed` that can never render | `UploadReplayPage.tsx:408` | Delete the `className`; `disabled={!file || isUploading}` is enough. |
| P2 | Unreachable error copy behind a button that is disabled in exactly that state | `UploadReplayPage.tsx:132` | Keep the guard, drop the message: `if (!file) return;`. |
| P2 | `Go to Home` silently does nothing when `uploadedFileUrl` is null | `UploadReplayPage.tsx:414` | `onClick={() => router.push('/')}`. |

### Replays list and detail

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | The primary CTA routes to `/upload`, which does not exist | `replays/page.tsx:92`, `replays/[id]/page.tsx:331`, `showcase/page.tsx:139` | `/upload-replay` in all three. |
| P0 | A Rocket League match is identified by its GUID filename, in a stats tool, when the score and team names are already on the row | `replays/page.tsx:140, 152` | Add a `matchLabel` helper (the sibling showcase page already computes exactly this from `replay.metrics`); head → `Match`; cell renders `Blue 3–2 Orange` with the map name beneath. |
| P0 | `pending` is a real persisted status with no case in the badge, so the list shows a bare lowercase word | `StatusBadge.tsx:51`; written at `api/replay/[id]/route.ts:171,185` | Add `case 'pending':` sharing the processing branch; keep the default branch but `capitalize` it. |
| P0 | An entire hand-written failure screen is unreachable because the only button leading to it is disabled | `replays/page.tsx:167` `disabled={replay.status === 'failed'}` vs `replays/[id]/page.tsx:307-338` | Delete the `disabled` prop. Label → `View analysis`. |
| P1 | Four statuses get four hues from the Tailwind-docs pastel recipe, which paints opaque navy/olive/forest/maroon blocks on the zinc canvas | `StatusBadge.tsx:14-51` — `bg-blue-100 text-blue-800 dark:bg-blue-900` ×4 | Tinted-transparent chips off the tokens; collapse `uploaded`+`processing` (both mean "in flight, nothing to do") so only two colours carry meaning: done and broken. |
| P1 | The lone blue→purple gradient on the whole surface, on one conditional button | `replays/[id]/page.tsx:446` | `bg-primary text-primary-foreground hover:bg-primary/90`; label → `Analyze your own replay`. |
| P1 | Green means both "processing succeeded" and "publicly visible" depending on where you look | `replays/[id]/page.tsx:381`; `VisibilityToggle.tsx:84` | Visibility is not a status: `Badge` → neutral/accent chip labelled `Public`; the lock/globe icons → `text-muted-foreground` (the switch position already carries the state). |
| P1 | Raw `toLocaleString()` timestamps with seconds, in proportional figures, in a column — while the repo already exports a formatter | `replays/page.tsx:159` vs `src/utils/formatDate.ts` | `formatDateTime(replay.created_at)` in a `tabular-nums text-muted-foreground` cell. |
| P1 | Three headings stacked in 40 vertical pixels that all say the same thing | `replays/page.tsx:90, 131, 133` | Delete the whole `CardHeader` (130-135); add `<p className="text-sm text-muted-foreground mt-1 tabular-nums">{replays.length} uploaded</p>` under the h1. |
| P1 | The error state has no retry — the user's only recourse is a manual reload — and is a clone of the showcase page's with one noun swapped | `replays/page.tsx:101-109` | Hoist `fetchReplays` into a `useCallback`, call it from the effect and from a `Try again` button. |
| P1 | Fake progress: hardcoded 25/50/75 that never moves within a stage and never reaches 100 | `replays/[id]/page.tsx:250, 282` | Delete `progress` and the `<Progress>`; render the three real stages as a list with the current one marked. |
| P2 | Debug logging that cannot work — `Response` has no enumerable own properties, so it always prints `RESPONSE NOT OK {}` | `replays/[id]/page.tsx:127` | Delete the line. |
| P2 | One tab of five carries an icon, and one label is twice the length of the rest | `replays/[id]/page.tsx:461-471` | Drop the `Music` icon; even the labels: Overview / Players / Boost / Positioning / Songs. |
| P2 | A whole-page opacity fade at 0.3s here and 0.5s on showcase, while the list page has none | `replays/[id]/page.tsx:358` | Drop the page-level fade and the `motion` import; let the tab content be what moves. |
| P2 | A lone spinner in an arbitrary `h-40` box, so the page jumps when data lands | `replays/page.tsx:97` | Three `h-12 rounded-md bg-muted animate-pulse` rows inside a Card. |
| P2 | Visibility is a raw enum run through `capitalize` here and a switch-with-tooltip on the detail page | `replays/page.tsx:156` | Small `Globe`/`Lock` + label chip, matching the detail page's vocabulary. |
| P2 | One of four back buttons is missing its `ArrowLeft` | `replays/[id]/page.tsx:267` vs 220, 315, 369 | Add the icon. |
| P2 | A bare unstyled paragraph as the not-found state: no card, no heading, no way out | `replays/[id]/page.tsx:340` | Reuse the error branch's shape with a `Back to your replays` button. |
| P2 | A per-user, permission-gated detail page declared indexable | `replays/[id]/layout.tsx:9` | `robots: { index: false, follow: true }`. |
| P2 | `VisibilityToggle.tsx` is missing the repo-mandated ABOUTME header | `VisibilityToggle.tsx:1` | Add it. |

### Showcase

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | A trophy "Featured" badge that means `index < 3` on a `created_at DESC` query — fabricated hierarchy | `showcase/page.tsx:174-178` | Delete the badge and the `Award` import. If recency deserves a marker, gate it on real recency. |
| P1 | `hover:shadow-md` on a near-black canvas — a hover state chosen from a light-mode default and never looked at | `showcase/page.tsx:149` | `transition-colors hover:border-border/80`. |
| P1 | The most-generated Framer Motion snippet in existence: `y: 20`, `staggerChildren: 0.1`, no duration, no easing — the 10th card arrives a second late, over a second page-level fade | `showcase/page.tsx:74-94` | `staggerChildren: 0.04`; item `y: 8` with `duration: 0.24, ease: [0.32, 0.72, 0, 1]`; delete the outer fade. |
| P1 | A real `<button>` nested inside a `div role="button"` navigating to the same URL, needing `stopPropagation` to undo the duplication | `showcase/page.tsx:180-190` | Delete the inner Button; use the `ArrowUpRight` affordance the landing page already uses. |
| P1 | Error state cloned verbatim from `/replays`, raw Supabase message, no retry | `showcase/page.tsx:120-124` | Same `useCallback` + `Try again` treatment; demote the raw message to `text-xs`. |
| P2 | A "Back to Home" ghost button duplicating the navbar logo link | `showcase/page.tsx:98-104` | Delete it and the `ArrowLeft` import. |
| P2 | `TrendingUp` (an analytics-growth glyph) as the empty-state icon, where `/replays` uses `FileUp` for the same state | `showcase/page.tsx:14, 132` | `FileUp`. |
| P2 | `'Unknown Map'` — placeholder text shipped to users | `showcase/page.tsx:70` | Return `null` and render the segment conditionally. |

### Stats surface (`ReplayStats.tsx`, `PlayerStats.tsx`)

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | Both charts branch on `theme`, which is `"system"` by default — so every visitor who has never touched the toggle gets `#1e293b` axis labels on a near-black card | `ReplayStats.tsx:115,121-139`; `PlayerStats.tsx:202,209-226` | `const { resolvedTheme } = useTheme()`; hoist `isDark` above the chart config and use it everywhere. |
| P0 | Numbers are left-aligned proportional figures in a numeric comparison table | `PlayerStats.tsx:308`; `ReplayStats.tsx:166-310` | `text-right tabular-nums` on cells, `text-right` on heads, `tabular-nums` on every stat value. |
| P0 | `maintainAspectRatio` never disabled inside a hardcoded `h-[300px]` box, so the canvas overflows on wide viewports | `ReplayStats.tsx:229`; `PlayerStats.tsx:251` | `maintainAspectRatio: false` in both option objects; `h-72` instead of the bracket value. |
| P1 | MVP is highlighted in a yellow that exists nowhere else in the app and is byte-identical to the "processing" status chip | `PlayerStats.tsx:279, 285-290`; `ReplayStats.tsx:325` | Neutral lift `bg-foreground/[0.06]` on the row; outline badge for MVP; team-coloured chip in place of the tinted Trophy circle. |
| P1 | "Blue team" is defined five different ways with five ramps and no token | `ReplayStats.tsx:238, 240, 277, 279, 327`; `PlayerStats.tsx:297` | Add `TEAM_CLASSES` to `src/utils/chartColors.ts` (which already owns team colour and is already imported by both) and use it everywhere. Blue = the user's team; orange is `--signal`. |
| P1 | Six stats rendered as six identical `text-2xl font-bold` blocks in a 3×2 grid, mirrored — goals ranked equal to assists | `ReplayStats.tsx:245-272, 284-311` | Lead stat (goals, `text-5xl`) plus a three-up support row above a hairline. |
| P1 | Machine-literal labels — "Time in Defensive Third (%)", "Shooting Percentage (%)" — where ballchasing.com, the app's own data source, says "% Defensive third" | `PlayerStats.tsx:44-118` | Adopt the source's vocabulary. This also stops a 200px column header sitting over a 4-character number. |
| P1 | The orange team block is a verbatim 37-line copy of the blue one | `ReplayStats.tsx:238-274` vs `277-313` | Extract a local `TeamCard` component in the same file. |
| P2 | Units inferred by substring-matching the stat id at render time, so `avg_speed` prints `1387.4218101` with no unit and a missing field prints `undefined%` | `PlayerStats.tsx:309-315` | Add `unit`/`decimals` to each descriptor and one `formatStat` helper that returns an em dash for null/NaN. |
| P2 | Three `<Card>`s nested inside a Card's content, where `--card` and `--background` were identical — three concentric outlines and doubled padding | `ReplayStats.tsx:160-207` | Flatten to three divs separated by a rule. |
| P2 | The chart title repeats the CardTitle and the Select value inside 400px | `PlayerStats.tsx:199-203`; `ReplayStats.tsx:112-116` | `title: { display: false }` in both. |
| P2 | Team membership carried by fill colour alone, and the `<canvas>` has no accessible name | `PlayerStats.tsx:177, 252`; `ReplayStats.tsx:230` | Two-line ticks (`[name, teamName]`) and `role="img" aria-label=…` on both charts. |
| P2 | MVP stats shown as inline `Label: value` pairs 60 lines after the same four stats were shown as stacked big numbers | `ReplayStats.tsx:338-355` | Match the team-card pattern; retitle `Most Valuable Player` → `MVP`. |
| P2 | The same picker is `w-[200px]` in one component and `w-[160px]` in the adjacent one | `PlayerStats.tsx:238`; `ReplayStats.tsx:216` | `w-48` in both. |
| P2 | A commented-out duplicate of a live line, and a `let winner = null` whose null is unreachable | `PlayerStats.tsx:157`; `ReplayStats.tsx:51` | Delete; `let winner: string`. |

### Music surface (`SongRecommendations.tsx`, `SpotifySongCard.tsx`)

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | A developer test harness with a hardcoded player UUID, rendered unconditionally on the product's payoff screen | `SongRecommendations.tsx:151-219, 297-312` | Delete the button and `testWithSampleData`, and the sample-data toast at 190-193 and the `⚠️ Using sample data` metadata block at 489-502. |
| P0 | The recommendation reasoning — the one thing no competitor has — is `text-xs italic text-muted-foreground` below the embed, ranked under the BPM | `SpotifySongCard.tsx:207` | Move it directly under the title/artist and set it as the card's lead line: `text-sm leading-relaxed text-foreground/80`. Drop `italic`. |
| P0 | Internal LLM prompt-schema keys promoted to user-facing headings | `SongRecommendations.tsx:404, 417, 425, 437` — "Player Archetype", "Emotional Arc", "Song Search Direction" | Delete the Search Direction block (it is the query, not the answer); rename the rest to plain language. |
| P0 | Raw HTTP status lines rendered as the product's voice | `SongRecommendations.tsx:108`; `api/recommendations/route.ts:68, 80` | Throw a written sentence; keep the status in `console.error`. |
| P0 | Dead gradient code carrying purple→pink and green→emerald ramps | `SpotifySongCard.tsx:58-73` — `getBadgeVariant`/`getBadgeClassName`, neither referenced | Delete both functions; keep `isMatchedCriteria` and call it from the two badge maps. |
| P1 | A green/yellow/red traffic light applied to a metric with no good/bad axis, so "intensity: low" is painted as failure | `SongRecommendations.tsx:221-232` | A single-hue intensity ramp on the accent: `bg-primary/20 text-primary` → `bg-primary/10` → `bg-muted text-muted-foreground`. |
| P1 | Three unrelated hues handed to three stat numbers for variety, all light-mode-only `-600` weights | `SongRecommendations.tsx:373, 379, 385` | All three `text-2xl font-bold tabular-nums text-foreground`. |
| P1 | Light-mode-only red literals for the error box on a near-black page | `SongRecommendations.tsx:326-328` | `bg-destructive/10 border-destructive/30` + `text-destructive`. |
| P1 | A three-tier euphemism ladder topped with "Perfect Match", restating a number shown 200px away | `SpotifySongCard.tsx:270-287` | Delete the block; show the score once, in the actions row: `{song.match_score}% match` in `text-xs tabular-nums text-muted-foreground`. Update `src/__tests__/unit/SpotifySongCard.spec.tsx:181-198`. |
| P1 | The same fact encoded three times in 60px: a filled badge, a ✓ inside it, and a comma-separated debug line labelled with a colon | `SpotifySongCard.tsx:225-230` | Delete the "Matched:" block. |
| P1 | Raw Unicode dingbats hand-appended inside badges, two different glyphs for one meaning, in a codebase that imports lucide everywhere | `SpotifySongCard.tsx:182, 201` | Delete both spans; the filled-vs-outline badge already carries the signal. Update the two glyph assertions in the spec (119-139). |
| P1 | A code comment that is a chat assistant's reply text addressed to the reader, above a parameter the function never reads | `SpotifySongCard.tsx:83-84` | Rewrite as a statement of what the function does; drop the unused `compact` parameter and fix the call site. |
| P1 | `transition-all duration-300 hover:shadow-lg` — a blanket property, twice the right duration, and a shadow that is invisible on dark | `SpotifySongCard.tsx:102` | `transition-colors duration-instant hover:border-foreground/25`. |
| P1 | The expand animation remounts the iframe via `key`, restarting the track from 0:00 while the container smoothly grows around it | `SpotifySongCard.tsx:153` | Delete the `key`; `height="100%"` and let the animated wrapper drive the size. |
| P2 | A callback named for play state that fires on expand and never on collapse, so the "now playing" ring latches forever | `SpotifySongCard.tsx:75-80` | Call it symmetrically; change the visual to an expanded-card treatment, since the card has no play affordance of its own. |
| P2 | `y: -20` entry with `delay: index * 0.1`, no duration, no easing | `SpotifySongCard.tsx:98` | `y: 8`, `duration: 0.24`, `delay: Math.min(index, 5) * 0.04`, `ease: [0.32, 0.72, 0, 1]`. |
| P2 | Hardcoded `gray-*` (blue-tinted) inside a zinc app, painting a near-black slab onto a white card in light mode | `SpotifySongCard.tsx:129, 159-161` | `bg-surface` / `bg-muted` / `text-muted-foreground`. |
| P2 | Three arbitrary list caps (4, 3, 2) with no overflow affordance, and a fourth list left unbounded | `SpotifySongCard.tsx:169, 190, 214` | One cap of 3, matched items sorted first, `+N` badge where anything was cut. |
| P2 | Six sibling blocks separated by the identical `mb-3`, so nothing is grouped | `SpotifySongCard.tsx:107-230` | `space-y-3` on the body with `space-y-1.5` around the identity/reasoning pair. |
| P2 | Truncated titles with no recovery, and "by" prefixed to the artist | `SpotifySongCard.tsx:110-113` | `title={…}` on both; drop the "by". Update the spec assertion at 111. |
| P2 | Stock browser prose bullets dropped into a designed card | `SongRecommendations.tsx:428` | `border-l-2 border-primary/40 pl-3` list items. |
| P2 | A spinner with an ellipsis for a call that hits a Python service and an LLM | `SongRecommendations.tsx:315` | Three skeleton rows shaped like the results. |
| P2 | Debug logging in the production success path | `SongRecommendations.tsx:118` | Delete. |
| P2 | The card renders no album art of its own — all visual identity is delegated to a third-party iframe — while `api/spotify/track` already returns `album.images` and nothing calls it | `SpotifySongCard.tsx:158-164` | At minimum, shrink the missing-embed fallback to one line. Wiring the existing endpoint to a 64px cover is the highest-value follow-up on this surface. |

### Auth, payments and error states

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | Sentry's onboarding demo page is live and crawlable on production — still titled `sentry-example-page`, still linking a private Sentry org, still in Sentry purple, and importing `next/head` (a Pages Router API that does nothing here) | `src/app/sentry-example-page/page.tsx`; not disallowed in `src/app/robots.ts` | Delete `src/app/sentry-example-page/` and `src/app/api/sentry-example-api/`. Nothing else references them; Sentry is already wired via `global-error.tsx` and `error-boundary.tsx`. |
| P0 | `/error` is a dead end: no link, no button, and one message for four genuinely different failures | `src/app/error/page.tsx:9-11` — "We apologize for the inconvenience. Please try again later." | Name the real causes (bad credentials or a used confirmation link) and add a `Back to sign in` button; wrap it in the `Card` the login page already uses. |
| P0 | The sign-up path has no success state at all: with email confirmation on, the user lands on the homepage still signed out, with no message | `login/action.ts:70-71` | `redirect('/login?verify=1')` and render a "check your inbox" line above the form. |
| P1 | The login page is the unmodified shadcn auth block — no logo, no imagery, and a description that restates its own title while never mentioning replays, stats or music | `login/page.tsx:34-37` | Title `Sign in to ReplayRhythms`; description states what an account is for. Add the existing `public/images/logo.png` at 40px in the header. |
| P1 | Three labels for two actions on one card: "Sign In" / "Log in" / "Sign up", with the navbar saying "Sign in" above them | `login/page.tsx:36, 53, 61` | `Sign in` and `Create account`. |
| P1 | `ErrorBoundary` repeats `/error`'s headline verbatim, in hardcoded `gray-*` (hue 220) against a zinc app, above a hand-rolled `bg-blue-600` button that ignores the `Button` component two directories away | `error-boundary.tsx:53-69` | `text-foreground` / `text-muted-foreground` / `font-mono text-xs` for the event id; import and use `Button`. Do not point the copy at the feedback widget — it is mounted *inside* the boundary and is unmounted when the fallback renders. |
| P1 | 64px `red-500` / `green-500` traffic lights on a cool canvas, with the red one alarming about a cancelled checkout while the copy beneath says nothing happened | `payment/cancel/page.tsx:18`; `payment/success/page.tsx:23` | Cancel: `size-10 text-muted-foreground`. Success: `size-10 text-primary`. |
| P1 | Both payment pages hand-roll a card that re-implements `<Card>` and gets the elevation wrong (`shadow-lg` vs the system's `border shadow-sm`) | `payment/success/page.tsx:21`; `payment/cancel/page.tsx:16` | Import `Card` and use `<Card className="mx-auto max-w-md p-6">`. |
| P1 | "Return to Home" on both payment pages — on the success page it sends a paying user to the marketing landing page | `payment/success/page.tsx:32`; `payment/cancel/page.tsx:27` | Success → `/upload-replay`. Cancel → `/replays`. |
| P2 | The auth error page hedges about its own internals while the app knows exactly why it rendered | `auth/auth-code-error/page.tsx:10-11` | State the cause and give the next click. Also add a `metadata` export — the page currently inherits the marketing title. |
| P2 | Hash-banner debug logging in shipped server actions, including a `JSON.stringify` of the OAuth response and a typo'd "SUCCESSFULL" | `login/action.ts:29-31, 46-48`; `auth/callback/route.ts:22` | Delete all three. Sentry already captures what matters. |
| P2 | "Or continue with" in `text-xs uppercase` is verbatim shadcn `authentication-01`, and dangles when only one provider follows | `login/page.tsx:70-72` | Drop `uppercase`; the divider reads `or`. |
| P2 | `min-h-screen` on a page rendered under a 64px navbar, while its three siblings use `min-h-[calc(100vh-4rem)]` | `auth/auth-code-error/page.tsx:7` | Match the siblings and add `container`. |
| P2 | The whole surface hardcodes English while the navbar directly above it calls Paraglide | `login/page.tsx:36` vs `navbar/sign-in-button.tsx:15` | Resolved by shipping one locale (see chrome): once `pl.json` is gone, hardcoded English is consistent, not a half-wired system. |

### Feedback layer and loading states

| Severity | Tell | Evidence | Fix |
|---|---|---|---|
| P0 | The `✨` sparkle prompt — the most recognisable generated-copy signature after the rainbow gradient — shown to every user after three minutes | `useContextualFeedback.ts:72` | Rewrite as a plain question; strip the leading emoji from all six trigger messages (37, 44, 51, 58, 65, 72). |
| P0 | `Sparkles` from lucide as the prompt's icon, with a `text-primary` accent that renders the exact same white as body text | `ContextualPrompt.tsx:14, 153`; same no-op at `FeedbackWidget.tsx:324, 338` | `MessageCircle` (already imported in this feature); the `text-primary` becomes a real accent once the foundation lands. |
| P1 | Emoji as iconography in a lucide app — 13 of the 16 emoji in the codebase live in these two files | `ContextualPrompt.tsx:66-83, 145-147` | Delete `getContextIcon` and the `text-2xl` glyph slot; the header icon is the icon. |
| P1 | A solid near-white `shadow-lg hover:scale-105` pill parked bottom-right of every page, the highest-contrast object in the product | `FeedbackWidget.tsx:306-313` | `size="icon" size-11 rounded-full border border-border bg-secondary text-secondary-foreground` with no scale and no shadow; icon only, `aria-label="Send feedback"`. |
| P1 | A 384px form auto-opens over the content 30 seconds after load, on every route, and the dismissal is component state so it returns on the next page load | `FeedbackWidget.tsx:84, ~105, ~283` | `autoShowDelay = 180000`; persist the dismissal in `localStorage` and bail if it is under 30 days old. |
| P1 | The two floating cards use `border-2 shadow-xl` while the system's Card is `border shadow-sm` — the least important surface has the heaviest treatment | `FeedbackWidget.tsx:320`; `ContextualPrompt.tsx:141` | One border weight and one shadow language, off the tokens; `bg-popover/95` instead of `dark:bg-gray-900/95`. |
| P1 | The `exit` animations never run: `AnimatePresence` is inside a component whose parents mount it conditionally | `ContextualPrompt.tsx:99-133`; consumers at `replays/[id]/page.tsx:499` and `UploadReplayPage.tsx:430` | Move `AnimatePresence` to the call sites; key the two inner states so they cross-fade. |
| P1 | Saturated green/red from the raw palette, coding a "No" answer as an error state | `QuickFeedback.tsx:107-113, 128-181` | One selected treatment: `bg-accent text-accent-foreground`. Confirmation uses `bg-secondary` with a `text-primary` check. |
| P1 | `Loader2` + `animate-spin` — the most-generated loading state in existence — in a product about music | `LoadingSpinner.tsx:29-32` | A three-bar level meter using a `meter` keyframe in `tailwind.config.ts`, same props contract. Also move `className` from the icon to the wrapper (it currently margins the glyph) and stop mixing a template literal into `cn()`. |
| P2 | A placeholder templated from a UI label, producing "Tell us about your appreciation…" | `FeedbackWidget.tsx:380` | One fixed prompt. |
| P2 | Four buttons on an 80px-wide card, two of which call the same handler | `ContextualPrompt.tsx:189, 222` | Delete the second escape hatch; one label per action. |
| P2 | Two independently authored floating components sharing one screen corner with a 12px gap nobody chose | `FeedbackWidget.tsx:298` (`bottom-6`) vs `ContextualPrompt.tsx:104, 139` (`bottom-20`) | `bottom-[5.5rem]` on the prompt so the gap is a deliberate 16px. |
| P2 | A file header comment naming a path that does not exist | `ResumeTracker.tsx:1` — `// components/resume-tracker.tsx` | Replace with the two-line ABOUTME header. |
| P2 | `public/llms.txt` repeats the "personalized … unique playstyle" phrasing, so it is what other AI systems will quote about this product | `public/llms.txt:3` | Rewrite to the new one-line description. |

## Copy rewrite table

Every user-visible string that carries the machine voice. Apply verbatim.

### Brand and metadata

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/components/navbar/navbar.tsx:53` | `Replay Rythms` | `ReplayRhythms` | Misspelled brand on every page; contradicts all 12 metadata occurrences. |
| `src/messages/en.json:3` | `"app_name": "next-starter"` | `"app_name": "ReplayRhythms"` | The app's i18n identity is still the scaffold's package name. |
| `src/messages/en.json:12` | `"meta_title": "Next.js Starter"` | `"meta_title": "ReplayRhythms"` | Same. |
| `src/messages/en.json:13` | `"meta_description": "A Next.js starter template, packed with features like TypeScript, Tailwind CSS, Next-auth, Eslint, testing tools and more. Jumpstart your project with efficiency and style."` | `"meta_description": "Upload a Rocket League replay. ReplayRhythms reads how you played that match and finds songs that fit it."` | Describes a repo, not a product. |
| `src/messages/en.json:14-23` | ten `meta_keyword_*` keys (Next.js, React, Prisma, Next-auth, shadcn-ui, …) | delete all ten | Build-stack keywords shipped as the product's keywords. |
| `src/messages/en.json:24-25` | `nextjs_starter_template_headline`, `nextjs_starter_template_description` | delete both | Starter marketing prose; no call sites. |
| `src/messages/en.json:10-11, 26-27` | `input_placeholder`, `submit_form`, `get_started`, `github` | delete all four | Demo-form strings for a form this app does not have; no call sites. |
| `src/messages/pl.json` | mirrors of all of the above, untranslated | mirror every deletion; then delete the file with the locale | The Polish build ships English starter copy. |
| `src/lib/constant.ts:5-18` | `title`, `description`, `keywords` reading from the starter messages | delete all three fields; keep `url` and `googleSiteVerificationId` | Dead but loaded — a loaded gun pointed at any new route. |
| `src/app/layout.tsx:24` | `'ReplayRhythms \| Rocket League Replay Analysis with Musical Matching'` | `'ReplayRhythms \| What your Rocket League match sounds like'` | "Musical Matching" is invented title-case jargon. |
| `src/app/layout.tsx:28` | `'ReplayRhythms analyzes your Rocket League gameplay and recommends personalized music that matches your unique playstyle. Upload your replay files to discover your gameplay soundtrack.'` | `'Upload a Rocket League replay. ReplayRhythms reads your boost, speed, positioning and shots off ballchasing.com, then finds songs that fit how you played.'` | Three banned words in two sentences. |
| `src/app/layout.tsx:55` | `'ReplayRhythms \| Convert Your Rocket League Gameplay into Music'` | `'ReplayRhythms \| What your Rocket League match sounds like'` | Four taglines for one product in one file; use one. |
| `src/app/layout.tsx:57` | `'Upload your Rocket League replay files and discover what your gameplay sounds like. ReplayRhythms analyzes your playstyle and matches it with the perfect soundtrack.'` | same string as line 28 | Same. |
| `src/app/layout.tsx:65` | `'ReplayRhythms \| Your Rocket League Playstyle as Music'` | same string as line 24 | Same. |
| `src/app/layout.tsx:67` | twitter description variant | `'Upload a replay. Get songs that fit how you played it.'` | Short card, short line. |
| `src/app/layout.tsx:29-42` | 13 keywords including `gaming`, `esports` | `['Rocket League', 'replay analysis', 'music recommendation', 'ballchasing.com']` | Keyword stuffing for terms the product is not. |
| `src/app/layout.tsx:118` | `'ReplayRhythms analyzes your Rocket League gameplay and recommends personalized music that matches your unique playstyle.'` (JSON-LD) | `'ReplayRhythms turns a Rocket League replay into songs that match how the match was played.'` | The banned phrasing reaching search engines as machine-readable fact. |
| `src/app/layout.tsx:70, 77, 78, 83, 84` | `// Replace with your Twitter handle if you have one` and four siblings | delete the five comments | The values are filled in, so the instructions are now false. |
| `public/llms.txt:3` | `> A web application that analyzes Rocket League gameplay replay files and recommends personalized music based on your unique playstyle and match statistics.` | `> Upload a Rocket League replay and ReplayRhythms turns how you played that match — boost, speed, saves, goals — into songs you can play on Spotify.` | This is what other systems will quote about the product. |

### Landing page

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/app/page.tsx:60` | `Rocket League Music Match` | `Hear how you play` | A third brand name competing with the navbar and metadata; a headline should be a sentence, not another product name. |
| `src/app/page.tsx:64-65` | `Get personalized music recommendations based on your Rocket League playstyle and replay stats` | `Upload a replay. ReplayRhythms reads your boost, pace and positioning off ballchasing.com and hands back songs that fit.` | Swap the nouns and this sentence still works for any product; the replacement could only describe this one. |
| `src/app/page.tsx:70-77` | `Discover your perfect gaming soundtrack` (whole `motion.p` block) | delete the block | A third statement of one idea, orphaned below the CTA, containing two banned words. |
| `src/app/page.tsx` (new, after the subhead) | — | `Rocket League saves every match to Documents\My Games\Rocket League\TAGame\Demos.` | The single highest-value missing sentence: the product asks for a file most players have never knowingly touched. |
| `src/app/page.tsx:129-133` | `Upload your .replay files to get music recommendations tailored to your unique playstyle. Our AI analyzes your gameplay patterns, aggression level, and match dynamics to suggest the perfect soundtrack that matches your Rocket League energy and flow.` | `Drop in a .replay file. ballchasing.com breaks out the match — boost usage, time behind the ball, supersonic time, shots — and those numbers pick the songs. Usually done in two minutes.` | Four marketing tics in 44 words, and two of the three named inputs are abstractions the codebase never computes. |
| `src/app/page.tsx:136` | `Sign in to get started!` | `Sign in first` | Unearned exclamation, and the most generic CTA phrase in software. |
| `src/app/page.tsx:216-220` | `Browse your personalized music recommendations and replay history. See how your playstyle has evolved and discover new tracks that match your current gaming vibe. Connect with Spotify to create playlists from your recommended songs and enhance your Rocket League sessions.` | `Every replay you have uploaded, and the songs each one produced. Play them inline, or open them in Spotify.` | Promises trend analysis and playlist creation that do not exist — `src/app/api/spotify/` contains only `auth/` and `track/`. |
| `src/app/page.tsx:223` | `Sign in to access your replays!` | `Sign in to see yours` | Mirror-image exclamation; the symmetry is the giveaway that both were generated from one template. |
| `src/app/page.tsx:101` | `aria-label="Navigate to upload replay page"` | `aria-label="Upload a replay"` | "Navigate to" is redundant on a control. |
| `src/app/page.tsx:188` | `aria-label="Navigate to view replays page"` | `aria-label="Your replays"` | Same. |
| `src/app/page.tsx:109` | `alt="Rocket League car in arena - Upload replay files to analyze your gameplay"` | `alt="A Rocket League car mid-air in an arena"` | Alt text describes the image; it does not sell the feature. |
| `src/app/page.tsx:196` | `alt="Rocket League analytics dashboard showing match statistics and gameplay metrics"` | `alt="A ReplayRhythms stats screen for a finished match"` | Three near-synonyms for one screenshot. |
| `src/components/ShowcaseButton.tsx:164` | `Explore Replay Showcase` | `See what other players got` | "Explore" is a placeholder verb, and the label restates the destination's own title. |

### Upload

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/components/UploadReplayPage.tsx:234-236` | `Upload Replay File` | `Upload a replay` | Sentence case; the word "File" is doing nothing. |
| `src/components/UploadReplayPage.tsx:238-240` | `Upload your Rocket League replay file for analysis on ballchasing.com` | delete the `CardDescription` | Restates the title directly above it. |
| `src/components/UploadReplayPage.tsx:117` | `Only Rocket League replay files (.replay) are accepted` | `That is not a .replay file. Yours are in Documents\My Games\Rocket League\TAGame\Demos.` | Passive restatement of the rule instead of telling the player where the file is. |
| `src/components/UploadReplayPage.tsx:124` | `File size exceeds 10MB limit` | `` `That replay is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 10MB.` `` | States the limit without the offending value. |
| `src/components/UploadReplayPage.tsx:132` | `Please select a file to upload` | delete the message, keep the guard (`if (!file) return;`) | Unreachable: the button is disabled in exactly this state. |
| `src/components/UploadReplayPage.tsx:210` | `Error uploading file` | `The upload did not go through. Check your connection and press Upload replay again — your file is still selected.` | Names no cause and no next step. |
| `src/components/UploadReplayPage.tsx:247` | `<AlertTitle>Error</AlertTitle>` | delete the title | The destructive border and the icon already said it. |
| `src/components/UploadReplayPage.tsx:256-257` | `Success` | `Uploaded` | Status word as a title; state what happened. |
| `src/components/UploadReplayPage.tsx:260` | `Your replay file was uploaded successfully!` | delete the line | Third statement of one fact, with an unearned exclamation. |
| `src/components/UploadReplayPage.tsx:262` | `Redirecting to processing page...` | `Opening your match analysis…` | Leaks an internal route name to the user. |
| `src/components/UploadReplayPage.tsx:319-322` | `Click to upload or drag and drop` | `{isDragging ? 'Drop it' : 'Choose a replay'}` + `or drag one here` | Verbatim stock Tailwind UI dropzone string. |
| `src/components/UploadReplayPage.tsx:326` | `Only Rocket League replay files (.replay) are accepted (max 10MB)` | `.replay files, up to 10MB` | Validation rule pasted in as instructions. |
| `src/components/UploadReplayPage.tsx:344` | `Replay Visibility on ballchasing.com` | `Visibility on ballchasing.com` | Sentence case. |
| `src/components/UploadReplayPage.tsx:355-363` | `Public (Anyone can find and view)` / `Unlisted (Only accessible with link)` / `Private (Only you can view)` | `Public` / `Unlisted` / `Private`, plus one line beneath the select: `Public replays can appear in the showcase.` | Over-explains words the user knows; never says the one thing that matters. |
| `src/components/UploadReplayPage.tsx:373` | `Processing Information` | `What happens next` | A filing-cabinet label, not something a person says. |
| `src/components/UploadReplayPage.tsx:376-380` | the two-paragraph processing explainer | `Your replay goes to ballchasing.com to be parsed — usually 1–2 minutes.` | One fact, one sentence. |
| `src/components/UploadReplayPage.tsx:390` | `Uploading replay file...` | `Uploading…` | The file name is already on screen. |
| `src/components/UploadReplayPage.tsx:403` | `Cancel` | `Back` | Nothing is being cancelled; the user is leaving a page. |
| `src/components/UploadReplayPage.tsx:423` | `Go to Home` | `Back to home` | Ungrammatical title case; and this destination is called three different things across the app. |
| `src/app/upload-replay/page.tsx:8` | `title: 'Upload Replay \| ReplayRhythms'` | `title: 'Upload a replay'` | The layout template appends the brand; the tab currently reads it twice. |
| `src/app/upload-replay/page.tsx:9` | `'Upload your Rocket League replay files for detailed analysis and personalized music recommendations based on your gameplay style.'` | `'Upload a .replay file, up to 10MB. ballchasing.com parses it and the stats pick your songs.'` | Three stock modifiers chained onto one noun phrase. |

### Replays

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/app/replays/page.tsx:93` | `Upload New Replay` | `Upload a replay` | Every upload is new. |
| `src/app/replays/page.tsx:108` | `Error Loading Replays` | `Could not load your replays` | The same Title Case template appears on three routes with the noun swapped. |
| `src/app/replays/page.tsx:118` | `No Replays Found` | `Nothing uploaded yet` | "Found" is search-result language when nothing was searched. |
| `src/app/replays/page.tsx:120` | `Upload your first Rocket League replay file to get started` | `Rocket League keeps your replays in Documents\My Games\Rocket League\TAGame\Demos. Grab your last match and drop it in.` | The one sentence only someone who has used the product writes. |
| `src/app/replays/page.tsx:122` | `Upload Replay` (empty-state button) | `Upload your first replay` | Verb plus context. |
| `src/app/replays/page.tsx:131-134` | `Replay Files` / `View and analyze your uploaded Rocket League replays` | delete the whole `CardHeader` | Third and fourth restatement of the h1. |
| `src/app/replays/page.tsx:140` | `<TableHead>File Name</TableHead>` | `<TableHead>Match</TableHead>` | A player never thinks of a match as a GUID filename. |
| `src/app/replays/page.tsx:168` | `View Details` | `View analysis` | Matches the sibling showcase page and says what you get. |
| `src/app/replays/[id]/page.tsx:111-112` | `Access Denied` / `You do not have permission to view this replay` | `That replay is private` / `Only the person who uploaded it can open it.` | An HTTP status wearing a hat, plus a description that restates the title. |
| `src/app/replays/[id]/page.tsx:121-122` | `Replay already exists` / `This replay file has already been uploaded` | `You already uploaded this one` / `Opening the version you have.` | Passive restatement. |
| `src/app/replays/[id]/page.tsx:157-158` | `Processing Complete` / `Replay statistics are ready to view` | `Your match is ready` / `Open the Songs tab to hear it.` | Build-log vocabulary; the description adds nothing. |
| `src/app/replays/[id]/page.tsx:173-177` | `Error` + the raw thrown message | `Could not load that replay` / `Give it a moment and refresh. If it keeps failing, the replay may not have finished processing.` | Players get shown "Failed to fetch". Keep the raw message in the existing `console.error`. |
| `src/app/replays/[id]/page.tsx:227` | `Error Loading Replay` | `Could not load this replay` | Template heading. |
| `src/app/replays/[id]/page.tsx:291-297` | `This page will automatically update when processing is complete` + `Depending on the size of the replay file, this might take 1-2 minutes` | `Most replays are done in under a minute. You can close this tab — it keeps going without you.` | Two hedged reassurances describing the page's own behaviour. |
| `src/app/replays/[id]/page.tsx:323` | `Replay Processing Failed` | `Processing failed` | Sentence case. |
| `src/app/replays/[id]/page.tsx:326` | `Unfortunately, ballchasing.com was unable to process this replay` | `ballchasing.com could not read this replay file. That usually means it is from an older game version or the recording was cut short.` | "Unfortunately" is filler; the replacement gives a cause. |
| `src/app/replays/[id]/page.tsx:340` | `Replay not found` (bare paragraph) | `That replay does not exist` / `It may have been deleted, or the link is wrong.` + `Back to your replays` | A dead end with no way out. |
| `src/app/replays/[id]/page.tsx:412-413` | `Link copied!` / `Share this replay with your friends` | `Link copied` (delete the description) | Exclamation on a clipboard write; the description presumes what the user will do. |
| `src/app/replays/[id]/page.tsx:447` | `Sign up to upload your replays` | `Analyze your own replay` | Sells the signup, not the payoff. |
| `src/app/replays/[id]/page.tsx:461-471` | `Overview` / `Player Stats` / `Boost Analysis` / `Positioning` / `Song Recommendations` | `Overview` / `Players` / `Boost` / `Positioning` / `Songs` | One label is twice the length of the rest; two name the analysis rather than what you see. |
| `src/app/replays/[id]/layout.tsx:9` | `'View detailed Rocket League replay analysis with personalized music recommendations based on gameplay stats and playstyle.'` | `'Match stats, playstyle breakdown, and the songs that match how you played.'` | Keyword-stuffed filler. |
| `src/components/StatusBadge.tsx:20` | `Uploaded` | `Queued` | With `uploaded` and `processing` collapsed to one meaning, this is the honest label. |
| `src/components/StatusBadge.tsx` (new case) | — | `case 'pending':` → `Reading stats` | A real persisted status with no case, currently rendering as a bare lowercase word. |
| `src/components/VisibilityToggle.tsx:97-98` | `'This replay is visible in the public showcase'` / `'Make this replay visible in the public showcase'` | `'Anyone with the link can see this replay in the showcase.'` / `'Only you can see this replay.'` | Two grammatical moods for one control. |
| `src/components/VisibilityToggle.tsx:57` | `Update failed` / `Could not update replay visibility` | `Could not change visibility` / `Try again in a moment.` | Title and description carry the same fact. |
| `src/app/replays/[id]/page.tsx:381` | `Public Showcase` (badge) | `Public` | The toggle beside it already says showcase. |

### Showcase

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/app/showcase/page.tsx:105` | `Replay Showcase` | `Showcase` | The route already says showcase; the word "Replay" is doing nothing. |
| `src/app/showcase/page.tsx:107` | `Explore public replays from the community` | `Real matches other players made public, and the songs each one produced. Newest first.` | Restates the title with a placeholder verb, and never says what the list is ordered by. |
| `src/app/showcase/page.tsx:122` | `Error Loading Showcase` | `Could not load the showcase` | Template heading. |
| `src/app/showcase/page.tsx:134` | `No Showcase Replays Yet` | `Nothing public yet` | Title Case template. |
| `src/app/showcase/page.tsx:137` | `Be the first to share your replays with the community!` | `Set a replay to Public when you upload it and it shows up here.` | Stock cold-start line; the replacement states the actual mechanism. |
| `src/app/showcase/page.tsx:176` | `Featured` badge (fires on `index < 3`) | delete the badge | The label claims editorial curation for "the three most recent". |
| `src/app/showcase/page.tsx:70` | `'Unknown Map'` | return `null` and render the segment conditionally | Placeholder text shipped to users. |
| `src/app/showcase/layout.tsx:8` | `title: 'Replay Showcase \| Community Rocket League Replays'` | `title: 'Showcase'` | Renders as a three-part title past the search cutoff. |
| `src/app/showcase/layout.tsx:10` | `"Browse community-shared Rocket League replays with personalized music recommendations. See how other players' unique playstyles translate into music."` | `'Public Rocket League replays from other players, and the songs their stats produced.'` | The house boilerplate phrases again. |

### Music surface

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/components/SongRecommendations.tsx:108` | `` `API request failed: ${response.status} ${response.statusText}` `` | `'Could not reach the song matcher. It sleeps when idle — give it about thirty seconds and try again.'` | A raw HTTP status line rendered as the product's voice. |
| `src/components/SongRecommendations.tsx:122` | `Recommendations Generated!` | `` `${n} tracks for ${playerName}` `` with description `Scored against how they played this match.` | "Generated" is the machine talking about itself; the exclamation celebrates an API call finishing. |
| `src/components/SongRecommendations.tsx:258` | `Song Recommendations` (CardTitle) | `Songs for this match` | Named three times within one screen-height. |
| `src/components/SongRecommendations.tsx:266` | `Select a player to generate recommendations:` | `Who were you?` | An instruction ending in a colon is a form label, not a product. |
| `src/components/SongRecommendations.tsx:279` | `{goals}G {saves}S {assists}A` | `{goals} goals · {saves} saves · {assists} assists` in `text-xs text-muted-foreground tabular-nums` | Single-letter abbreviations with no legend, printing "0G 0S 0A". |
| `src/components/SongRecommendations.tsx:310` | `Test with Sample Data` | delete the button and its handler | A debug harness on the payoff screen. |
| `src/components/SongRecommendations.tsx:316` | `Generating recommendations...` | `Reading the replay` | Machine vocabulary and an ellipsis where skeletons belong. |
| `src/components/SongRecommendations.tsx:372, 378, 384` | `Intensity Score` / `Performance Score` / `Teamwork Factor` | `Intensity` / `Performance` / `Teamwork`, each rendered `{value}/100` | A rule-of-three whose third item breaks its own pattern, with no unit or range. |
| `src/components/SongRecommendations.tsx:405` | `Player Archetype` | `How you played` | Analyst-deck vocabulary for a game about cars hitting a ball. |
| `src/components/SongRecommendations.tsx:417` | `Emotional Arc` | `How the match went` | Same. |
| `src/components/SongRecommendations.tsx:425` | `Key Observations` | `What stood out` | Same. |
| `src/components/SongRecommendations.tsx:437-447` | `Song Search Direction` block | delete the block | An internal LLM prompt field printed as a heading; it is the query, and the songs below are the answer. |
| `src/components/SongRecommendations.tsx:456` | `Recommended Songs` (h4) | delete the text, keep the `{n} tracks` badge | The third label for one list. |
| `src/components/SongRecommendations.tsx:485` | `No song recommendations found` | `Nothing matched this match. Try another player from the list.` | A flat negative with no next step. |
| `src/components/SongRecommendations.tsx:493` | `⚠️ Using sample data for demonstration` | delete with the sample-data path | Internal QA phrasing shown to a real user. |
| `src/components/SongRecommendations.tsx:496` | `Generated at: {timestamp}` | delete the block | A server log line surfaced as body copy. |
| `src/components/SpotifySongCard.tsx:112` | `by {song.artist}` | `{song.artist}` | No real music UI prefixes "by"; the position already says it. |
| `src/components/SpotifySongCard.tsx:227` | `Matched: {criteria.join(', ')}` | delete the line | Reprints the exact strings shown as highlighted badges directly above it. |
| `src/components/SpotifySongCard.tsx:244, 249` | `Compact` / `Full Player` | `Collapse` / `Expand` | Two states of one toggle in two different parts of speech. |
| `src/components/SpotifySongCard.tsx:264` | `Open Spotify` | `Open in Spotify` | Grammatical. |
| `src/components/SpotifySongCard.tsx:274, 279, 284` | `Perfect Match` / `Good Match` / `Fair Match` | delete all three; show `{song.match_score}% match` once | A euphemism ladder topped with an unearned superlative, sitting on top of the real number. Update `src/__tests__/unit/SpotifySongCard.spec.tsx:181-198`. |
| `src/components/SpotifySongCard.tsx:161` | `No Spotify preview available` | `No preview for this track.` | A 100px placeholder box for a one-line fact. |
| `src/app/api/recommendations/route.ts:68, 152` | `'Request timed out. The recommendation service is taking too long to respond.'` | `'This one is taking longer than usual. Try again in a moment.'` | Names an internal service in the product's voice. |
| `src/app/api/recommendations/route.ts:80, 164` | `'Unable to connect to recommendation service. The service may be starting up - please try again in a moment.'` | `'Could not reach the song matcher. It sleeps when idle — give it about thirty seconds and try again.'` | Explains the host's cold start to a player as though it were their concern. |
| `src/app/api/upload-replay/route.ts:71` | `'Failed to store file'` | `'Could not save your file. Try again.'` | Exposes the storage layer. |
| `src/app/api/upload-replay/route.ts:97` | `'Failed to record upload in database'` | `'We saved your file but could not start the analysis. Try uploading again.'` | Same. |

### Stats surface

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/components/PlayerStats.tsx:44-64` | `Average Boost` / `Boost Collected` / `Boost Stolen` / `Time at Zero Boost (%)` / `Time at Full Boost (%)` | `Avg boost` / `Boost collected` / `Boost stolen` / `% Zero boost` / `% Full boost` | ballchasing.com — the app's own data source — and the playerbase both write it this way. |
| `src/components/PlayerStats.tsx:76-100` | `Time in Defensive Third (%)` / `Time in Neutral Third (%)` / `Time in Offensive Third (%)` / `Time Behind Ball (%)` / `Average Speed` / `Time at Supersonic (%)` | `% Defensive third` / `% Neutral third` / `% Offensive third` / `% Behind ball` / `Avg speed` / `% Supersonic` | Same; also stops a 200px header sitting over a 4-character number. |
| `src/components/PlayerStats.tsx:118` | `Shooting Percentage (%)` | `Shooting %` | Says percentage twice. |
| `src/components/PlayerStats.tsx:40, 71, 108` | `Boost Stats` / `Positioning Stats` / `Core Stats` | `Boost` / `Positioning` / `Scoring` | The tab already says which view this is; "Core" is API taxonomy. |
| `src/components/PlayerStats.tsx:133` | `No replay metrics available` | `Ballchasing has not returned stats for this replay yet. Processing usually finishes within a minute — refresh, or go back to your replays.` | "metrics" is the code's word; the empty state names no cause and no way forward. |
| `src/components/ReplayStats.tsx:37` | `No replay metrics available` | same replacement as above | Duplicated verbatim across two files. |
| `src/components/PlayerStats.tsx:260` | `Player Stats Comparison` | `Every player` | Third heading for one idea on one screen. |
| `src/components/ReplayStats.tsx:157, 214, 320, 365` | `Game Summary` / `Team Comparison` / `Most Valuable Player` / `Replay Information` | `Game summary` / `Team comparison` / `MVP` / `Source` | Sentence case; "Information" as a heading is a container with nothing to say; `MVP` matches what `PlayerStats` already calls it. |
| `src/components/ReplayStats.tsx:375` | `Ballchasing ID` | `Full stats` | The label describes the data, not what the link does. |
| `src/components/ReplayStats.tsx:386` | `{ballchasingId.substring(0, 12)}...` | `View on ballchasing.com` | Twelve hex characters and a typed ellipsis mean nothing to a human. |
| `src/components/ReplayStats.tsx:188` | `No overtime` | render the line only when `metrics.overtime` is true | Filler generated to keep three cards symmetric. |
| `src/components/ReplayStats.tsx:202` | `Unknown playlist` fallback | render the line only when `metrics.playlist` exists | Same. |

### Auth, payments, errors

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/app/login/page.tsx:18` | `title: 'Sign In \| ReplayRhythms'` | `title: 'Sign in'` | The tab currently reads the brand twice. |
| `src/app/login/page.tsx:20` | `'...personalized music recommendations...'` | `'Sign in to upload Rocket League replays and get songs that match your stats.'` | House boilerplate. |
| `src/app/login/page.tsx:36` | `Sign In` | `Sign in to ReplayRhythms` | The product's identity vanishes at the moment the user is asked to commit. |
| `src/app/login/page.tsx:37` | `Sign in to access your account` | `Uploading a replay needs an account. It is where your replays, their stats, and the songs they matched live.` | The canonical tautology: the description restates the title in synonyms. |
| `src/app/login/page.tsx:53` | `Log in` | `Sign in` | Three terms for two actions on one card. |
| `src/app/login/page.tsx:61` | `Sign up` | `Create account` | So the two buttons name two distinct actions. |
| `src/app/login/page.tsx:72` | `Or continue with` (uppercase) | `or` | Verbatim shadcn `authentication-01`, and it dangles when one provider follows. |
| `src/app/login/page.tsx` (new) | — | `Check your inbox — we sent a confirmation link. Click it, then sign in below.` (rendered when `?verify=1`) | The sign-up path currently has no success state at all. |
| `src/app/error/page.tsx:2` | `title: 'Error \| ReplayRhythms'` | `title: 'Sign-in failed'` | Doubled brand; and "Error" names nothing. |
| `src/app/error/page.tsx:9` | `Something went wrong` | `That did not go through` | Verbatim duplicate of the ErrorBoundary heading; the two serve unrelated failures. |
| `src/app/error/page.tsx:11` | `We apologize for the inconvenience. Please try again later.` | `Either the email and password did not match an account, or the confirmation link you clicked has already been used. Both are fixable from the sign-in page.` + a `Back to sign in` button | The single most recognisable stock error sentence in software, on a page with no way out. |
| `src/app/auth/auth-code-error/page.tsx:9` | `Authentication Error` | `That sign-in link expired` | Names the real cause. |
| `src/app/auth/auth-code-error/page.tsx:10-11` | `There was a problem with the authentication process. This could be due to an expired or invalid authentication code.` | `Google sign-in links are only good for a few minutes. Start again and you will be straight back in.` | The app knows exactly why this page rendered, and guesses out loud instead. |
| `src/app/auth/auth-code-error/page.tsx:14` | `Try Again` | `Sign in with Google` | `googleOauthLogin` is the only caller that routes through `/auth/callback`. |
| `src/components/error-boundary.tsx:55` | `Something went wrong` | `This page stopped rendering` | Duplicate headline for an unrelated failure. |
| `src/components/error-boundary.tsx:57` | `We've been notified about this error and will look into it.` | `This one was logged to Sentry. Reloading usually clears it — if it comes back, the ID below says exactly what broke.` | An unearned passive promise; the replacement is accurate (Sentry is wired in `src/instrumentation-client.ts`). |
| `src/app/payment/success/page.tsx:9` | `title: 'Payment Successful \| ReplayRhythms'` | `title: 'Payment successful'` | Doubled brand. |
| `src/app/payment/success/page.tsx:26` | `Payment Successful!` | `You are on Pro` | Exclamation, and the h1 should say what the user now has. |
| `src/app/payment/success/page.tsx:28-29` | `Thank you for upgrading to Pro! Your account has been upgraded and you now have access to all premium features.` | `Your subscription is active and a receipt is on its way to your inbox.` | Says "upgrading" and "upgraded" back to back, and promises features that do not exist — `isProUser` gates nothing in the codebase. |
| `src/app/payment/success/page.tsx:33` | `Return to Home` | `Upload a replay` (→ `/upload-replay`) | Sends a paying user to the marketing page. |
| `src/app/payment/cancel/page.tsx:8` | `title: 'Payment Cancelled \| ReplayRhythms'` | `title: 'Checkout cancelled'` | Doubled brand. |
| `src/app/payment/cancel/page.tsx:21` | `Payment Cancelled` | `Checkout cancelled` | Nothing failed; a user closed a checkout. |
| `src/app/payment/cancel/page.tsx:23` | `The payment process was cancelled. No changes have been made to your account.` | `Nothing was charged, and your account is untouched.` | Restates the h1, and disagrees in tense with its own metadata on line 10. |
| `src/app/payment/cancel/page.tsx:28` | `Return to Home` | `Back to your replays` (→ `/replays`) | The user is authenticated at this point. |

### Feedback layer

| File:line | Current | Replacement | Why |
|---|---|---|---|
| `src/hooks/useContextualFeedback.ts:37` | `🎉 Great! How was the upload experience?` | `Did the upload do what you expected?` | Emoji-prefixed template; the prompt card already renders an icon. |
| `src/hooks/useContextualFeedback.ts:44` | `🎵 How do you like your music recommendations?` | `Do these songs fit the match?` | Same template, made specific. |
| `src/hooks/useContextualFeedback.ts:51` | `📊 Are the replay stats helpful?` | `Did the stats tell you anything useful?` | Same. |
| `src/hooks/useContextualFeedback.ts:58` | `🎧 How was the Spotify integration experience?` | `Did the Spotify player work for you?` | "Integration" is engineering vocabulary; users experience a play button. |
| `src/hooks/useContextualFeedback.ts:65` | `💪 We noticed an issue earlier. How can we improve?` | `Something went wrong earlier — what happened?` | Reads as surveillance, and turns a failed upload into a motivational moment. |
| `src/hooks/useContextualFeedback.ts:72` | `✨ How's your experience with ReplayRhythms so far?` | `Anything here confusing or broken?` | The sparkle prompt is the most recognisable generated-copy signature after the rainbow gradient. |
| `src/components/feedback/ContextualPrompt.tsx:1` | ABOUTME line describing prompts that appear "at perfect moments" | `// ABOUTME: Contextual feedback prompt shown after a replay uploads, recommendations load, or an error clears.` | The superlative reflex leaking into the source. |
| `src/components/feedback/ContextualPrompt.tsx:111` | `Thanks for your feedback!` | `Got it. I read these myself.` | Stock politeness formula duplicated across three components. |
| `src/components/feedback/ContextualPrompt.tsx:114` | `Your input helps us improve ReplayRhythms` | delete the line | Institutional "us" from a one-person project — `layout.tsx:77-84` names a single author. |
| `src/components/feedback/ContextualPrompt.tsx:155` | `Quick Feedback` | `Two seconds?` | Generic widget label. |
| `src/components/feedback/ContextualPrompt.tsx:180` | `Quick Rating` | `Rate it` | Same. |
| `src/components/feedback/ContextualPrompt.tsx:189, 222` | `Tell us more` and `More details` (same handler) | one label, `Write a note`, and delete the duplicate block | Two labels for one action on a 320px card. |
| `src/components/feedback/QuickFeedback.tsx:25` | `Was this helpful?` | `Do these songs fit?` | Four words that fit any product ever built. |
| `src/components/feedback/QuickFeedback.tsx:76` | `Thanks for your feedback!` | `Got it. I read these myself.` | Same shared string as above. |
| `src/components/feedback/QuickFeedback.tsx:77` | `Your input helps us improve.` | delete | Duplicate filler. |
| `src/components/feedback/FeedbackWidget.tsx:56` | `Something isn't working` | keep | Already good; the only one of the five that is. |
| `src/components/feedback/FeedbackWidget.tsx:67` | `How we can do better` | `Something that could work better` | Corporate "we" from a solo project. |
| `src/components/feedback/FeedbackWidget.tsx:72` | `Share some love` | `Say something nice` | Generated whimsy — the tone a model produces when told to sound friendly. |
| `src/components/feedback/FeedbackWidget.tsx:77` | `General Feedback` / `Other thoughts` | `Something else` / `Anything else` | Title Case on form labels. |
| `src/components/feedback/FeedbackWidget.tsx:53, 59` | `Bug Report` / `Feature Request` | `Bug` / `Feature idea` | Same. |
| `src/components/feedback/FeedbackWidget.tsx:184-186` | `Message required` / `Please write something before submitting` | `Write something first` (drop the description) | Title restated in longer words. |
| `src/components/feedback/FeedbackWidget.tsx:192-194` | `Message too short` | `A bit more detail` / `Ten characters minimum.` | Validator vocabulary. |
| `src/components/feedback/FeedbackWidget.tsx:241` | `Validation Error` | `Check that again` | Developer vocabulary as a user-facing toast title. |
| `src/components/feedback/FeedbackWidget.tsx:252` | `Thank you for your feedback. We'll review it soon.` | `Got it. I read these myself.` | An unearned promise with an undefined timeframe; use the one shared string. |
| `src/components/feedback/FeedbackWidget.tsx:309` | `aria-label="Open feedback widget"` | `aria-label="Send feedback"` | "widget" is a word from the component tree. |
| `src/components/feedback/FeedbackWidget.tsx:325` | `Share Feedback` | `Tell me something` | Title Case; and the voice is one person. |
| `src/components/feedback/FeedbackWidget.tsx:332` | `aria-label="Close feedback widget"` | `aria-label="Close"` | Same. |
| `src/components/feedback/FeedbackWidget.tsx:339` | `How's your experience so far? Let us know!` | `Found a bug, or something that should work differently?` | Vague ask plus an unearned exclamation, duplicating the contextual prompt almost word for word. |
| `src/components/feedback/FeedbackWidget.tsx:380` | `` placeholder={`Tell us about your ${label.toLowerCase()}...`} `` | `placeholder="What happened, and what did you expect instead?"` | Produces "Tell us about your appreciation…". |
| `src/components/feedback/FeedbackWidget.tsx:401` | `Send Feedback` | `Send` | The card title already says what this is. |
| `src/components/feedback/FeedbackWidget.tsx:410` | `Maybe Later` | `Not now` | Stock modal dismissal in Title Case. |
| `src/components/ResumeTracker.tsx:1` | `// components/resume-tracker.tsx` | `// ABOUTME: Mounts the resume-visitor tracking hook at the app root.` + `// ABOUTME: Renders nothing; exists so the hook runs on every route.` | Names a file that does not exist, and the repo mandates ABOUTME headers. |

## Out of scope

**Not changing, deliberately:**

- **The information architecture and the routes.** Nothing moves, nothing merges, no page is added except a footer. The owner asked to stop the app looking machine-made, not to redesign the product.
- **The curtain-reveal cards, the image-backed heroes, and the dark canvas.** These are the app's best assets. The work is to stop everything else competing with them.
- **New dependencies.** Every fix above uses `next/font/google`, `motion/react`, `lucide-react`, Radix and Tailwind, all already installed. No animation library, no icon set, no component registry, no colour tooling.
- **`package.json`.** `react-hook-form` and `@hookform/resolvers` become unreferenced once `src/components/ui/form.tsx` is deleted, but pruning them means an install, which is unsafe while packages run concurrently. File it as a follow-up.
- **Rewrites.** No file is regenerated from scratch. Every entry above is an edit to existing code.
- **The chart library.** `chart.js` + `react-chartjs-2` stay. The charts need `resolvedTheme`, `maintainAspectRatio: false` and accessible names, not a replacement.
- **Album art for song cards.** `src/app/api/spotify/track/route.ts` already returns `album.images` and nothing calls it. Wiring a 64px cover into `SpotifySongCard` would be the single biggest visual upgrade to the music surface, but it is a feature, not a craft fix, and it needs its own design pass on the card layout. Recorded here so it is not lost.
- **The Pro / Stripe question.** `isProUser` gates nothing. Either name a real benefit or remove the button — that is a product decision for the owner, not something an implementation agent should decide. The audit flags it; it does not resolve it.
- **Light mode as a first-class theme.** The product is dark-first and should say so (`defaultTheme="dark"`). Light-mode tokens are defined properly here so the theme is coherent, but no route gets a light-mode design pass in this round.
- **Em dashes.** The repo has zero in user-facing copy. That is not a rule to enforce either way; it is simply not a thing to change.
