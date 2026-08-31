# ReplayRhythms — Adversarial Review of the Craft Redesign

Review of commit `6e47a1c` (branch `redesign/de-llm-ify`) against its parent `ccd8681`.

## How to read this

Six reviewers each took one lens. Every finding was then handed to a separate skeptic
instructed to refute it and to default to *refuted* when uncertain.

**The verification pass was cut short by an account spend limit.** Of 46 findings that
entered verification, 21 were judged and 25 verifiers were killed mid-run. Of the 21
judged, **17 were refuted as false and 4 survived**. That ~80% refutation rate is the
most important number here: the unverified findings below have not cleared that bar and
should be treated as leads to check, not as defects.

No finding in this document has been acted on. Nothing here is fixed.

---

## Verified findings (survived an adversarial skeptic)

These four were actively confirmed as real *and* caused by this commit.

### [MEDIUM] `src/app/replays/page.tsx:35` — correctness lens

**Claim.** The new `matchLabel` helper reads the team objects from `replay.metrics.blue` / `replay.metrics.orange`, but stored metrics nest teams under `metrics.teams.blue` / `metrics.teams.orange`, so the scoreline the commit set out to add never renders.

**Failure.** A replay with status 'ready' has `metrics` written by `extractMetrics()` (src/utils/extractMetrics.ts:64-145 and the writes at src/app/api/replay/[id]/route.ts:324-345), whose shape is `{ title, map_name, ..., teams: { blue, orange } }` — the same shape `replays/[id]/page.tsx:356-357` reads as `replay.metrics?.teams?.blue`. `replay.metrics?.blue?.name` is therefore always `undefined`, the guard fails, and the Match cell falls back to `replay.file_name`. Result: the column headed "Match" still shows the GUID filename (the exact defect docs/frontend-craft-audit.md:320 marks P0 and claims to fix), and for any replay whose metrics have no `map_name` (still processing, or a failed replay whose metrics is `{error, failure_reason}` per src/app/api/replay/[id]/route.ts:100 and :292) the sub-line at line 171 also falls back to `file_name`, so the same filename is printed twice in one cell. The bug was copied from the pre-existing `getGameSummary` at src/app/showcase/page.tsx:60, which the plan pointed at as a working reference.

**Suggested fix.** Read through `teams`: `replay.metrics?.teams?.blue?.name && replay.metrics?.teams?.orange?.name ? `${...teams.blue.name} ${...teams.blue.goals}–${...teams.orange.goals} ${...teams.orange.name}` : replay.file_name`. Fix `getGameSummary` in showcase/page.tsx the same way (or export one shared helper), and drop the `file_name` fallback from the sub-line so it renders nothing rather than repeating the primary label. This is worth a unit test — `Replay.metrics` is typed `any`, so tsc cannot catch the path.

**Verifier's note.** Confirmed real and introduced by this commit; only the severity is overstated.

Data shape: extractMetrics() (src/utils/extractMetrics.ts:64-145) nests teams under metrics.teams[team_color] via `for (const team_color of ['blue','orange'])` — no top-level blue/orange, and never any: the earliest committed version of the file already declared `teams: Record<string, TeamMetrics>`, so there is no legacy flat shape to rescue the read. Both writers persist that object verbatim (src/app/api/replay/[id]/route.ts:324,331,345; src/app/api/upload-replay/route.ts:201,206) and src/app/replays/page.tsx fetches raw rows with .from('replays').select('*'), so nothing reshapes it in between.

The repo's own type agrees: src/types/replay.ts:57-69 declares ReplayMetrics.teams: { blue: Team; orange: Team }. Replay.metrics is `any` (src/types/replay.ts:96), which is precisely why tsc stays clean over the wrong path. Every other consumer reads through teams: replays/[id]/page.tsx:356-357, ReplayStats.tsx:89-90,105, PlayerStats.tsx:202-203, SongRecommendations.tsx:55-60. Only showcase/page.tsx:60 (pre-existing) and the new replays/page.tsx:35 use the flat path. So `replay.metrics?.blue?.name` is undefined

---

### [MEDIUM] `src/components/ui/card.tsx:39` — simplicity lens

**Claim.** CardTitle's new default bakes in a small-caps eyebrow treatment (`text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`), which every call site that wants a real heading must partially undo — and two of them undo it incompletely.

**Failure.** src/app/login/page.tsx:49 has to write `className="text-foreground text-xl normal-case tracking-tight"` to cancel four of the five baked properties, which is the whole default minus `font-semibold`. src/components/UploadReplayPage.tsx:220 passes `className="text-2xl font-medium tracking-tight"` and does NOT cancel `uppercase` or `text-muted-foreground`, so after tailwind-merge the upload page's main heading renders as 24px all-caps muted-grey "UPLOAD A REPLAY". FeedbackWidget.tsx:326 (`className="text-lg"`) has the same residue. The default is shaped for the 8 stat-card eyebrows in ReplayStats/PlayerStats and wrong for the 3 heading uses.

**Suggested fix.** Return CardTitle to a neutral heading (`text-base font-semibold text-foreground`) and give the eyebrow treatment its own named component or a `variant="eyebrow"`, used by the stat cards. That removes the override at login/page.tsx:49 entirely and fixes the two incomplete overrides.

**Verifier's note.** I tried to refute this and could not; the mechanical evidence confirms it. Running the project's own cn() (tailwind-merge 2.6.0) against the new default at src/components/ui/card.tsx:39 and each override yields: UploadReplayPage.tsx:220 -> "uppercase text-muted-foreground text-2xl font-medium tracking-tight" and FeedbackWidget.tsx:326 -> "font-semibold uppercase tracking-[0.06em] text-muted-foreground text-lg". text-2xl and text-muted-foreground are in different tailwind-merge groups (font-size vs text-color) so the muted color is not displaced, and neither override contains a text-transform class so uppercase survives. Refutation angles all failed: (1) Not unreachable — /upload-replay is a real route (src/app/upload-replay/page.tsx:22) and that CardTitle is the ONLY heading on the app's primary action page. (2) Not pre-existing — this commit edited that exact line (text-2xl font-bold -> text-2xl font-medium tracking-tight) while simultaneously changing the shared default, without adding the cancellation. (3) Not intentional — the same commit writes "normal-case text-foreground" at src/app/login/page.tsx:49 on a sibling card heading, proving the author knew the cancellation was nee

---

### [MEDIUM] `src/components/UploadReplayPage.tsx:220` — goal lens

**Claim.** The upload page's only heading renders as 24px UPPERCASE muted grey, because the CardTitle override forgets the `normal-case` and `text-foreground` that the new CardTitle base style requires.

**Failure.** CardTitle's base is now `text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground` (src/components/ui/card.tsx:39). The override here is `text-2xl font-medium tracking-tight`. tailwind-merge resolves font-size and tracking but `uppercase` and `text-muted-foreground` are in groups nothing here touches, so "Upload a replay" ships as "UPLOAD A REPLAY" at 1.5rem in `--muted-foreground` — a shouted, de-emphasised title on the app's primary flow. src/components/feedback/FeedbackWidget.tsx:326 has the same bug (`text-lg` only) so the widget reads "TELL ME SOMETHING". src/app/login/page.tsx:49 is the only caller that remembered to add `normal-case` and `text-foreground`, which proves the trap.

**Suggested fix.** Either add `normal-case text-foreground` at UploadReplayPage.tsx:220 and FeedbackWidget.tsx:326, or better: stop making callers opt out. Keep CardTitle as the small uppercase label it now is and give headings that are page titles a real `<h2>` instead of a CardTitle.

**Verifier's note.** Could not refute; the defect is real and introduced by this commit. Verified with the repo's own tailwind-merge: cn('text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground', 'text-2xl font-medium tracking-tight') returns 'uppercase text-muted-foreground text-2xl font-medium tracking-tight' — uppercase (text-transform group) and text-muted-foreground (text-color group) survive because the override touches neither group. The built stylesheet (.next/static/css/fd8b61a23c16700e.css) confirms .uppercase{text-transform:uppercase}, .text-muted-foreground{color:hsl(var(--muted-foreground))}, .text-2xl{font-size:1.5rem}, .tracking-tight{letter-spacing:-.025em}; no rule in src/styles/globals.css touches text-transform. git diff ccd8681..HEAD -- src/components/ui/card.tsx shows this commit is what changed CardTitle's base from 'text-2xl font-semibold leading-none tracking-tight' to the small uppercase muted label, so the pre-existing override at UploadReplayPage.tsx:220 that used to be harmless now shouts. The page is the authenticated primary flow (/upload-replay) and grep for h1/h2/h3 in UploadReplayPage.tsx returns nothing, so that CardTitle is genuinely the only title. Fe

---

### [LOW] `src/components/UploadReplayPage.tsx:220` — correctness lens

**Claim.** This CardTitle call site was not updated for the component's changed default classes, so the upload page's main heading renders uppercase in muted grey.

**Failure.** card.tsx:39 now defaults to `text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`. This call site passes `text-2xl font-medium tracking-tight`, which are different tailwind-merge groups from `uppercase` and `text-muted-foreground`; verified with twMerge, the merged result is `uppercase text-muted-foreground text-2xl font-medium tracking-tight`. The page's primary heading therefore renders as "UPLOAD A REPLAY" at 24px in muted-foreground grey rather than foreground. The analogous heading at src/app/login/page.tsx:49 does add `text-foreground ... normal-case`, so the two equivalent card headings in the same commit disagree.

**Suggested fix.** Match the login page: `className="text-foreground text-2xl font-medium normal-case tracking-tight"` — or, if page-level headings inside cards are meant to be common, add a `heading` variant to CardTitle rather than resetting four utilities per call site.

**Verifier's note.** Could not refute; the defect is real and introduced by this commit, but medium overstates it.

VERIFIED REAL: Running the project's own tailwind-merge@2.6.0 (src/lib/utils.ts:6, cn = twMerge(clsx(inputs))) on card.tsx:39's new base 'text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground' plus UploadReplayPage.tsx:220's 'text-2xl font-medium tracking-tight' yields 'uppercase text-muted-foreground text-2xl font-medium tracking-tight'. uppercase (text-transform) and text-muted-foreground (text-color) are in different merge groups from anything the call site passes, so they survive. I cross-checked the merge model against the live app: the rendered /login CardTitle node carries exactly 'font-semibold text-foreground text-xl normal-case tracking-tight', matching my offline twMerge output for that call site.

CAUSED BY THIS COMMIT: git show ccd8681:src/components/ui/card.tsx had CardTitle defaulting to 'text-2xl font-semibold leading-none tracking-tight'; UploadReplayPage.tsx had className="text-2xl font-bold". The commit changed the default AND edited this exact call site to 'text-2xl font-medium tracking-tight' without adding the resets, while src/app/login/page.tsx:49

---

## Unverified findings (verifier killed by the spend limit)

Raw reviewer output, grouped by lens. Not adjudicated. Expect false positives at roughly
the rate seen above.

### Lens summary

The design system itself is coherent, but it is declared in more places than it is consumed: four radius/easing tokens are defined and never used, the badge `success`/`signal` variants are added and never used while their exact class strings are hand-typed in three other files, the motion vocabulary lives once in tailwind.config.ts and again as bare literals in three JS files, and the palette lives once in globals.css and again as eight HSL triples in chartColors.ts. Separately, the commit rewrote PlayerStats and ReplayStats side by side and left two blocks byte-for-byte identical between them (a 31-line chart options object and a 14-line empty state), and added a `matchLabel` helper that duplicates showcase's `getGameSummary` with a different separator. The one behavioural leftover worth flagging is that deleting UploadReplayPage's two feedback trigger calls stranded roughly 35 lines of unreachable trigger config — including copy this same commit rewrote.

| Severity | Location | Claim |
|---|---|---|
| high | `src/hooks/useContextualFeedback.ts:274` | The commit deleted the only call sites of `triggerReplayUploadSuccess` and `triggerErrorRecovery`, leaving ~35 lines of unreachable trigger config, callbacks and exports behind — including copy the same commit rewrote. |
| medium | `src/components/PlayerStats.tsx:266` | The 31-line Chart.js `chartOptions` object is now byte-for-byte identical between PlayerStats.tsx:266-296 and ReplayStats.tsx:150-180, both rewritten by this commit, with no shared helper. |
| medium | `src/components/ui/badge.tsx:18` | The `success` and `signal` badge variants added here have zero call sites, while their exact class strings are re-typed as raw classNames in three other places the same commit wrote. |
| medium | `src/components/ui/card-curtain-reveal.tsx:12` | The motion vocabulary is declared once in tailwind.config.ts and then re-hardcoded as bare numeric literals in three JS files, with no shared export, so the CSS and JS halves of the same system can drift. |
| medium | `src/utils/chartColors.ts:28` | getTeamColors and getChartInk hardcode eight HSL triples that are verbatim copies of tokens in globals.css, contradicting that file's own instruction to never write colour values in components. |
| medium | `src/components/ui/card.tsx:39` | CardTitle's new default bakes in a small-caps eyebrow treatment (`text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`), which every call site that wants a real heading must partially undo — and two of them undo it incompletely. |
| medium | `src/components/ReplayStats.tsx:45` | A label/value stat pair is hand-written ten times in this one file with the same class strings, and its label treatment is a fourth, slightly different spelling of the eyebrow style the commit also baked into Label, CardTitle and TableHead. |
| medium | `src/app/replays/page.tsx:34` | The new `matchLabel` helper duplicates the existing `getGameSummary` in showcase/page.tsx, and the two disagree on the separator, so the same replay reads differently on the two lists. |
| low | `src/components/PlayerStats.tsx:185` | The 14-line "ballchasing has not returned stats yet" empty-state Card is byte-for-byte identical in PlayerStats.tsx:185-198 and ReplayStats.tsx:72-85, both authored by this commit. |
| low | `src/styles/globals.css:33` | Four tokens introduced by this commit are defined and wired but never consumed: `--radius`, `--radius-xs`/`rounded-xs`, `--radius-xl`/`rounded-xl`, and `ease-exit`. |
| low | `src/components/ShowcaseButton.tsx:26` | Six of the ten utilities on this Button restate the component's own defaults or are stacking-context leftovers from the deleted sparkle/glow layers, and `transition-colors` quietly cancels the base transition the same commit added. |
| low | `src/components/SpotifySongCard.tsx:187` | Two Badge call sites pass a `variant` whose entire visual output is then overwritten by a className, so the variant prop is dead and `isMatchedCriteria` runs twice per badge. |
| low | `src/components/PlayerStats.tsx:389` | `tabular-nums` is passed as a className on TableCell children in three places even though the same commit baked `tabular-nums` into TableCell's own base classes. |
| low | `src/styles/globals.css:1` | The ABOUTME line claims this file defines elevation tokens; it defines none, and elevation is consequently spelled three incompatible ways across the diff. |
| low | `src/messages/en.json:3` | Three message keys are left in the catalogue with freshly-written copy that nothing renders, after the commit removed their only consumers. |

### Lens summary

The commit fixed the loudest tells — the rainbow gradient headline, the orbiting sparkles, the fade-up gate on above-the-fold content, the "Our AI analyzes your gameplay patterns" copy — and the token layer is genuinely chosen rather than generated (a hue-wandering neutral ramp, one cobalt, one boost-orange mapped to the game's own team system, no decimal saturations, a real display face with a width axis, an audio-meter spinner instead of a spinning Loader2). Protect all of that. But the redesign stopped at the token file and the landing page. Everything a signed-in user actually looks at is still generator output: eleven copies of the same centred icon → heading → muted paragraph → one button terminal state, a stat tile hand-copied eleven times inside `ReplayStats.tsx` alone, a 2×4 grid of decorative lucide icons and three copy-pasted `/100` centred stat blocks in `SongRecommendations.tsx`, six different `<h1>` treatments across ten pages, and a five-step radius scale of which two steps are never used. Worse, the new system is partly dead on arrival: the container padding ramp emits no CSS at all, `ease-exit` is used zero times, and only one of five Radix overlay layers got the motion vocabulary. The landing page and the app also disagree about where the left edge is by 144px. (Note: I judged from source and the built CSS — the dev server at :3111 404s every JS/CSS chunk because a production `next build` at 01:35 overwrote the `.next` the dev server was serving from.)

| Severity | Location | Claim |
|---|---|---|
| high | `src/app/page.tsx:49` | The landing page, the interior pages and the navbar/footer each use a different content container, so the app has three different left edges and the wordmark never lines up with the page heading. |
| high | `src/components/UploadReplayPage.tsx:220` | The upload page's only heading renders as 24px UPPERCASE muted grey, because the CardTitle override forgets the `normal-case` and `text-foreground` that the new CardTitle base style requires. |
| high | `src/app/replays/page.tsx:134` | Eleven separate copies of the identical centred "lucide icon → heading → muted paragraph → one button" terminal state — the single most recognisable shadcn/LLM template in the app, and the commit rewrote the copy inside every one of them without ever questioning the shape. |
| high | `src/components/SongRecommendations.tsx:260` | The recommendations profile — the app's payoff screen — is a 2×4 grid of decorative lucide icons over a row of three copy-pasted centred `/100` stat blocks: the exact symmetric-feature-grid signature the commit set out to remove. |
| high | `src/app/page.tsx:149` | The landing page promises "get a playlist", a capability the app does not have — the same class of fabrication as the "Featured" badge this commit removed for meaning `index < 3`. |
| medium | `tailwind.config.ts:17` | The responsive container padding ramp this commit added emits no CSS whatsoever, and the change net-shrinks every page gutter from 2rem to 1rem. |
| medium | `src/components/ui/dropdown-menu.tsx:50` | The motion vocabulary reached one of five overlay layers; `ease-exit` — which the plan calls "the single most human decision in a motion system" — is used zero times in the codebase. |
| medium | `src/components/ReplayStats.tsx:43` | One label-over-value stat tile is hand-copied eleven times across three symmetric grids in a single file, which is both the duplication and the "identical stat cards in a row" look the redesign was supposed to break. |
| medium | `src/components/ReplayStats.tsx:229` | The map name is typeset as a statistic — `text-3xl font-bold truncate` in the same three-up grid slot as two numbers — so a string gets number weight and is then clipped. |
| medium | `src/components/ShowcaseButton.tsx:19` | The only hover-scale in the app, on a spring, wrapping a single Button — plus a meaningless Eye→TrendingUp icon crossfade — directly contradicting the motion vocabulary the commit just established. |
| medium | `src/app/replays/page.tsx:96` | Six different `<h1>` treatments across ten pages, so the type scale the commit introduced is never actually the thing that decides how a page title looks. |
| medium | `src/styles/globals.css:33` | The five-step radius scale ships as three near-identical steps: `rounded-xs` and `rounded-xl` are used zero times, and `--radius` duplicates `--radius-sm` exactly. |
| low | `public/llms.txt:13` | "personalized" — a word the plan lists as banned with no exceptions — survives in the file the commit edited specifically because it is what other AI systems quote about the product. |
| low | `src/app/page.tsx:126` | Two decorative circular icon buttons on the hero cards that are hidden from assistive tech and unreachable by keyboard, duplicating a click target the whole card already provides. |

### Lens summary

The redesign is mostly mechanical class swaps that are hard to get wrong, and the risky mechanical changes (routes, theme reads, searchParams promises, chart theming, AnimatePresence placement) all check out: every route referenced by router.push/Link exists, the deleted CurtainRevealButton/form.tsx/language-switcher have no remaining importers, no component uses the removed accordion keyframes, and the Supabase client singleton keeps the new useCallback/useEffect pairs from looping. The real defects are where new logic was written rather than restyled: the new `matchLabel` helper reads the wrong metrics path so the replays table's headline feature silently does nothing, the recommendation client now swallows every server error message in favour of one wrong explanation, and the SpotifySongCard play-state change made the parent's index-blind handler reachable. One call site (UploadReplayPage's CardTitle) did not follow the changed component contract that the login page did follow.

| Severity | Location | Claim |
|---|---|---|
| high | `src/app/replays/page.tsx:35` | The new `matchLabel` helper reads the team objects from `replay.metrics.blue` / `replay.metrics.orange`, but stored metrics nest teams under `metrics.teams.blue` / `metrics.teams.orange`, so the scoreline the commit set out to add never renders. |
| medium | `src/components/SongRecommendations.tsx:105` | Every non-2xx recommendation response is now converted into one hardcoded "the service is asleep, wait thirty seconds" message, discarding the API route's own status-specific `error` body — including the 504 and 400 messages this same commit wrote. |
| medium | `src/components/UploadReplayPage.tsx:220` | This CardTitle call site was not updated for the component's changed default classes, so the upload page's main heading renders uppercase in muted grey. |
| medium | `src/components/SpotifySongCard.tsx:67` | `toggleExpanded` now reports collapse to the parent unconditionally, but the parent's handler clears `currentlyPlaying` without checking which card sent the event, so collapsing one card wipes the now-playing highlight off a different card. |
| low | `src/components/feedback/ContextualPrompt.tsx:1` | The new ABOUTME line names two situations the prompt can no longer appear in, because the same commit deleted the only call sites that trigger them, leaving two hook triggers and two trigger configs unreachable. |
| low | `src/components/feedback/FeedbackWidget.tsx:292` | The newly added localStorage read and write are unguarded, and this component is mounted in the root layout inside the app-wide ErrorBoundary, so a storage exception replaces every page with the error fallback. |

### Lens summary

The palette migration itself is genuinely complete: outside the two image-scrim hero cards (where `text-zinc-*` and a `mix-blend-difference` `bg-zinc-50` curtain are legitimately theme-independent) there is not a single raw Tailwind hue left in src/, no hex outside the Google logo SVG, no `dark:` colour variants, and `:root`/`.dark` declare exactly the same colour set. Where it falls down is adoption rather than declaration: the commit added `success`/`signal` badge and alert variants that nothing uses while StatusBadge and SpotifySongCard hand-write the same treatments inline (producing a chip whose label goes illegible on hover), applied only three of the five declared radius steps so the hero cards' `rounded-lg` clips nothing at all, and left `--radius`, `--signal-foreground` and the entire chart palette outside the token system. The stated accent rule is also inverted where it matters most: the now-playing song card signals selection with `--foreground` while its decorative chips get `--primary`.

| Severity | Location | Claim |
|---|---|---|
| high | `src/components/SpotifySongCard.tsx:187` | A matched "theme" chip is given `variant="default"` (whose cva string carries `hover:bg-primary/80`) and then has its resting fill overridden to `bg-primary/15 text-primary`, so on hover the fill jumps to 80%-opaque cobalt while the text stays cobalt — the chip's own label becomes unreadable. |
| medium | `src/app/page.tsx:87` | Both hero cards put `rounded-lg` and a hover/focus border on a wrapper that has no `overflow-hidden`, while the full-bleed `<Image fill>` inside it and the `CardCurtainReveal` border inside that are both square — so the radius token is decorative and the corners visibly disagree. |
| medium | `src/components/UploadReplayPage.tsx:220` | CardTitle's base was changed to an eyebrow style (`text-sm font-semibold uppercase tracking-[0.06em] text-muted-foreground`), and this call site overrides only size/weight/tracking — so the upload page's only heading renders as 24px UPPERCASE muted grey, while the sibling login page opts out of exactly those two declarations. |
| medium | `src/components/SpotifySongCard.tsx:168` | Matched moods and matched themes express the identical "matched" semantic with two different visuals (solid cobalt vs 15% cobalt tint) sitting in the same flex row, and both hand-write treatments that badge.tsx already defines as variants. |
| medium | `src/components/StatusBadge.tsx:38` | The `success` and `signal` variants this commit added to badge.tsx (lines 18-19) and the `signal` variant added to alert.tsx (line 17) have zero call sites, while StatusBadge — the natural consumer — hand-rolls the same treatment on `variant="outline"` with a ring instead of a border. |
| medium | `src/utils/chartColors.ts:26` | All eight palette values are duplicated as literal `hsla()` strings, so globals.css is no longer the single source of truth it claims to be in its own file header, and the justification comment for doing so is factually wrong. |
| medium | `src/components/SpotifySongCard.tsx:99` | The "currently playing" selected state is styled with `--foreground`, not `--primary`, and its border class is byte-identical to the card's own hover class — so a hovered card is indistinguishable from the playing card. |
| medium | `src/components/ShowcaseButton.tsx:26` | The className restates the whole `default` Button variant verbatim, and its `transition-colors` silently replaces the Button base's `transition-[…,transform]`, disabling the design system's press affordance on the home page's only primary CTA. |
| low | `src/styles/globals.css:33` | Three of the tokens the commit introduced are never consumed: `--radius` has no reference anywhere and no `borderRadius.DEFAULT` mapping, `rounded-xs`/`rounded-xl` (both ends of the new scale) have zero call sites, and `--signal-foreground` (lines 26/63) has no possible consumer. |
| low | `tailwind.config.ts:88` | `--overlay` is the only colour token in globals.css not registered in the Tailwind colour map, so all six consumers must hand-write arbitrary values — in three different spellings — and three floating panels skip the token entirely for `shadow-black/40`. |
| low | `src/utils/chartColors.ts:59` | The comment asserts "Blue is the user's own team (--primary), orange is the opponent (--signal)", but the code maps purely by team side and has no knowledge of which side the viewer played on — so for half of all users the accent rule is inverted. |

### Lens summary

_(no summary returned)_

| Severity | Location | Claim |
|---|---|---|
| critical | `src/messages/en.json:6` | The Pro upgrade button now promises "unlimited replays", a benefit the codebase does not gate — nothing anywhere counts or limits replays, so the paid claim is false. |
| high | `src/app/page.tsx:149` | The landing card caption promises "get a playlist" — the exact playlist-creation claim the audit deleted from this same page because `src/app/api/spotify/` contains only `auth/` and `track/`. |
| high | `src/app/page.tsx:115` | The commit introduced 13 rhetorical em dashes into user-facing copy after explicitly writing "The repo currently has zero em dashes in user-facing copy. Keep it that way" — reinstating the most recognisable machine-writing tell in a change whose purpose is removing them. |
| high | `src/app/replays/page.tsx:186` | The rewritten visibility column collapses three states to two and labels an `unlisted` replay "Private" behind a lock icon — a regression, since the code it replaced rendered the real value. |
| high | `src/app/error/page.tsx:18` | The rewritten error copy asserts exactly two causes as exhaustive, but four distinct failures route to `/error`; for two of them both stated causes are wrong and the prescribed next click does not help. |
| high | `public/llms.txt:21` | The commit edited llms.txt but rewrote only its first line, leaving a banned word and the same false playlist promise it deleted from the landing page, on a file published at /llms.txt specifically for machines to quote. |
| high | `src/components/SongRecommendations.tsx:105` | One hardcoded sentence claiming the recommender is asleep is thrown for every non-ok response, so users are told a cause the code never determined — and it makes the server's own two rewritten error strings dead copy that can never render. |
| medium | `src/app/replays/[id]/page.tsx:245` | The processing checklist labels DB status `uploaded` "Uploaded to ballchasing.com", which is the one thing that status means has NOT happened yet, and it contradicts StatusBadge, which calls the identical status "Queued". |
| medium | `src/app/replays/[id]/page.tsx:225` | Raw thrown messages are still rendered to players in three rewritten error states, the exact defect the audit named ("Players get shown 'Failed to fetch'. Keep the raw message in the existing console.error") and only half-fixed. |
| medium | `src/components/SongRecommendations.tsx:136` | Three toasts still use the bare title "Error" — the pattern the commit deleted as `<AlertTitle>Error</AlertTitle>` and as the `Error` heading elsewhere — and here the description duplicates a message already rendered on screen. |
| medium | `src/components/UploadReplayPage.tsx:196` | The upload error copy written for connection failures sits in the one branch a connection failure can never reach, so users who lose their connection see the browser's raw string instead. |
| medium | `src/app/api/upload-replay/route.ts:27` | Two of the five user-facing strings in this route were rewritten and three were left, including a bare HTTP status word and a raw exception passthrough, both of which render verbatim in the upload page's error Alert. |
| medium | `src/app/replays/[id]/layout.tsx:8` | The one route metadata the commit did not fix still doubles the brand against the root layout's title template, and is Title Case besides. |
| medium | `src/components/UploadReplayPage.tsx:335` | Four surfaces written by this commit quote four different durations for the same ballchasing.com wait. |
| medium | `src/app/auth/auth-code-error/page.tsx:22` | The button reads "Sign in with Google" but is a plain link to `/login`; it does not start a Google sign-in, and the page states a cause the code explicitly discarded. |
| medium | `src/app/page.tsx:193` | Title Case survives in the two landing hero card titles and across the replays route, contradicting rule 3 and the sentence-case labels the commit wrote three lines away. |
| low | `src/components/navbar/navbar.tsx:59` | The replays destination is named three different things on the three surfaces that link to it, the defect the audit itself cited as the reason to rename "Go to Home". |
| low | `src/components/ReplayStats.tsx:76` | The two empty states the commit wrote render the data source as "Ballchasing", while the other eleven mentions across the app use "ballchasing.com" — the form rule 3 names as the proper noun. |
| low | `src/components/VisibilityToggle.tsx:53` | The success toast's description restates its title in longer words — the pattern rule 2 bans — in the same handler whose error toast the commit rewrote for exactly that reason. |
| low | `src/components/SpotifySongCard.tsx:119` | The song header renders an unlabelled adjective ladder — "128 BPM • High" — and can ship the placeholder "N/A" the commit removed elsewhere. |
| low | `src/components/error-boundary.tsx:60` | The new error-boundary copy claims the Sentry event ID "says exactly what broke" — it is an opaque hex handle that says nothing to the reader, and it is conditionally rendered so it may not be below at all. |
| low | `src/components/feedback/QuickFeedback.tsx:76` | The quick-feedback confirmation renders the identical sentence twice at once, in a card and a toast stacked in the same screen corner. |
| low | `src/components/ReplayStats.tsx:235` | Two different bullet characters separate inline facts, one of them twice in this single file. |

### Lens summary

The palette's core ramp is sound — I ran the numbers and `--muted-foreground` clears 4.5:1 everywhere it lands (5.52/5.81/5.13 light on background/card/surface, 7.23/6.70/6.85 dark), `--primary-foreground` on `--primary` is 6.45/5.27, `--destructive-foreground` on `--destructive` is 5.44/4.63, and the zinc text on the `--overlay` image scrims sits in the alpha≈1.0 region at 11–16:1, so none of those are problems. The failures cluster in three places the commit deliberately introduced: the new translucent focus system (`ring-ring/45` at 2.07:1 light / 1.97:1 dark, plus `outline-none` removing the fallback, and the global `ring/0.6` outline at 2.74/2.63 — all under the 3:1 focus-indicator floor and strictly worse than main's full-opacity ring), the chromatic tint recipe (`text-signal` at 4.36:1 on card in light and 3.57:1 in its chip, mirrored by `text-primary` at 4.17:1 in dark tints across StatusBadge, getCategoryColor and the team chips), and the weakened `placeholder:text-muted-foreground/70` at 2.86:1. Separately, the two accessibility affordances the audit doc promised are only half-delivered: the curtain's `onFocus`/`onBlur` handlers can never fire because the focusable element is an ancestor, and `reducedMotion="user"` misses `clipPath`, so the signature wipe still plays for reduced-motion users.

| Severity | Location | Claim |
|---|---|---|
| high | `src/components/ui/button.tsx:8` | Every Button kills its native outline (`focus-visible:outline-none`) and replaces it with a 3px ring at 45% alpha, which composites to 2.07:1 (light) / 1.97:1 (dark) against the surface behind it — below the 3:1 WCAG 2.2 SC 1.4.11/2.4.11 minimum for a focus indicator, and a regression from main. |
| high | `src/styles/globals.css:101` | The new global focus outline `2px solid hsl(var(--ring) / 0.6)` measures 2.74:1 (light) / 2.63:1 (dark) against the page background — below the 3:1 required for a focus indicator, so every control that relies on this fallback has an invisible-to-low-vision focus state. |
| high | `src/components/ui/card-curtain-reveal.tsx:60` | The `onFocus`/`onBlur` keyboard fix added to CardCurtainReveal never fires, because the only focusable element on the landing hero is the `role="button"` div that WRAPS this component and focus events do not propagate downward — so the hero copy stays invisible to keyboard and touch users, exactly the defect docs/frontend-craft-audit.md:238 claimed to fix. |
| high | `src/utils/chartColors.ts:68` | `TEAM_CLASSES.orange` renders opponent-team text in `text-signal`, which measures 4.36:1 on `--card` in light mode as plain text and 3.57:1 inside the `bg-signal/15` chip — both below the 4.5:1 body-text minimum, and none of the sites using it qualify as large text. |
| medium | `src/components/ui/input.tsx:13` | Placeholder text was weakened from `text-muted-foreground` to `text-muted-foreground/70`, dropping it to 2.86:1 on `bg-surface` in light mode — a regression well below the 4.5:1 required for placeholder content. |
| medium | `src/components/StatusBadge.tsx:38` | The rewritten status chips use `text-primary` on `bg-primary/10`–`/15` tints, which measure 4.17:1 and 4.47:1 on `--card` in dark mode — under 4.5:1 for the 11px badge text. |
| medium | `src/components/SongRecommendations.tsx:151` | `getCategoryColor` was rewritten onto primary tints that measure 3.87:1 and 3.88:1 on `--card` in dark mode for the high/excellent and medium/good categories — both under 4.5:1 for the 11px badge text they colour. |
| medium | `src/components/ui/card-curtain-reveal.tsx:10` | `prefers-reduced-motion` does not suppress the curtain wipe: `clipPath` is not in motion's `positionalKeys`, so `MotionConfig reducedMotion="user"` leaves it animating, and the CSS block in globals.css only overrides CSS `animation-duration`/`transition-duration`, which never touches motion's JS-driven animations. |
| medium | `src/components/feedback/ContextualPrompt.tsx:86` | Both dismiss buttons in the re-authored ContextualPrompt are icon-only with no accessible name, so a screen reader announces them as bare 'button' (WCAG 4.1.2) — even though this same commit went through the codebase adding `aria-label` to the other icon-only feedback buttons. |
| low | `src/styles/globals.css:25` | The `--signal` / `--signal-foreground` pair the commit defines and exposes as a Tailwind colour is itself a failing combination in light mode: white on hsl(20 84% 44%) is 4.36:1, below 4.5:1 for body text. |

---

## Refuted findings (a sample, kept so they are not re-raised)

| Location | Claim | Why it was dropped |
|---|---|---|
| `src/components/SongRecommendations.tsx:105` | Every non-2xx recommendation response is now converted into one hardcoded "the service is asleep, wait thirty seconds" message, discarding the API rou | The finding attributes to this commit a control flow that is verbatim pre-existing. On the parent (ccd8681), src/components/SongRecommendations.tsx had `if (!response.ok) { throw new Error(`API request failed: ${response |
| `src/components/SpotifySongCard.tsx:67` | `toggleExpanded` now reports collapse to the parent unconditionally, but the parent's handler clears `currentlyPlaying` without checking which card se | The reviewer read the call graph correctly — `toggleExpanded` (SpotifySongCard.tsx:64-68) now fires `onPlayStateChange?.(!isExpanded, index)` in both directions, and the parent's `else` branch does run `setCurrentlyPlayi |
| `src/components/feedback/ContextualPrompt.tsx:1` | The new ABOUTME line names two situations the prompt can no longer appear in, because the same commit deleted the only call sites that trigger them, l | The finding's raw facts check out, but the defect it alleges does not survive contact with the code.

**What I confirmed.** `src/components/feedback/ContextualPrompt.tsx:1` was rewritten by this commit (parent read `// A |
| `src/hooks/useContextualFeedback.ts:274` | The commit deleted the only call sites of `triggerReplayUploadSuccess` and `triggerErrorRecovery`, leaving ~35 lines of unreachable trigger config, ca | The claim's one true fact (the commit removed both call sites) is wrapped in a wrong diagnosis, a factually false central sub-claim, and a suggested fix that would cause a regression.

1) The removal was deliberate and f |
| `src/components/PlayerStats.tsx:266` | The 31-line Chart.js `chartOptions` object is now byte-for-byte identical between PlayerStats.tsx:266-296 and ReplayStats.tsx:150-180, both rewritten  | Pre-existing condition that this commit measurably improved, not a defect it introduced.

1. The duplication predates the commit. On main (ccd8681), `git show ccd8681:src/components/PlayerStats.tsx \| sed -n '193,228p'` v |
| `src/components/ui/badge.tsx:18` | The `success` and `signal` badge variants added here have zero call sites, while their exact class strings are re-typed as raw classNames in three oth | The only true part is the bare fact that `Badge` variants `success`/`signal` have no call sites. Every consequence the finding draws from that is wrong, and I verified each one.

**1. The "dead variant" attribute is empi |
