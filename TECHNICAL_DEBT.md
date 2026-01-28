# Technical Debt & Code Quality Issues

Comprehensive audit of ReplayRhythms codebase. Issues categorized by severity and area.

---

## 🚨 CRITICAL ISSUES (Security & Breaking Bugs)

### 1. XSS Vulnerability in Resume Tracking
**File**: `/src/app/api/track-resume-visit/route.ts:40-45`
**Issue**: User data (IP, userAgent, referrer, path, email) directly embedded in HTML without escaping
```typescript
html: `<h2>Visitor Information</h2>
  <p>Email: ${visitorData.email}</p>
  <p>IP: ${visitorData.ip}</p>
  ...`
```
**Risk**: Attackers can inject malicious scripts via User-Agent header
**Fix**: Use HTML escaping library or template engine

---

### 2. Open Redirect Vulnerabilities
**Files**:
- `/src/app/auth/callback/route.ts:10` - `next` parameter not validated
- `/src/app/auth/confirm/route.ts:11` - `next` parameter not validated

**Issue**: Redirects to user-supplied URLs without validation
```typescript
const next = searchParams.get('next') ?? '/';
return NextResponse.redirect(`${origin}${next}`)  // Could be //../attacker.com
```
**Risk**: Phishing attacks, credential theft
**Fix**: Whitelist allowed redirect paths or validate against same-origin

---

### 3. Path Traversal in Replay URL Generation
**File**: `/src/app/api/get-replay-url/route.ts:31`
**Issue**: Insufficient path validation
```typescript
if (!filePath.startsWith(user.id + '/')) {
  // Bypass: if user.id contains '/', path check fails
  // No check for '../' sequences
}
```
**Risk**: Access to other users' replay files
**Fix**: Normalize paths, reject `../`, validate user ID format

---

### 4. Memory Leak in useToast Hook
**File**: `/src/components/ui/use-toast.ts:178`
**Issue**: Effect dependency on `state` causes listener accumulation
```typescript
React.useEffect(() => {
  listeners.push(setState);
  return () => { listeners.splice(...) };
}, [state]);  // Should be []
```
**Risk**: Memory grows indefinitely, app slows down over time
**Fix**: Change dependency array to `[]`

---

### 5. Environment Variables Not Validated
**File**: `/src/env.mjs:3-4`
**Issue**: Marked as TODO, incomplete validation
```typescript
// TODO: THIS IS OLD, NOT USED. UPDATE THE ENVIRONMENT VARIABLES
```
**Missing**: SUPABASE_URL, SUPABASE_ANON_KEY, PYTHON_API_URL, SPOTIFY_CLIENT_SECRET, SENTRY_DSN
**Risk**: Runtime crashes if env vars missing
**Fix**: Complete the Zod validation schema

---

### 6. Hardcoded Sentry DSN in Source
**Files**: `sentry.server.config.ts:8`, `sentry.edge.config.ts:8`
**Issue**: DSN hardcoded as fallback
```typescript
dsn: process.env.SENTRY_DSN ||
  'https://23ae53ee49708...@o4509433100959744.ingest.de.sentry.io/4509503680151632'
```
**Risk**: Configuration should never be hardcoded in source
**Fix**: Require env var, fail fast if missing

---

### 7. PII Collected Without Consent (GDPR Risk)
**File**: `/src/middleware.ts:36-72`
**Issue**: Visitor metadata collected and stored in cookies
- IP address
- User agent
- Email
- Browsing path
- Stored 7 days without consent

**Risk**: GDPR/CCPA violations, legal liability
**Fix**: Add consent mechanism or remove tracking

---

### 8. Stripe Webhook Silent Failures
**File**: `/src/app/api/webhooks/stripe/route.ts:92-94, 125-127, 142-144`
**Issue**: Database errors logged but webhook returns 200 OK
```typescript
} catch (error) {
  console.error('Database error updating subscription:', error);
  // Webhook still returns 200, Stripe won't retry
}
```
**Risk**: Lost subscription data, payment/access mismatch
**Fix**: Return 500 on database errors so Stripe retries

---

## ⚠️ HIGH PRIORITY (Non-Deterministic Behavior)

### 9. Race Condition in Ballchasing Polling
**File**: `/src/app/api/replay/[id]/route.ts:90`
**Issue**: Multiple concurrent requests all call ballchasing.com API
```typescript
if (processingTime > 2 * 60 * 1000) {
  // All concurrent requests hit this and call checkBallchasingStatus()
}
```
**Risk**: Rate limiting by ballchasing.com, inconsistent status
**Fix**: Use database lock or single poller process

---

### 10. No Timeout on External API Calls
**Files**:
- `/src/app/api/recommendations/route.ts:19` - Python API fetch
- `/src/app/api/spotify/track/route.ts:40,57` - Spotify API fetch
- `/src/app/api/upload-replay/route.ts:136` - Ballchasing upload

**Issue**: No AbortController or timeout, serverless can hang
**Risk**: Serverless function timeout, poor UX, resource waste
**Fix**: Add AbortController with reasonable timeout (10-30s)

---

### 11. Fire-and-Forget Ballchasing Upload
**File**: `/src/app/api/upload-replay/route.ts:111-185`
**Issue**: Async operation not awaited, serverless may terminate early
```typescript
// Response returned before this completes
(async () => {
  // ballchasing upload logic
})();
```
**Risk**: Uploads fail silently, status stuck in "processing"
**Fix**: Use background job queue (or at minimum, await the operation)

---

### 12. Unhandled Async State Updates
**File**: `/src/components/SongRecommendations.tsx:57-108`
**Issue**: No AbortController for fetch, no cleanup on unmount
```typescript
const generateRecommendations = async (...) => {
  setLoading(true);
  const response = await fetch(...);  // No abort
  setRecommendations(data);  // setState on unmounted component
};
```
**Risk**: Memory warning, potential crash
**Fix**: Add AbortController, cleanup in useEffect

---

### 13. Duplicate Timestamp Filenames
**File**: `/src/app/api/upload-replay/route.ts:51`
**Issue**: `new Date().getTime()` for filename
```typescript
const fileName = `${file.name.replace('.replay', '')}_${new Date().getTime()}.replay`;
```
**Risk**: High-concurrency uploads get same timestamp
**Fix**: Use UUID or add random suffix

---

## 🔶 MEDIUM PRIORITY (Type Safety & Validation)

### 14. Widespread `any` Types
**Files**:
- `/src/app/api/replay/[id]/route.ts:207,322` - Function parameters typed as `any`
- `/src/types/spotify.ts:20,28` - `game_outcome: any`, `desired_song_profile: any`
- `/src/components/SongRecommendations.tsx:24` - `replayData: any`
- `/src/components/PlayerStats.tsx:244` - `getValueByPath(obj: any, ...)`

**Risk**: Runtime type errors, no IDE help
**Fix**: Create proper interfaces for all data structures

---

### 15. Missing Input Validation
**Files**:
- `/src/app/api/upload-replay/route.ts:32` - Visibility not validated against enum
- `/src/app/api/upload-replay/route.ts:42` - No file size limit check
- `/src/app/api/recommendations/route.ts:27` - `top_n` not validated as positive integer
- `/src/app/api/stripe/checkout-session/route.ts:12` - Email format not validated

**Risk**: Invalid data reaches database, crashes, injection
**Fix**: Use Zod schemas for all API inputs

---

### 16. Unsafe Object Property Access
**File**: `/src/app/api/replay/[id]/route.ts:337-401`
**Issue**: `extractMetrics()` accesses nested properties without null checks
```typescript
function extractMetrics(replayData: any) {
  return {
    duration: replayData.duration,  // Could be undefined
    blue: { players: blue.players.map(...) }  // blue.players could be undefined
  };
}
```
**Risk**: "Cannot read property of undefined" crashes
**Fix**: Add null guards or use optional chaining

---

### 17. Type Mismatch with Database
**File**: `/src/types/user.ts:5`
**Issue**: `image: string` but Prisma schema has `image String?`
**Risk**: Type errors when image is null
**Fix**: Change to `image: string | null`

---

### 18. Non-Null Assertions on Env Vars
**Files**:
- `/src/app/api/webhooks/stripe/route.ts:8-9`
- `/src/app/api/stripe/checkout-session/route.ts:8`
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, ...)
```
**Risk**: Runtime crash if env var missing
**Fix**: Validate at startup via env.mjs

---

### 19. Spotify Track ID Regex Too Permissive
**File**: `/src/app/api/spotify/track/route.ts:20`
```typescript
spotifyUrl.match(/track\/([a-zA-Z0-9]+)/)
```
**Issue**: Doesn't account for full Spotify ID format
**Risk**: Invalid IDs sent to Spotify API
**Fix**: Use proper Spotify ID validation

---

## 📋 LOWER PRIORITY (Code Quality & Maintainability)

### 20. Inconsistent Error Handling Patterns
**Issue**: Every file handles errors differently
- Some use `any`, some use `unknown`
- Some log + return error, some just return
- Some return 500, some return 400

**Fix**: Create centralized error handler utility

---

### 21. Large Components Need Splitting
**Files**:
- `/src/components/PlayerStats.tsx` - 427 lines, handles config/data/chart/table
- `/src/app/api/replay/[id]/route.ts` - 401 lines, complex switch statement

**Fix**: Extract into smaller, focused components/functions

---

### 22. Inconsistent Naming Conventions
**Issues**:
- Component files: Mix of PascalCase and kebab-case
- Loading states: `isUploading`, `loading`, `isPending` (3 different names)
- Database fields: Mix of camelCase and snake_case

**Fix**: Establish and enforce naming conventions

---

### 23. Missing Database Indexes
**File**: `/prisma/schema.prisma`
**Missing**:
- `Account.provider` index
- `Session.sessionToken` index
- No `createdAt`/`updatedAt` timestamps on any model

**Fix**: Add indexes and timestamps

---

### 24. Commented-Out Code Blocks
**Files**:
- `/src/middleware.ts:6-35` - Large auth block commented
- `/src/app/api/recommendations/route.ts:4` - Commented URL

**Fix**: Remove or document why kept

---

### 25. ESLint Rules Disabled
**File**: `.eslintrc.js:14-26`
```javascript
'@typescript-eslint/no-explicit-any': 'off',
'simple-import-sort/imports': 'off',
```
**Risk**: Technical debt accumulates
**Fix**: Gradually enable rules, fix violations

---

### 26. Missing Accessibility
**Files**:
- `/src/components/UploadReplayPage.tsx` - Custom button missing focus styles
- `/src/components/SongRecommendations.tsx` - Loading state no aria-live
- `/src/components/PlayerStats.tsx` - Charts not accessible

**Fix**: Add ARIA labels, keyboard navigation

---

### 27. No Result Caching
**File**: `/src/components/SongRecommendations.tsx`
**Issue**: Every player selection makes fresh API call
**Fix**: Cache results by playerId

---

### 28. Expensive Computations Not Memoized
**File**: `/src/components/PlayerStats.tsx:228-291`
**Issue**: Chart data recreated every render
**Fix**: Use `useMemo` for allPlayers, chartData, chartOptions

---

### 29. Iframe Remounts on Expand
**File**: `/src/components/SpotifySongCard.tsx:154`
```typescript
key={`player-${trackId}-${isExpanded}`}
```
**Issue**: Changing key forces iframe reload, disrupts playback
**Fix**: Remove `isExpanded` from key

---

### 30. Magic Numbers Throughout
**Files**:
- `/src/app/api/replay/[id]/route.ts:90` - `2 * 60 * 1000` (2 min timeout)
- `/src/app/api/get-replay-url/route.ts:41` - `60 * 60` (1 hour expiry)
- `/src/app/api/upload-replay/route.ts:61` - `'replays'` bucket name

**Fix**: Extract to named constants

---

## Suggested Fix Order

### Phase 1: Critical Security (Do First)
1. XSS in track-resume-visit
2. Open redirect vulnerabilities
3. Path traversal in get-replay-url
4. PII collection consent

### Phase 2: Stability & Reliability
5. Memory leak in useToast
6. Complete env.mjs validation
7. Stripe webhook error handling
8. Add timeouts to external API calls

### Phase 3: Race Conditions
9. Ballchasing polling race condition
10. Fire-and-forget upload handling
11. Async cleanup in components

### Phase 4: Type Safety
12. Replace all `any` types with proper interfaces
13. Add input validation to all API routes
14. Fix null/undefined guards

### Phase 5: Code Quality
15. Consistent error handling
16. Split large files
17. Naming conventions
18. Database improvements

---

## Quick Wins (< 30 min each)
- [ ] Fix useToast dependency array (1 line change)
- [ ] Remove hardcoded Sentry DSN
- [ ] Add Spotify track ID validation
- [ ] Remove commented code blocks
- [ ] Add `createdAt`/`updatedAt` to Prisma schema

---

*Generated: 2026-01-13*
*Total Issues: 30*
*Critical: 8 | High: 5 | Medium: 6 | Low: 11*
