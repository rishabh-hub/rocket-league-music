# ReplayRhythms — Adversarial Review of the Craft Redesign

Review of commit `6e47a1c` (branch `redesign/de-llm-ify`) against its parent `ccd8681`.

## Method

Six reviewers each took one lens: correctness, simplicity, design-system, accessibility,
copy, and whether the redesign met its goal. Every finding was then handed to a separate
skeptic instructed to refute it and to default to *refuted* when uncertain.

**46 findings entered verification. 29 were refuted, 17 survived.** A finding below has
been checked against the real code by an adversary trying to kill it.

This document is now both the list and the ledger. The Status column in the table below records
what has landed on `redesign/de-llm-ify`; everything under "Detail" is preserved exactly as it was
written at review time, including token values and line numbers that a fix has since moved. Read
the Status column for current state, and the prose for the argument that was made.

Finding 2 needs no further debate: its data shape was independently confirmed against a production
`metrics` row supplied by the owner, which nests the teams under `metrics.teams.blue` /
`metrics.teams.orange` exactly as the finding claims.

### Found while remediating

Two defects of the same family as findings 10–12 that no reviewer raised. The accessibility lens
audited the `--primary` and `--signal` tints and stopped there, so the `--destructive` tints were
never measured: `text-destructive` on `bg-destructive/10` came to 4.447:1 over `--background` in
light and 4.191:1 over `--card` in dark, both under the 4.5:1 floor for the small text they carry
in `alert.tsx`, `StatusBadge.tsx` and `SongRecommendations.tsx`. Same cause as the confirmed
findings — this commit replaced opaque `red-900`-style chips with translucent tints — and the same
remedy: `--destructive` moved 46% → 45% in `:root` and 56% → 59% in `.dark`, the smallest steps
that clear the floor on both `--card` and `--background`.

`src/__tests__/unit/token-contrast.spec.ts` now parses `globals.css` at run time and asserts every
ink/surface/alpha combination the app actually renders, `--destructive` included, so a future token
edit that drops a pairing below AA fails the suite rather than shipping.

---

## Confirmed findings

| # | Status | Severity | Lens | Location | Defect |
|---|---|---|---|---|---|
| 1 | Fixed — checkout gated off | high | copy | `src/messages/en.json:6` | The Pro upgrade button now promises "unlimited replays", a benefit the codebase does not gate — nothing anywhere counts or limits replays, so the paid claim is false. |
| 2 | Fixed — shared `matchSummary` | medium | correctness | `src/app/replays/page.tsx:35` | The new `matchLabel` helper reads the team objects from `replay.metrics.blue` / `replay.metrics.orange`, but stored metrics nest teams under `metrics.teams.blue` / `metrics.teams.orange`, so… |
| 3 | Fixed (CardTitle) | medium | correctness | `src/components/UploadReplayPage.tsx:220` | This CardTitle call site was not updated for the component's changed default classes, so the upload page's main heading renders uppercase in muted grey. |
| 4 | Fixed — storage guarded | medium | correctness | `src/components/feedback/FeedbackWidget.tsx:292` | The newly added localStorage read and write are unguarded, and this component is mounted in the root layout inside the app-wide ErrorBoundary, so a storage exception replaces every page with… |
| 5 | Fixed (CardTitle) | medium | simplicity | `src/components/ui/card.tsx:39` | CardTitle's new default bakes in a small-caps eyebrow treatment (`text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`), which every call site that wants a real heading m… |
| 6 | Fixed — hover dropped, variants used | medium | design-system | `src/components/SpotifySongCard.tsx:187` | A matched "theme" chip is given `variant="default"` (whose cva string carries `hover:bg-primary/80`) and then has its resting fill overridden to `bg-primary/15 text-primary`, so on hover the… |
| 7 | Fixed (CardTitle) | medium | design-system | `src/components/UploadReplayPage.tsx:220` | CardTitle's base was changed to an eyebrow style (`text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`), and this call site overrides only size/weight/tracking — so the … |
| 8 | Fixed (tokens) | medium | accessibility | `src/components/ui/button.tsx:8` | Every Button kills its native outline (`focus-visible:outline-none`) and replaces it with a 3px ring at 45% alpha, which composites to 2.07:1 (light) / 1.97:1 (dark) against the surface behi… |
| 9 | Fixed (tokens) | medium | accessibility | `src/styles/globals.css:101` | The new global focus outline `2px solid hsl(var(--ring) / 0.6)` measures 2.74:1 (light) / 2.63:1 (dark) against the page background — below the 3:1 required for a focus indicator, so every c… |
| 10 | Fixed (tokens) | medium | accessibility | `src/utils/chartColors.ts:68` | `TEAM_CLASSES.orange` renders opponent-team text in `text-signal`, which measures 4.36:1 on `--card` in light mode as plain text and 3.57:1 inside the `bg-signal/15` chip — both below the 4.… |
| 11 | Fixed (tokens) | medium | accessibility | `src/components/StatusBadge.tsx:38` | The rewritten status chips use `text-primary` on `bg-primary/10`–`/15` tints, which measure 4.17:1 and 4.47:1 on `--card` in dark mode — under 4.5:1 for the 11px badge text. |
| 12 | Fixed — variants, `/20` and `/90` gone | medium | accessibility | `src/components/SongRecommendations.tsx:151` | `getCategoryColor` was rewritten onto primary tints that measure 3.87:1 and 3.88:1 on `--card` in dark mode for the high/excellent and medium/good categories — both under 4.5:1 for the 11px … |
| 13 | Fixed (CardTitle) | medium | goal | `src/components/UploadReplayPage.tsx:220` | The upload page's only heading renders as 24px UPPERCASE muted grey, because the CardTitle override forgets the `normal-case` and `text-foreground` that the new CardTitle base style requires… |
| 14 | Fixed — index-aware | low | correctness | `src/components/SpotifySongCard.tsx:67` | `toggleExpanded` now reports collapse to the parent unconditionally, but the parent's handler clears `currentlyPlaying` without checking which card sent the event, so collapsing one card wip… |
| 15 | Fixed — radius on the clipping element | low | design-system | `src/app/page.tsx:87` | Both hero cards put `rounded-lg` and a hover/focus border on a wrapper that has no `overflow-hidden`, while the full-bleed `<Image fill>` inside it and the `CardCurtainReveal` border inside … |
| 16 | Fixed (tokens) | low | accessibility | `src/components/ui/input.tsx:13` | Placeholder text was weakened from `text-muted-foreground` to `text-muted-foreground/70`, dropping it to 2.86:1 on `bg-surface` in light mode — a regression well below the 4.5:1 required for… |
| 17 | Fixed — three states | low | copy | `src/app/replays/page.tsx:186` | The rewritten visibility column collapses three states to two and labels an `unlisted` replay "Private" behind a lock icon — a regression, since the code it replaced rendered the real value. |

Status reads one of two ways. **Fixed** means the change has landed on this branch, with the
verification recorded in the report of the package named in brackets. The placeholder token means
the row is still waiting on its package report — not that the finding was dismissed, and not that
nothing has happened, since a shared primitive may already carry part of the fix.

### Themes

**One root cause produced four of the seventeen.** `CardTitle` had been redefined as a small-caps
eyebrow, so any call site wanting a real heading had to opt out of it. `UploadReplayPage.tsx:220`
and `FeedbackWidget.tsx:326` did not, and the upload page's only heading rendered as 24px
uppercase muted grey. Findings 3, 5, 7 and 13 are all that one defect, and fixing the primitive
fixed all four: `CardTitle` is a neutral heading again, and the eyebrow treatment lives in a
sibling export, `CardSectionLabel`, which the stat cards call directly. No call site opts out.

**Five are contrast arithmetic on the new palette.** The reviewer computed ratios rather than
estimating, and cleared the core ramp: `--muted-foreground` passes everywhere it lands
(5.13–7.23:1), as do `--primary-foreground` on `--primary` and the zinc text on the image
scrims. The failures are all in translucent layers the redesign introduced — focus rings at
45%/60% alpha, and `/10`–`/15` colour tints behind small text.

---

## Detail

### 1. [HIGH] `src/messages/en.json:6` — copy

**Claim.** The Pro upgrade button now promises "unlimited replays", a benefit the codebase does not gate — nothing anywhere counts or limits replays, so the paid claim is false.

**Failure.** A signed-in free user opens the account dropdown and reads the primary button: "Go Pro — unlimited replays". They already have unlimited replays: `src/app/api/upload-replay/route.ts` performs no quota check, and `isProUser` is referenced in exactly two places (`navbar.tsx:32` computing it, `user-dropdown.tsx:132/135` disabling the button and swapping its label). Paying changes nothing about how many replays they can upload. This is the same defect the audit itself removed from `payment/success` ("promises features that do not exist — isProUser gates nothing in the codebase"), reintroduced one file over on the actual purchase CTA.

**Suggested fix.** Name a benefit the code delivers, or none: `"upgrade_to_pro_cta": "Go Pro"`. If a replay cap is intended, ship the cap first.

**Verifier.** Could not refute; confirmed real and introduced by this commit, but severity is overstated.

INTRODUCED HERE: parent ccd8681 had `"upgrade_to_pro_cta": "Upgrade to pro"` (neutral, promises nothing). HEAD src/messages/en.json:6 has `"Go Pro — unlimited replays"`. The benefit claim is new in 6e47a1c.

NOT GATED ANYWHERE: src/app/api/upload-replay/route.ts (276 lines) checks only auth and the .replay extension — no count query, no quota. `subscriptions` is read in one product path, src/components/navbar/navbar.tsx:25-35, to compute isProUser, consumed only at user-dropdown.tsx:132/136/142 (disable + label swap). src/middleware.ts has no limit logic, package.json has no rate-limiter dependency, and there is no supabase/ migrations dir carrying RLS. A free user already has unlimited replays; paying changes nothing.

REACHABLE: renders in the account dropdown for any signed-in non-Pro user (user-dropdown.tsx:129-146) and fires a real subscription checkout against env.STRIPE_SUBSCRIPTION_PRICE_ID.

AGGRAVATING, and stronger than the reviewer stated: the commit's own plan explicitly refused to decide this. docs/frontend-craft-audit.md:682 — "isProUser gates nothing. Either name a real benefit or remove the button — that is a product decision for the owner, not something an implementation agent should decide. The audit flags it; it does not resolve it." The implementation resolved it by

---

### 2. [MEDIUM] `src/app/replays/page.tsx:35` — correctness

**Claim.** The new `matchLabel` helper reads the team objects from `replay.metrics.blue` / `replay.metrics.orange`, but stored metrics nest teams under `metrics.teams.blue` / `metrics.teams.orange`, so the scoreline the commit set out to add never renders.

**Failure.** A replay with status 'ready' has `metrics` written by `extractMetrics()` (src/utils/extractMetrics.ts:64-145 and the writes at src/app/api/replay/[id]/route.ts:324-345), whose shape is `{ title, map_name, ..., teams: { blue, orange } }` — the same shape `replays/[id]/page.tsx:356-357` reads as `replay.metrics?.teams?.blue`. `replay.metrics?.blue?.name` is therefore always `undefined`, the guard fails, and the Match cell falls back to `replay.file_name`. Result: the column headed "Match" still shows the GUID filename (the exact defect docs/frontend-craft-audit.md:320 marks P0 and claims to fix), and for any replay whose metrics have no `map_name` (still processing, or a failed replay whose metrics is `{error, failure_reason}` per src/app/api/replay/[id]/route.ts:100 and :292) the sub-line at line 171 also falls back to `file_name`, so the same filename is printed twice in one cell. The bug was copied from the pre-existing `getGameSummary` at src/app/showcase/page.tsx:60, which the plan pointed at as a working reference.

**Suggested fix.** Read through `teams`: `replay.metrics?.teams?.blue?.name && replay.metrics?.teams?.orange?.name ? `${...teams.blue.name} ${...teams.blue.goals}–${...teams.orange.goals} ${...teams.orange.name}` : replay.file_name`. Fix `getGameSummary` in showcase/page.tsx the same way (or export one shared helper), and drop the `file_name` fallback from the sub-line so it renders nothing rather than repeating the primary label. This is worth a unit test — `Replay.metrics` is typed `any`, so tsc cannot catch the path.

**Verifier.** Confirmed, not refutable. `matchLabel` at src/app/replays/page.tsx:34-37 is new in 6e47a1c (git diff shows it added; ccd8681's page had a plain "File Name" column). It reads `replay.metrics?.blue?.name`, but every write path to the metrics jsonb column nests teams one level deeper: extractMetrics (src/utils/extractMetrics.ts:73,79 — `metrics.teams[team_color] = {...}`) is the only producer of team data, and it is called at src/app/api/replay/[id]/route.ts:324 (written at :331 and :345), src/app/api/upload-replay/route.ts:201 (written at :206), and scripts/fix-stuck-replay.js:115 (written at :131). The page fetches with `.from('replays').select('*')` (replays/page.tsx:62-66), i.e. the raw jsonb, so there is no flattening view or RPC. Every consumer that actually works reads through `teams`: replays/[id]/page.tsx:356-357, ReplayStats.tsx:89-90, PlayerStats.tsx:202-203, SongRecommendations.tsx:55-60. The only other flat-path reader is the pre-existing getGameSummary at showcase/page.tsx:60-61, which docs/frontend-craft-audit.md:320 cited as the working reference — so the plan propagated a broken helper into new code. Result: the guard is always false, the cell renders `replay.file_name`, and the column headed "Match" still shows the GUID filename the audit marks P0. The secondary point also holds: processing rows carry `metrics = {...prev, check_failures}` (route.ts:359,386) and f

---

### 3. [MEDIUM] `src/components/UploadReplayPage.tsx:220` — correctness

**Claim.** This CardTitle call site was not updated for the component's changed default classes, so the upload page's main heading renders uppercase in muted grey.

**Failure.** card.tsx:39 now defaults to `text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`. This call site passes `text-2xl font-medium tracking-tight`, which are different tailwind-merge groups from `uppercase` and `text-muted-foreground`; verified with twMerge, the merged result is `uppercase text-muted-foreground text-2xl font-medium tracking-tight`. The page's primary heading therefore renders as "UPLOAD A REPLAY" at 24px in muted-foreground grey rather than foreground. The analogous heading at src/app/login/page.tsx:49 does add `text-foreground ... normal-case`, so the two equivalent card headings in the same commit disagree.

**Suggested fix.** Match the login page: `className="text-foreground text-2xl font-medium normal-case tracking-tight"` — or, if page-level headings inside cards are meant to be common, add a `heading` variant to CardTitle rather than resetting four utilities per call site.

**Verifier.** Could not refute; confirmed at every level and confirmed as caused by this commit.

BLAME (this commit, not pre-existing): git diff ccd8681..HEAD -- src/components/ui/card.tsx changes CardTitle's default from 'text-2xl font-semibold leading-none tracking-tight' to 'text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground'. The same commit rewrote the call site at src/components/UploadReplayPage.tsx:220 from `text-2xl font-bold` / "Upload Replay File" to `text-2xl font-medium tracking-tight` / "Upload a replay". On main this heading rendered dark, sentence-case, 24px. So the regression is introduced here.

MERGE ARITHMETIC (verified with the installed tailwind-merge@2.6.0 via the repo's own cn in src/lib/utils.ts, which is twMerge(clsx(...))):
  twMerge(default, 'text-2xl font-medium tracking-tight') -> "uppercase text-muted-foreground text-2xl font-medium tracking-tight"
  twMerge(default, 'text-foreground text-xl normal-case tracking-tight') -> "font-semibold text-foreground text-xl normal-case tracking-tight"  (login page, clean)
The claim's string is exactly right.

ACTUAL RENDER (Playwright, dev server :3111, real compiled CSS): /upload-replay server-side redirects to /login (auth is checked in src/app/upload-replay/page.tsx before the component renders), so I applied the exact merged class string to the live CardTitle node on /login in the real cascade. Comp

---

### 4. [MEDIUM] `src/components/feedback/FeedbackWidget.tsx:292` — correctness

**Claim.** The newly added localStorage read and write are unguarded, and this component is mounted in the root layout inside the app-wide ErrorBoundary, so a storage exception replaces every page with the error fallback.

**Failure.** `localStorage.setItem` throws QuotaExceededError when storage is full or the browser is in a mode with a zero quota, and `localStorage` access itself throws SecurityError when site data is blocked. Line 292 runs inside the dismiss click handler and line 113 inside a useEffect; neither is wrapped. An uncaught throw from either propagates to the ErrorBoundary in src/app/layout.tsx, which unmounts the whole tree and renders "This page stopped rendering" — a user simply closing the feedback widget loses the page. No other code in src/ touches localStorage, so there is no existing pattern being followed here.

**Suggested fix.** Wrap both accesses: a `try { ... } catch { }` around the setItem in `handleDismiss`, and around the getItem in the auto-show effect (treating a throw as "no stored dismissal"). A three-line `readDismissedAt()` / `writeDismissedAt()` pair at module scope keeps the component body unchanged.

**Verifier.** Half refuted, half empirically confirmed — and the confirmed half is not the line the finding anchors on.

REFUTED, line 292: React error boundaries do not catch errors thrown in event handlers, and `handleDismiss` is an onClick. Verified in the running app (localhost:3111, Playwright): with only `localStorage.setItem('feedback-dismissed-at', ...)` forced to throw QuotaExceededError, opening the widget and clicking Close leaves the page fully intact — `h1` still present, zero matches for "This page stopped rendering". The only observable effects are one uncaught QuotaExceededError on window.onerror and the widget failing to close (the throw precedes setIsDismissed/setIsOpen). The finding's headline scenario — "a user simply closing the feedback widget loses the page" — is false, and line 292 is what it cites as file:line.

CONFIRMED, line 113: src/components/feedback/FeedbackWidget.tsx:113 sits in a useEffect, where throws DO propagate. With `window.localStorage` access made to throw SecurityError (Chrome/Firefox "don't allow sites to save data", or a sandboxed iframe without allow-same-origin), the effect throws during commit, ErrorBoundary at src/app/layout.tsx:101 catches it, and the entire tree (Navbar, children, Footer, Toaster) is replaced by the "This page stopped rendering" fallback on every route. Verified: fallback count 1, h1 count 0, stack traces naming FeedbackWidg

---

### 5. [MEDIUM] `src/components/ui/card.tsx:39` — simplicity

**Claim.** CardTitle's new default bakes in a small-caps eyebrow treatment (`text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`), which every call site that wants a real heading must partially undo — and two of them undo it incompletely.

**Failure.** src/app/login/page.tsx:49 has to write `className="text-foreground text-xl normal-case tracking-tight"` to cancel four of the five baked properties, which is the whole default minus `font-semibold`. src/components/UploadReplayPage.tsx:220 passes `className="text-2xl font-medium tracking-tight"` and does NOT cancel `uppercase` or `text-muted-foreground`, so after tailwind-merge the upload page's main heading renders as 24px all-caps muted-grey "UPLOAD A REPLAY". FeedbackWidget.tsx:326 (`className="text-lg"`) has the same residue. The default is shaped for the 8 stat-card eyebrows in ReplayStats/PlayerStats and wrong for the 3 heading uses.

**Suggested fix.** Return CardTitle to a neutral heading (`text-base font-semibold text-foreground`) and give the eyebrow treatment its own named component or a `variant="eyebrow"`, used by the stat cards. That removes the override at login/page.tsx:49 entirely and fixes the two incomplete overrides.

**Verifier.** Confirmed, and caused by this commit. Verified the merge with the repo's own cn (twMerge(clsx)): CardTitle's default `text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground` merged with UploadReplayPage.tsx:220's `text-2xl font-medium tracking-tight` yields `uppercase text-muted-foreground text-2xl font-medium tracking-tight` — `text-2xl` and `text-muted-foreground` sit in different tailwind-merge groups (font-size vs text-color) so the size override cannot clear the color, and nothing clears `uppercase`. Confirmed in a live browser against the running dev server (computed style: font-size 24px, text-transform uppercase, color rgb(149,158,172), letter-spacing -0.6px): the upload page's main heading renders as cramped all-caps muted grey, dimmer than the body copy under it. The negative tracking is the proof of intent — `tracking-tight` is only chosen for sentence-case display type, so the author meant a heading and forgot the cancels. Provenance checked: this commit introduced the new default (card.tsx:39, was `text-2xl font-semibold leading-none tracking-tight`) AND rewrote that call site (`text-2xl font-bold` -> `text-2xl font-medium tracking-tight`), so it is not pre-existing. Two corrections to the reviewer's write-up that do not rescue the code: (1) the FeedbackWidget.tsx:326 instance is far weaker than claimed — I opened the widget and "TELL ME SOMETHING"

---

### 6. [MEDIUM] `src/components/SpotifySongCard.tsx:187` — design-system

**Claim.** A matched "theme" chip is given `variant="default"` (whose cva string carries `hover:bg-primary/80`) and then has its resting fill overridden to `bg-primary/15 text-primary`, so on hover the fill jumps to 80%-opaque cobalt while the text stays cobalt — the chip's own label becomes unreadable.

**Failure.** Open any replay with recommendations, hover a theme chip that matched (e.g. "night drive"). tailwind-merge resolves the class list to `... hover:bg-primary/80 text-xs bg-primary/15 text-primary border-primary/30` (verified by running twMerge on the exact strings) — the `hover:` modifier is in a different variant group so it survives the override. The chip renders hsl(221 72% 46%) text on an ~80% hsl(221 72% 46%) fill: contrast ≈ 1:1, the word disappears until the pointer moves away. The same defect exists at src/components/SongRecommendations.tsx:271, where `<Badge variant="secondary" className={getCategoryColor(...)}>` keeps `hover:bg-secondary/80` and flips a cobalt-tinted category chip to grey on hover.

**Suggested fix.** Badges here are not interactive, so the hover states are stock shadcn cruft that this commit's rewrite left behind. Either drop `hover:bg-*` from the `default`/`secondary` variants in src/components/ui/badge.tsx, or stop hand-writing the fill: the tinted matched chip is byte-for-byte the `success` variant added at badge.tsx:18, so use `variant={isMatchedCriteria(theme) ? 'success' : 'secondary'}` with no className colour at all.

**Verifier.** Confirmed real and introduced by this commit, but overstated in both scope and magnitude.

MECHANISM VERIFIED: Ran the repo's own cn() (tailwind-merge, src/lib/utils.ts) on the literal strings from badgeVariants({variant:'default'}) plus the className at SpotifySongCard.tsx:187. Result keeps `hover:bg-primary/80` alongside `bg-primary/15 text-primary border-primary/30`. In the built CSS (.next/static/css/app/layout.css) both `.hover\:bg-primary\/80:hover` (specificity 0,2,0) and `.bg-primary\/15` (0,1,0) exist, so hover wins regardless of source order.

MEASURED IN BROWSER (Playwright against the built layout.css, chip fill composited over the card background):
- light: resting 5.15:1 -> hover 1.52:1
- dark:  resting 2.55:1 -> hover 1.28:1
The label is effectively illegible while the pointer is on it.

CAUSED BY THIS COMMIT: on ccd8681 the matched theme chip used `bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0`. tailwind-merge does NOT strip bg-primary/hover:bg-primary/80 there (background-image vs background-color are separate conflict groups), but the opaque gradient paints over the hover background-color, so main's chip kept readable white text. Removing the gradient for a translucent tint is what exposed the leftover hover. So this is not pre-existing.

WHERE THE CLAIM IS WRONG (basis for severity correction):
1. SongRecommendations.tsx:271 is NOT the same

---

### 7. [MEDIUM] `src/components/UploadReplayPage.tsx:220` — design-system

**Claim.** CardTitle's base was changed to an eyebrow style (`text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`), and this call site overrides only size/weight/tracking — so the upload page's only heading renders as 24px UPPERCASE muted grey, while the sibling login page opts out of exactly those two declarations.

**Failure.** src/components/ui/card.tsx:39 sets the new base. `twMerge('text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground', 'text-2xl font-medium tracking-tight')` returns `uppercase text-muted-foreground text-2xl font-medium tracking-tight` (verified) — `uppercase` and `text-muted-foreground` are in class groups the override never touches. Load /upload-replay: the card reads "UPLOAD A REPLAY" at 24px in hsl(224 12% 42%). Load /login and the equivalent heading reads "Sign in to ReplayRhythms" at 20px in `text-foreground`, because src/app/login/page.tsx:49 does write `normal-case text-foreground`. Two single-card pages shipped in the same commit with opposite heading treatments.

**Suggested fix.** Add `normal-case text-foreground` to the UploadReplayPage CardTitle to match login, or — better, since two of three non-eyebrow call sites now have to fight the base — give card.tsx an explicit eyebrow variant instead of making the eyebrow the default that every page heading must undo.

**Verifier.** I could not refute this. Every mechanical particular of the claim checks out, and each refutation angle failed.

WHAT I VERIFIED

1. The merge string is exactly as claimed. Ran the repo's own resolver (src/lib/utils.ts:6, `cn = twMerge(clsx(inputs))`, tailwind-merge 2.6.0 per package.json:75) against card.tsx's base and each override:
   - UploadReplayPage.tsx:220 -> `uppercase text-muted-foreground text-2xl font-medium tracking-tight`
   - login/page.tsx:49 -> `font-semibold text-foreground text-xl normal-case tracking-tight`
   `uppercase` (text-transform group) and `text-muted-foreground` (text-color group) survive because the upload override touches neither group. `text-2xl` collides only with `text-sm` (font-size), not with the color.

2. The merge model matches the live app. Loaded http://localhost:3111/login headless: the rendered CardTitle node carries literally `font-semibold text-foreground text-xl normal-case tracking-tight` — byte-identical to my offline twMerge output for that call site. So the offline computation is trustworthy for the upload site too.

3. Rendered result confirmed against the real stylesheet. /upload-replay is server-gated (src/app/upload-replay/page.tsx:18 redirects when `!data.user`), so I injected the merged class string into a live page carrying the app's CSS and read computed styles:
   - light: font-size 24px, font-weight 500, text-transfor

---

### 8. [MEDIUM] `src/components/ui/button.tsx:8` — accessibility

**Claim.** Every Button kills its native outline (`focus-visible:outline-none`) and replaces it with a 3px ring at 45% alpha, which composites to 2.07:1 (light) / 1.97:1 (dark) against the surface behind it — below the 3:1 WCAG 2.2 SC 1.4.11/2.4.11 minimum for a focus indicator, and a regression from main.

**Failure.** Computed: `--ring` light = hsl(221 72% 46%) at 0.45 alpha over `--background` hsl(228 28% 98%) → rgb(158,174,225), contrast 2.07:1; over `--card` (white) → 2.10:1. Dark: hsl(221 76% 62%) at 0.45 over `--background` hsl(228 14% 5%) → 1.97:1, over `--card` → 1.98:1. Because `focus-visible:outline-none` suppresses the global `:focus-visible` outline from globals.css:100, the ring is the ONLY indicator. A keyboard user tabbing across the login form, the replay-detail tab bar, or the upload page's Back/Upload pair cannot see which control is focused. Main's `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` used full-opacity ring at 6.13:1 (light) / 5.41:1 (dark), so this commit strictly reduced focus visibility. Identical defect at src/components/ui/tabs.tsx:32 (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45`, no compensating border/background change on focus) and src/components/ui/badge.tsx:7.

**Suggested fix.** Raise the ring to full opacity (`focus-visible:ring-2 focus-visible:ring-ring`) or, if the soft halo is wanted, keep `ring-ring/45` as decoration and add a solid 2px `focus-visible:outline focus-visible:outline-ring focus-visible:outline-offset-2` instead of `outline-none`. Note src/components/ui/input.tsx:13, textarea.tsx:12 and select.tsx:22 are fine — they pair the weak ring with `focus-visible:border-ring` (full opacity, 5.70:1 vs bg-surface) — so only the controls with no border change need fixing.

**Verifier.** Could not refute the core claim; I confirmed it by measuring rendered pixels, not just arithmetic.

CONFIRMED (src/components/ui/button.tsx:8):
- Focused the real "Sign in" button on /login in headless Chromium and sampled the framebuffer. Light: ring pixel rgb(151,176,229) vs page bg rgb(248,249,251) = 2.06:1. Dark: ring pixel rgb(44,65,113) vs bg rgb(11,12,15) = 1.96:1. Both below the 3:1 threshold, matching the reviewer's 2.07/1.97 almost exactly.
- Ring vs the button's own fill is also sub-3:1 (2.97 light / 2.75 dark), so it fails against BOTH adjacent colors, not just the outer surface.
- Computed outlineColor is rgba(0,0,0,0) in both themes, so focus-visible:outline-none does defeat the global :focus-visible outline at src/styles/globals.css:100 (Tailwind utilities layer beats @layer base). The 45% ring is genuinely the only indicator.
- Measurement trap I ruled out: reading getComputedStyle right after the Tab keypress shows three transparent shadow layers, because box-shadow sits in the element's transition-[...] list. After settling, --tw-ring-shadow resolves to "0 0 0 calc(3px + 0px) hsl(221 76% 62% / 0.45)" and paints. The ring is real.

CAUSED BY THIS COMMIT: main's --ring was 240 5.9% 10% (near-black, light) and 240 4.9% 83.9% (near-white, dark), full opacity with ring-offset-2 -- roughly 16:1, well over 3:1. The reviewer's "6.13:1" figure is wrong but understates 

---

### 9. [MEDIUM] `src/styles/globals.css:101` — accessibility

**Claim.** The new global focus outline `2px solid hsl(var(--ring) / 0.6)` measures 2.74:1 (light) / 2.63:1 (dark) against the page background — below the 3:1 required for a focus indicator, so every control that relies on this fallback has an invisible-to-low-vision focus state.

**Failure.** Computed: ring at 0.6 alpha over `--background` → light 2.74:1, dark 2.63:1; over `--card` → light 2.80:1, dark 2.59:1. This outline is the only focus indicator on the `role="button"` divs in src/app/showcase/page.tsx:153-165 (they declare no focus classes at all), on the drop zone at src/components/UploadReplayPage.tsx:261-280, and on plain links. A keyboard user tabbing through the showcase list sees a faint blue-grey hairline that fails at 3:1 in both themes.

**Suggested fix.** Drop the alpha: `outline: 2px solid hsl(var(--ring)); outline-offset: 2px;` — that gives 6.13:1 light / 5.41:1 dark. If the softer look is required, thicken to 3px and use a solid inner + translucent outer rather than a single translucent stroke.

**Verifier.** Could not refute; independently confirmed and commit-caused, but severity is overstated.

MATH REPRODUCED EXACTLY. Independent sRGB/WCAG calculator against the real tokens (--ring 221 72% 46% light / 221 76% 62% dark; --background 228 28% 98% / 228 14% 5%; --card 0 0% 100% / 225 12% 9%): ring at 0.6 alpha gives 2.738 over light background, 2.801 over light card, 2.629 over dark background, 2.588 over dark card. Matches the claim's 2.74/2.80/2.63/2.59 to the digit. The proposed fix also verifies: full-alpha ring = 6.130 light / 5.407 dark.

VERIFIED IN A LIVE BROWSER, not just on paper. Tabbed to the Showcase nav link at localhost:3111 in headless Chromium: light outlineColor rgba(33, 86, 202, 0.6), dark rgba(84, 131, 232, 0.6), width 2px, offset 2px, box-shadow: none, bodyBg rgb(248,249,251) / rgb(11,12,15), and el.matches(':focus-visible') === true. Rendered RGB matches the computed ring exactly, and box-shadow: none confirms the outline is the sole indicator.

NEW IN THIS COMMIT, NOT PRE-EXISTING. `git show ccd8681:src/styles/globals.css` has no :focus-visible and no outline rule at all. Tailwind 3.4.17 preflight (node_modules/tailwindcss/src/css/preflight.css) contains no global outline reset, so main was relying on the UA default focus ring for these elements. On main, navbar.tsx, showcase/page.tsx and UploadReplayPage.tsx all had zero focus classes (grep for outline|focus 

---

### 10. [MEDIUM] `src/utils/chartColors.ts:68` — accessibility

**Claim.** `TEAM_CLASSES.orange` renders opponent-team text in `text-signal`, which measures 4.36:1 on `--card` in light mode as plain text and 3.57:1 inside the `bg-signal/15` chip — both below the 4.5:1 body-text minimum, and none of the sites using it qualify as large text.

**Failure.** Computed: `--signal` light = hsl(20 84% 44%) = rgb(206,81,18), relative luminance 0.1908; on `--card` (white) → 4.36:1. Composited on `bg-signal/15` over card → 3.57:1. Consumers: (a) src/components/ReplayStats.tsx:30 — `CardTitle` is `text-sm` (14px) semibold, so the orange team's name on the team card is 4.36:1; (b) src/components/ReplayStats.tsx:289-292 — the MVP's name at `text-lg font-medium` (18px, weight 500) is NOT WCAG large text (needs 18.66px bold or 24px), so 4.36:1 fails; (c) src/components/PlayerStats.tsx:377-384 — the team chip is `text-[0.6875rem]` (11px) at 3.57:1. Symmetrically, the blue chip `bg-primary/15 text-primary` measures 4.17:1 on `--card` in dark mode, also failing. Light mode is the failing theme for orange, dark mode for blue, so no single-theme workaround exists.

**Suggested fix.** Darken `--signal` in `:root` (hsl(20 84% 38%) reaches 5.6:1 on white) and lighten `--primary` in `.dark` (hsl(221 76% 70%) clears 4.5:1 on the /15 tint), or drop the tinted fills for the chips and use `text-foreground` with a coloured left rule so the hue stops carrying the text contrast.

**Verifier.** Could not refute; independently confirmed and confirmed as caused by this commit.

Token values verified in src/styles/globals.css (--signal light 20 84% 44% = rgb(206,81,18); --card light 0 0% 100%; --primary dark 221 76% 62% = rgb(84,131,232); --card dark 225 12% 9%). Compositing verified against compiled CSS rather than assumed: .next/static/css/app/layout.css:1574 emits `background-color: hsl(var(--signal) / 0.15)` and :1901 emits `color: hsl(var(--signal))`, so bg-signal/15 really is a translucent tint over --card despite tailwind.config.ts:64-66 declaring the color without an <alpha-value> slot. Contrast recomputed from scratch and matches the reviewer to three decimals: signal on card light 4.360, signal on signal/15 over card light 3.571, primary on primary/15 over card dark 4.168. The symmetry claim holds too: orange passes in dark (7.00 plain / 5.59 chip) and blue passes in light (6.45 / 5.14), so there is no single-theme fix.

Text sizes verified: tailwind.config.ts:40,42 set sm=0.875rem and lg=1.125rem (confirmed in compiled CSS at :1790 and :1795). CardTitle base is `text-sm font-semibold` (src/components/ui/card.tsx) and cn is twMerge(clsx(...)) (src/lib/utils.ts:6), so TEAM_CLASSES[side].text overrides only the color group and 14px/600 survives. Badge base is `text-[0.6875rem] font-medium` (src/components/ui/badge.tsx:7) = 11px. None of 14px/600, 18px/500, or 11p

---

### 11. [MEDIUM] `src/components/StatusBadge.tsx:38` — accessibility

**Claim.** The rewritten status chips use `text-primary` on `bg-primary/10`–`/15` tints, which measure 4.17:1 and 4.47:1 on `--card` in dark mode — under 4.5:1 for the 11px badge text.

**Failure.** Computed on `--card` dark hsl(225 12% 9%): 'Ready' (`bg-primary/15 text-primary`, line 38) → 4.17:1; 'Reading stats' (`bg-primary/10 text-primary`, line 29) → 4.47:1. Badge base type is `text-[0.6875rem]` (11px, badge.tsx:7), unambiguously small text. These render inside a `Card` on the replays table (src/app/replays/page.tsx:173-175), so a dark-mode user reading their upload list gets the status word below threshold. The same tint recipe appears at src/app/replays/[id]/page.tsx:385 for the 'Public' chip.

**Suggested fix.** In `.dark`, either lift `--primary` (hsl(221 76% 70%) puts `text-primary` on the /15 tint at ~5.2:1) or stop tinting the chip background and use `bg-transparent text-primary` with the existing `ring-primary/30` — `text-primary` on bare `--card` dark is 5.01:1.

**Verifier.** Confirmed, not refuted. I verified the token values in src/styles/globals.css (dark --card: 225 12% 9%, --primary: 221 76% 62%) and then measured the real rendered values in headless Chromium against the running dev server: the injected chip inside a bg-card element computes to background rgba(84,131,232,0.15) over rgb(20,22,26), color rgb(84,131,232), font-size 11px, font-weight 500. Compositing gives rgb(29.6,38.4,56.9) and a contrast ratio of 4.168:1 for StatusBadge.tsx:38 ('Ready') and 4.465:1 for line 29 — both under the 4.5:1 required for 11px/500 small text. APCA is harsher, not kinder (Lc ~35, where 11px/500 needs ~Lc 90).

Not pre-existing: git show ccd8681:src/components/StatusBadge.tsx used dark:bg-green-900 / dark:text-green-100 etc., which pass at roughly 10:1. This commit introduced the tinted-transparent recipe, per docs/frontend-craft-audit.md:323. Backdrop confirmed: src/app/replays/page.tsx:152-153 wraps the table in <Card>, and src/components/ui/card.tsx:12 is bg-card; TableRow adds no base background.

Two parts of the claim I did break, neither of which saves it: (1) src/app/replays/[id]/page.tsx:385 — that 'Public' chip is NOT inside a Card. Lines 365-382 place it directly on the page container over --background (228 14% 5%), where bg-primary/10 + text-primary measures 4.913:1 and PASSES AA; that cited instance is clean. (2) Line 29 at 4.465:1 misses by 0.

---

### 12. [MEDIUM] `src/components/SongRecommendations.tsx:151` — accessibility

**Claim.** `getCategoryColor` was rewritten onto primary tints that measure 3.87:1 and 3.88:1 on `--card` in dark mode for the high/excellent and medium/good categories — both under 4.5:1 for the 11px badge text they colour.

**Failure.** Computed on `--card` dark hsl(225 12% 9%): line 151 `bg-primary/20 text-primary` → 3.87:1; line 154 `bg-primary/10 text-primary/90` (primary composited at 0.90 over the already-tinted fill) → 3.88:1. These are the Intensity/Performance/Teamwork/Closeness chips at SongRecommendations.tsx:270-275, rendered via `cn`/twMerge so the returned classes override the `secondary` variant. In dark mode — the app's default theme (layout.tsx:96 `defaultTheme="dark"`) — the words 'High'/'Medium' fail contrast. The double alpha on line 154 is the worse offender and buys nothing visually (3.88 vs 3.87).

**Suggested fix.** Drop the `/90` on line 154 and raise the fill contrast: use `bg-primary/10 text-primary` for both and lift `--primary` in `.dark`, or set these chips to `bg-secondary text-secondary-foreground` (12.58:1) and carry the high/medium/low distinction with the existing icon plus the label text, which is already present.

**Verifier.** Could not refute; the claim reproduces exactly. Verified dark tokens in src/styles/globals.css:50,54 (--card 225 12% 9%, --primary 221 76% 62%) with no later overrides. Recomputed contrast: SongRecommendations.tsx:151 `bg-primary/20 text-primary` = 3.868:1; :154 `bg-primary/10 text-primary/90` = 3.883:1 (4.465:1 if the /90 were dropped). Badge text is text-[0.6875rem] font-medium (11px, weight 500) per src/components/ui/badge.tsx:7, so no WCAG large-text exemption and 4.5:1 applies. The returned classes do beat the `secondary` variant: Badge is cn(badgeVariants({variant}), className) with className last, so twMerge keeps bg-primary/20 and text-primary/90. It is reachable: rendered at SongRecommendations.tsx:270-275 under isDeterministicProfile, used live at src/app/replays/[id]/page.tsx:487, and the commit's own fixture (src/__tests__/unit/SongRecommendations.spec.tsx:182-187) uses 'High'/'Excellent'/'Good'/'Medium' — all four chips land on the two failing branches. Dark is the default theme (src/app/layout.tsx:95). Not pre-existing: the diff replaced dark:bg-green-900/dark:text-green-100 and dark:bg-yellow-900/dark:text-yellow-100 (both high-contrast) with these tints, so this commit introduced it. Light mode passes (4.74/4.60) and the low/poor branch passes (5.86:1), so the defect is dark-mode-only and limited to the high/excellent and medium/good branches. One inaccuracy in 

---

### 13. [MEDIUM] `src/components/UploadReplayPage.tsx:220` — goal

**Claim.** The upload page's only heading renders as 24px UPPERCASE muted grey, because the CardTitle override forgets the `normal-case` and `text-foreground` that the new CardTitle base style requires.

**Failure.** CardTitle's base is now `text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground` (src/components/ui/card.tsx:39). The override here is `text-2xl font-medium tracking-tight`. tailwind-merge resolves font-size and tracking but `uppercase` and `text-muted-foreground` are in groups nothing here touches, so "Upload a replay" ships as "UPLOAD A REPLAY" at 1.5rem in `--muted-foreground` — a shouted, de-emphasised title on the app's primary flow. src/components/feedback/FeedbackWidget.tsx:326 has the same bug (`text-lg` only) so the widget reads "TELL ME SOMETHING". src/app/login/page.tsx:49 is the only caller that remembered to add `normal-case` and `text-foreground`, which proves the trap.

**Suggested fix.** Either add `normal-case text-foreground` at UploadReplayPage.tsx:220 and FeedbackWidget.tsx:326, or better: stop making callers opt out. Keep CardTitle as the small uppercase label it now is and give headings that are page titles a real `<h2>` instead of a CardTitle.

**Verifier.** Confirmed, not refuted. (1) Class resolution: ran the repo's actual tailwind-merge (^2.6.0) on the exact strings — CardTitle base `text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground` merged with UploadReplayPage.tsx:220's `text-2xl font-medium tracking-tight` yields `uppercase text-muted-foreground text-2xl font-medium tracking-tight`; FeedbackWidget.tsx:326's `text-lg` yields `font-semibold uppercase tracking-[0.06em] text-muted-foreground text-lg`. (2) Computed style: injected those strings into the running app at localhost:3111 against the real compiled stylesheet (dark theme) — upload title resolves to fontSize 24px, textTransform uppercase, color rgb(149,158,172) (muted), letterSpacing -0.6px; login's override resolves to textTransform none, color rgb(240,242,244). So "Upload a replay" renders as "UPLOAD A REPLAY" at 24px in muted grey with negative tracking on uppercase text. (3) Introduced by this commit: git diff ccd8681..6e47a1c shows card.tsx:39 changing from `text-2xl font-semibold leading-none tracking-tight` (normal case, inherits card-foreground) to the uppercase muted base, and the same diff rewrites UploadReplayPage.tsx:220 from `text-2xl font-bold` to `text-2xl font-medium tracking-tight`. Nothing pre-existing. (4) Reachable and load-bearing: /upload-replay is the app's primary flow behind server auth (src/app/upload-replay/page.tsx:18-20 r

---

### 14. [LOW] `src/components/SpotifySongCard.tsx:67` — correctness

**Claim.** `toggleExpanded` now reports collapse to the parent unconditionally, but the parent's handler clears `currentlyPlaying` without checking which card sent the event, so collapsing one card wipes the now-playing highlight off a different card.

**Failure.** Each card owns its own `isExpanded`, and expanding one does not collapse the others. Expand card 0 (`onPlayStateChange(true, 0)` → `currentlyPlaying = 0`), then expand card 1 (`currentlyPlaying = 1`, card 1 highlighted, card 0 still open). Now collapse card 0: it fires `onPlayStateChange(false, 0)` and the handler at SongRecommendations.tsx:380-382 runs `setCurrentlyPlaying(null)` regardless of `songIndex`, so card 1 loses its `border-foreground/25 bg-muted/30` highlight while still expanded and playing. The old one-directional call could not produce this.

**Suggested fix.** Make the parent index-aware: `} else { setCurrentlyPlaying((current) => (current === songIndex ? null : current)); }` in SongRecommendations.tsx:380-382.

**Verifier.** The mechanism is real and this commit did introduce it. SpotifySongCard.tsx:67 now calls `onPlayStateChange?.(!isExpanded, index)` unconditionally, where main only called it on expand. The parent handler at SongRecommendations.tsx:375-383 is byte-identical to main (verified with `git show ccd8681:src/components/SongRecommendations.tsx` — the `else { setCurrentlyPlaying(null) }` branch existed but was dead code), so the commit made an index-blind branch reachable. Cards are independent (`key={index}`, own `isExpanded`, nothing collapses siblings), so expand-0 -> expand-1 -> collapse-0 does clear card 1's highlight.

Severity is overstated, on three counts:

(1) The consequence is cosmetic and tiny. `isPlaying` is consumed at exactly one site, SpotifySongCard.tsx:97-100, adding `border-foreground/25 bg-muted/30`. That same element already carries `hover:border-foreground/25`, so half the "highlight" is identical to hover state; the actual observable loss is a `bg-muted/30` background wash. Playback is unaffected, the card stays expanded, and the Expand/Collapse button label reads from local `isExpanded` so it stays correct.

(2) The finding's framing ("still expanded and playing", "now-playing highlight") overstates what the state means. There is no Spotify iframe postMessage listener anywhere in src/ (grep for currentlyPlaying|onPlayStateChange|isPlaying returns only these two f

---

### 15. [LOW] `src/app/page.tsx:87` — design-system

**Claim.** Both hero cards put `rounded-lg` and a hover/focus border on a wrapper that has no `overflow-hidden`, while the full-bleed `<Image fill>` inside it and the `CardCurtainReveal` border inside that are both square — so the radius token is decorative and the corners visibly disagree.

**Failure.** The wrapper at line 87 (and its twin at line 171) is `rounded-lg border border-transparent hover:border-primary/50 focus-visible:ring-2`. Its only child is a plain `<div className="relative">` containing (a) `<div className="absolute inset-0 z-0">` with the image — no radius, no clipping — and (b) `<CardCurtainReveal className="... border border-border">` — `overflow-hidden` but no radius. Nothing clips to the wrapper's radius. At rest the card reads as a square hairline rectangle, so `rounded-lg` does nothing; on hover or keyboard focus a 0.75rem-rounded cobalt border (and a rounded focus ring) is drawn 1px outside a square grey border, with the image's square corners filling the gap the arc curves away from. This is the one place the audit doc says should be `rounded-xl`, and it is the one place radius has no effect at all.

**Suggested fix.** Move the radius onto the clipping element: put `rounded-xl overflow-hidden` on `CardCurtainReveal` (or on the inner `div.relative`) and keep `rounded-xl` on the wrapper so the hover border and focus ring follow the same curve.

**Verifier.** Partially confirmed, but the claim's core assertion is false and its severity is overstated.

CONFIRMED (measured in a headless browser against the dev server): the wrapper at src/app/page.tsx:87 (twin at :171) computes border-radius:12px, border-width:1px, overflow:visible, padding:0. Its child div.relative and the CardCurtainReveal inside compute border-radius:0px and sit flush in the padding box; nothing clips. On main (ccd8681) that wrapper was only `cursor-pointer transition-transform hover:scale-[1.01]`, so the radius, border and ring are introduced by THIS commit — not pre-existing. Pixel-sampling the hovered top-left corner at DPR 8 confirms a real artifact: the cobalt hairline runs along the top edge and stops ~7.2px short of the corner (where the 12px arc crosses inside the 1px padding box), then reappears on the left edge ~7.2px down. The positioned children (z-0 image, z-10 curtain) paint above the parent's border, so they overpaint the arc: the border corner does not close, and a square white/image corner protrudes through the gap.

WHERE THE CLAIM IS WRONG:
1. "the radius token is decorative... the one place radius has no effect at all" is demonstrably false. Computed focus style is `box-shadow: rgb(11,12,15) 0 0 0 2px, rgb(84,131,232) 0 0 0 4px` — an outer shadow painted entirely outside the border box, which follows the 12px radius and renders as a complete, uni

---

### 16. [LOW] `src/components/ui/input.tsx:13` — accessibility

**Claim.** Placeholder text was weakened from `text-muted-foreground` to `text-muted-foreground/70`, dropping it to 2.86:1 on `bg-surface` in light mode — a regression well below the 4.5:1 required for placeholder content.

**Failure.** Computed: `--muted-foreground` light hsl(224 12% 42%) at 0.70 alpha over `--surface` hsl(228 20% 95%) → 2.86:1 (dark: 3.95:1, also failing). Main used full-opacity `placeholder:text-muted-foreground`, which is 5.13:1 on surface. Concrete hit: the feedback form's 'What happened, and what did you expect instead?' placeholder (src/components/feedback/FeedbackWidget.tsx:381, rendered through textarea.tsx:12) is the only instruction telling a user what to type, and in light mode it is unreadable for low-vision users. Same defect at src/components/ui/textarea.tsx:12.

**Suggested fix.** Revert both to `placeholder:text-muted-foreground` (5.13:1 on surface, 5.52:1 on background). If a visual step-down from entered text is wanted, get it from `--muted-foreground` itself rather than an alpha that lands under threshold.

**Verifier.** I tried hard to break this one and could not break the arithmetic. What I could break is the claim's stated impact and half its scope, so it survives at reduced severity.

CONFIRMED (independently, not taken on faith):
1. The alpha actually applies. Colors in tailwind.config.ts:74 are declared as plain `hsl(var(--muted-foreground))` with no `<alpha-value>` placeholder, so my first hypothesis was that Tailwind would drop the `/70` modifier. It does not — compiled CSS at .next/static/css/app/layout.css:2151 emits `.placeholder\:text-muted-foreground\/70::placeholder { color: hsl(var(--muted-foreground) / 0.7); }`.
2. Live browser confirms it. I drove Playwright against the dev server at :3111 in light mode, opened the feedback widget, and read computed styles on `#feedback-message`: `::placeholder` color = `rgba(94, 101, 120, 0.7)`, opacity 1, over `background-color: rgb(240, 241, 245)`. Composited: rgb(137.8, 143.0, 157.5) on rgb(240,241,245) → 2.86:1. The reviewer's number is exact.
3. It is a regression from this commit, not pre-existing. Parent ccd8681 had `placeholder:text-muted-foreground` (full opacity) on `bg-background` with zinc tokens hsl(240 3.8% 46.1%) on hsl(0 0% 100%) = 4.83:1 (passing), dark 7.77:1. HEAD is 2.86:1 light / 3.95:1 dark. Both the alpha step-down and the token swap land on the wrong side of 4.5:1.

REFUTED — the claim's "concrete hit" is factually wro

---

### 17. [LOW] `src/app/replays/page.tsx:186` — copy

**Claim.** The rewritten visibility column collapses three states to two and labels an `unlisted` replay "Private" behind a lock icon — a regression, since the code it replaced rendered the real value.

**Failure.** A user picks "Unlisted" in the upload page select (`UploadReplayPage.tsx:322`, one of three offered values). On `/replays`, the ternary at lines 178-188 tests only `visibility === 'public'`, so their unlisted replay renders as a lock icon plus the word "Private". The DB row says `unlisted`, ballchasing.com holds it as unlisted, and anyone with the ballchasing link can open it. The diff shows the previous code was correct: `<TableCell className="capitalize">{replay.visibility}</TableCell>`. The same two-state assumption reaches `VisibilityToggle.tsx:101`, which tells the owner of an unlisted replay "Only you can see this replay." — also false.

**Suggested fix.** Render the third state: `visibility === 'public' ? Globe/"Public" : visibility === 'unlisted' ? Link2/"Unlisted" : Lock/"Private"`, and give VisibilityToggle an unlisted tooltip ("Anyone with the ballchasing.com link can see this replay.").

**Verifier.** Could not refute the core claim; it is verified. The diff for src/app/replays/page.tsx confirms the cell was `<TableCell className="capitalize">{replay.visibility}</TableCell>` and is now a two-branch ternary testing only `=== 'public'` (lines 178-188), so an `unlisted` row renders as Lock + "Private". The `unlisted` value is reachable with no normalization: UploadReplayPage.tsx:322 offers it (default 'public' at line 62), line 158 sends it, and api/upload-replay/route.ts:33 reads it raw and line 89 inserts it verbatim into replays.visibility (line 140 also forwards it to ballchasing). No SQL, migrations, generated DB types, or CHECK constraint exist in the repo that would reject it. So the regression is real and introduced by this commit.

Two corrections to the finding, both severity-reducing. (1) The VisibilityToggle half is substantially PRE-EXISTING, not introduced here: VisibilityToggle.tsx:29 (`useState(initialVisibility === 'public')`), :37 (`isPublic ? 'private' : 'public'`), and the Lock + "Private" label at :91-93 are all untouched by this diff — an unlisted replay's detail page already displayed "Private" before the redesign. The commit changed only the tooltip copy, and the prior off-state string was 'Make this replay visible in the public showcase', an imperative action label rather than a truth claim. So exactly one newly-false clause ("Only you can see this repl

---

## Refuted (a sample, recorded so they are not re-raised)

| Location | Claim | Why it was dropped |
|---|---|---|
| `src/components/SongRecommendations.tsx:105` | Every non-2xx recommendation response is now converted into one hardcoded "the service is asleep, wait thirty seconds" message, di | Refuted on three independent grounds.

(1) PRE-EXISTING, NOT INTRODUCED. `git show ccd8681:src/components/SongRecommendations.tsx` contains, at the same position, `if (!response.ok) { throw new Error( |
| `src/components/feedback/ContextualPrompt.tsx:1` | The new ABOUTME line names two situations the prompt can no longer appear in, because the same commit deleted the only call sites  | Overstated on the facts and prescribes a fix that would make the code worse.

WHAT IS TRUE: this commit did delete the only call sites for triggerReplayUploadSuccess/triggerErrorRecovery (ccd8681:src/ |
| `src/hooks/useContextualFeedback.ts:274` | The commit deleted the only call sites of `triggerReplayUploadSuccess` and `triggerErrorRecovery`, leaving ~35 lines of unreachabl | The deletion is a deliberate, pre-planned bug fix, and the finding's central load-bearing claim is factually false.

1. **It is prescribed by the plan, verbatim.** `/Users/rishabhsingh/personal/rocket |
| `src/components/PlayerStats.tsx:266` | The 31-line Chart.js `chartOptions` object is now byte-for-byte identical between PlayerStats.tsx:266-296 and ReplayStats.tsx:150- | The finding's causal claim is backwards: the duplication is pre-existing and this commit substantially REDUCED it.

Verified against the parent commit. On main (ccd8681), PlayerStats.tsx:193-228 and R |
| `src/components/ui/badge.tsx:18` | The `success` and `signal` badge variants added here have zero call sites, while their exact class strings are re-typed as raw cla | Refuted: the finding's mechanism is false at every load-bearing point, and its suggested fix would introduce a regression.

(1) The "dead" variants are not dead. src/lib/utils.ts:6 defines cn as twMer |
| `src/components/ui/card-curtain-reveal.tsx:12` | The motion vocabulary is declared once in tailwind.config.ts and then re-hardcoded as bare numeric literals in three JS files, wit | Refuted on four independent grounds.

1) NO DEFECT EXISTS TODAY — THE "FAILURE" IS A HYPOTHETICAL FUTURE EDIT. I checked the arithmetic: tailwind.config.ts:98-107 gives base 240ms / slow 400ms / entra |
