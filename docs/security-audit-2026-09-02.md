# Security audit — io.vefskoliv2

Date: 2026-09-02. Scope: full repository at commit `ab4d77f` (branch `main`): authentication, route protection, every server action and API route, LTI integration, the code-exercise sandbox, group work, secrets handling, repository hygiene, dependencies. Method: manual code review plus `npm audit`. No dynamic testing against production.

## Summary

| # | Severity | Finding | Where |
|---|----------|---------|-------|
| 1 | High | Any logged-in user can read any other student's submissions, feedback and grades | `app/serverActions/getGuides.ts:345`, `app/serverActions/getStudentGuides.ts:9` |
| 2 | High | Vulnerable dependencies: next-auth (critical), next (high), mongoose (moderate) | `package.json` |
| 3 | Medium | Open self-registration with no verification, invite or domain restriction | `app/serverActions/signUp.ts` |
| 4 | Medium | No rate limiting or lockout on login and registration | `app/serverActions/authenticate.ts`, `signUp.ts` |
| 5 | Medium | LTI deep-linking response route is effectively unauthenticated | `app/api/lti/deep-linking/response/route.ts:29` |
| 6 | Medium | Sessions are 30-day JWTs that never re-check the user | `auth.ts:49` |
| 7 | Medium | Reviews can target any return, including your own, any number of times | `app/serverActions/returnFeedback.ts:26` |
| 8 | Medium | No HTTP security headers (CSP, frame-ancestors, Referrer-Policy) | `next.config.mjs` |
| 9 | Low | Profile fields, review comments and return fields have no size or format limits | `app/serverActions/updateUserInfo.ts:20`, `returnFeedback.ts`, `returnGuide.ts` |
| 10 | Low | Internal error messages echoed to clients | `app/api/lti/**`, `app/api/blob/upload/route.ts` |
| 11 | Low | LTI identity mapping gaps (role name, email linking, no session) | `app/api/lti/launch/route.ts`, `app/lib/lti-config.ts` |
| 12 | Low | Teacher-controlled strings interpolated into sandbox source | `app/utils/codeRunner.ts:333` |
| 13 | Low | Real student data and scratch files committed to the repository | `test.returns.json`, `test.guides.json`, `pictures_for_claude/` |
| 14 | Low | Four LMS pages rely on the proxy alone for access control | `app/LMS/{people,resources,calendar,docs}/page.tsx` |

Secrets: `.env.local` and `.env.local.lti` are correctly ignored and no real credential has ever been committed (the historical `example.env.local` held placeholders only). CI uses dummy values.

## Findings

### 1. High — Cross-student data exposure through `getGuides` / `getStudentGuides`

Both actions take a `userId` argument and only check that *a* session exists. They then run the full per-student aggregation for that id: returns submitted, reviews received (including reviewer comments), grades received, and exercise attempts.

`getStudentGuides` is imported by `app/LMS/reports/components/ReportsPage.tsx`, a `"use client"` component, so its server-action id ships in the browser bundle for every logged-in user, teacher or not. Student ids are easy to obtain: team member lists, `availableForReview` return owners, and gallery items all carry them.

**Impact:** a student can pull every classmate's project feedback and grades.

**Fix:** derive the id from the session unless the caller has teacher permissions:

```ts
const session = await auth();
if (!session?.user) return null;
const userId = hasTeacherPermissions(session) && userIdString
  ? userIdString
  : session.user.id;
```

Apply the same rule in `getStudentGuides`. Add a test in `__tests__/serverActions/getGuides.test.ts` that a student passing another id gets their own data.

### 2. High — Vulnerable dependencies

`npm audit --omit=dev` at the time of review:

| Package | Installed | Advisory | Fix |
|---------|-----------|----------|-----|
| next-auth / @auth/core | 5.0.0-beta.30 | **Critical**: configuration errors can make existence-based auth checks fail open (the `auth` object is populated with an error). This codebase gates everything on `!!session?.user`. Also: email normalizer homoglyph bypass; `getToken()` uncaught exception on malformed Bearer headers. | 5.0.0-beta.32 |
| next | 16.2.6 | **High**: proxy/middleware bypass in App Router; denial of service via Server Actions. | 16.3.4 |
| mongoose | 8.22.1 | **Moderate**: prototype pollution via `__proto__`-prefixed dotted paths in update casting. | latest 8.x |
| postcss, sharp, nanoid | transitive | High (XSS in stringify, arbitrary file read via sourceMappingURL; libvips CVEs; infinite loops). | come with the next upgrade |

**Fix:** bump `next`, `next-auth`, `mongoose`, `styled-components`, run `npm audit`, then `npm run verify`.

### 3. Medium — Open self-registration

`signUp` creates an account with role `user` for anyone who submits the form on `/signin`. There is no email verification, invite code, teacher approval, or domain allowlist.

Once logged in, a stranger sees: the people directory with every student's name and profile text, other students' project URLs and comments (`availableForReview`), the group project brief and teams, and every Zoom class recording for the school year (`/LMS/resources`). Combined with finding 1, they also see grades.

**Fix (pick one, cheapest first):** restrict registration to an email domain allowlist; or require an invite code set per cohort; or create accounts as `pending` and have a teacher approve them on the people page. Email verification on top is good hygiene either way.

### 4. Medium — No brute-force protection

Neither `authenticate` nor `signUp` is rate-limited, and there is no account lockout. The credentials provider accepts passwords of six characters at login (registration requires eight). bcrypt cost 10 is fine, but it does not stop credential stuffing.

**Fix:** add a Vercel WAF rate-limit rule on `POST /signin` and the sign-in server action, or an Upstash-style limiter keyed on IP plus email inside `authorize`. Return the same generic error for unknown email and wrong password (already the case).

### 5. Medium — LTI deep-linking response route trusts an unverified cookie

`app/api/lti/deep-linking/response/route.ts` requires only that an `lti-session` cookie *exists*; it never verifies the JWT, and nothing else in the app verifies that cookie either. A caller can set `lti-session=x` and `lti-deep-link-return=https://anything`, POST guide ids, and receive a `LtiDeepLinkingResponse` JWT signed with the tool's private key plus an auto-submitting form pointed at their URL.

Canvas will only accept such a response inside a deep-linking flow it started, so the practical impact today is limited, and the LTI integration is not live (blocked on a developer key). It must be fixed before the key is issued.

**Fix:** `jwtVerify` the cookie with the same secret used to sign it, require `role === "teacher"` from the payload, and reject if the `lti-deep-link-return` cookie's origin differs from the configured issuer (the launch route already validates this at set time; re-check at use time).

### 6. Medium — Sessions never re-validate the user

`auth.ts` uses the JWT strategy with the default 30-day `maxAge`. Role, name and profile are copied into the token once at sign-in. Deleting a user, demoting a teacher, or changing a password leaves every existing session fully valid for up to a month. The teacher alias cookie adds a 24-hour window on top.

**Fix:** set `session: { maxAge: 7 * 24 * 3600, updateAge: 3600 }`; in the `jwt` callback, re-load the user from the database when the token is older than, say, 15 minutes (or on `trigger === "update"`), and drop the token if the user no longer exists. A `tokenVersion` field on `User`, bumped on password change, gives instant revocation.

### 7. Medium — Review submissions are not validated against the return

`returnReview` accepts any `returnId` and `guideId` and creates a review. It does not check that the return exists, that it belongs to that guide, that the reviewer is not the return's owner, or that the reviewer has not already reviewed it.

**Impact:** a student can review their own return (self-reviews are excluded from *received* reviews by the aggregation, but they still count as *given* reviews toward the student's own status and are graded by teachers), submit unlimited duplicate reviews, and inflate `RECOMMEND_TO_GALLERY` votes on the public gallery.

**Fix:** load the `Return`, verify `return.guide` equals `guideId` and `return.owner` differs from the session user, and add a unique compound index on `{ owner, return }` in `app/models/review.ts`.

### 8. Medium — No HTTP security headers

`next.config.mjs` sets no `headers()`. There is no Content-Security-Policy, no `frame-ancestors` / `X-Frame-Options`, no `Referrer-Policy`, no `Permissions-Policy`. Any LMS page can be framed by a third-party site (clickjacking). Vercel adds HSTS, nothing else.

**Fix:** add a `headers()` block. Start with `frame-ancestors 'self' https://canvas.instructure.com` (Canvas launches in `_blank` today, but deep-linking may iframe), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and a report-only CSP to find inline-script needs from styled-components and the markdown editor before enforcing.

### 9. Low — Unbounded and unvalidated user input

- `updateUserInfo` validates only that the keys are in the allowed enum; values are not type- or length-checked, and `avatarUrl` is not validated as a stored image URL. `bodySizeLimit` is 5 MB, so a student can store multi-megabyte strings that are then served to every user via `getUsers` and the people page.
- `returnReview.comment`, `returnGuide.projectName/comment` have `.min()` but no `.max()`.

**Fix:** a zod schema for profile updates with `.max()` on every field and `isStoredImage` on `avatarUrl`; `.max(5000)` on review comments and return fields (the group-work actions already do this and are a good template).

### 10. Low — Internal error messages echoed to clients

The LTI routes (`login`, `launch`, `jwks`, `config`, `grades`, `deep-linking/response`) return `details: error.message` on 500, and `app/api/blob/upload/route.ts` returns the raw upload error. These leak configuration state (which env var is missing, driver errors).

**Fix:** log the detail, return a generic message. `handleActionError` in `utils/errors.ts` already does this for server actions.

### 11. Low — LTI identity mapping gaps

- `getUserRoleFromLTI` returns `'student'`, but the app's student role is `'user'`; LTI-created students will not match `role: "user"` filters.
- Users are matched by email from Canvas claims, with a `${sub}@lti.local` fallback. Canvas is the trusted identity provider, so email linking is acceptable, but document it and consider matching on `(iss, sub)` via `ltiId` first.
- The launch sets an `lti-session` cookie scoped to `/lti` but never creates a NextAuth session, so a launched user is redirected to `/signin`.

These are functional gaps to close before the integration goes live rather than exploitable today.

### 12. Low — Sandbox harness built by string interpolation

`codeRunner.ts` interpolates `spec.entryPoint` and `{ __fn: "..." }` test arguments directly into JavaScript source. Both are teacher-authored, and the guide `PUT` route accepts task objects with `.passthrough()`, so a teacher can inject arbitrary code. It runs inside QuickJS with a 2 s / 32 MB limit and no host access, so this is contained. Teacher-authored `answerFeedback.pattern` regexes are also compiled and run against student input (ReDoS risk).

**Fix:** validate `entryPoint` as an identifier (`/^[A-Za-z_$][\w$]*$/`) in the guide schema; keep `__fn` teacher-only as documented.

### 13. Low — Repository hygiene

- `test.returns.json` contains 461 real student submissions (owner ids, project URLs, comments); `test.guides.json` contains three staff email addresses. Both are tracked. If `github.com/ellertsmari/io.vefskoliv2` is public, this is a disclosure; if private, it is still data that does not belong in version control.
- `pictures_for_claude/` (4 images) is tracked; `.venv/` is untracked but not in `.gitignore`.
- `.env.local.lti` duplicates the LTI private key already in `.env.local`; delete it once the key is consolidated.

**Fix:** move test fixtures to a generator (`@faker-js/faker` is already a dev dependency) or anonymise them, `git rm` the JSON and image files, add `.venv/` to `.gitignore`. Rewriting history is only worth it if the repo is public.

### 14. Low — Pages protected by the proxy alone

`/LMS/people`, `/LMS/resources`, `/LMS/calendar` and `/LMS/docs` do not call `auth()` themselves. The actions they call do (`getUsers`, `getUserRecordings`, `getGroupCalendarEvents`), so a proxy bypass (see finding 2) renders empty pages rather than leaking data. Adding `auth()` plus a redirect at the top of each page is cheap defense in depth, and matters more if a future edit adds data to `/LMS/docs`.

## What is already solid

- Password hashes are `select: false` and only the credentials `authorize` path opts in; bcrypt cost 10.
- Every write action validates with zod and casts ids through `ObjectId`; `getUsers` takes a closed filter type, so there is no query-object injection.
- The guide `PUT` route whitelists fields (mass assignment was fixed), is teacher-only, and `updatedAt` is server-controlled.
- Exercise answer keys are stripped by `sanitizeGuideForClient` before anything reaches the browser; served task sets are recomputed from a seed rather than trusted from the request.
- Blob upload tokens are session-gated and constrained to image types and a byte ceiling; orphaned blobs are deleted server-side under the same authorisation as the write.
- Judge invitation tokens are 24 random bytes (`base64url`); judge actions correctly scope teams to the invitation's project.
- LTI launch verifies signature, issuer, audience, deployment id, token age, and single-use state/nonce; the deep-link return URL is origin-checked at launch.
- Teacher aliasing uses an `httpOnly` cookie honoured only when the real token role is `teacher`, and `hasTeacherPermissions` looks at the original user.
- Markdown is rendered through `rehype-sanitize`; stored image URLs are character-restricted so they cannot break out of `src`/`href`.
- Group-work actions consistently check membership, project status, and teacher role, with `.max()` on every text field.
- The proxy replaces any client-supplied `x-pathname` header; CI uses dummy secrets; git history holds no real credentials.

## Suggested order of work

1. Upgrade `next`, `next-auth`, `mongoose` and re-run `npm run verify` (finding 2). Half a day including a smoke test of sign-in and the guide editor.
2. Scope `getGuides` / `getStudentGuides` to the session user (finding 1). One small change plus a test.
3. Gate registration (finding 3) and add rate limiting (finding 4).
4. Validate reviews against the return and add the unique index (finding 7).
5. Add security headers (finding 8) and session `maxAge` / re-validation (finding 6).
6. Input limits and error hygiene (findings 9, 10).
7. Before enabling LTI: findings 5 and 11.
8. Housekeeping: findings 12, 13, 14.
