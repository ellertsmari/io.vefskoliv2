# Security fix plan

Companion to `docs/security-audit-2026-09-02.md`. Nine pull requests, each independently mergeable, in the order that reduces risk fastest. Effort estimates assume one person and include tests.

Decisions already made (2026-09-02):

- Registration is gated by **teacher approval**: new accounts start `pending` and cannot sign in until a teacher approves them on the people page.
- Login rate limiting is **in-app, backed by MongoDB** with a TTL collection. No new services.
- The GitHub repository is **public**, so the committed student data is removed *and* purged from history.

Conventions used throughout: every new server action validates with zod, returns `ActionResult`, and gets a `mongodb-memory-server` test alongside the existing ones in `__tests__/serverActions/`. `npm run verify` (build, typecheck, jest, trace check) must pass before each PR merges. Database schema changes are additive with defaults, so nothing needs importing through Compass.

---

## PR 1 — Dependency upgrades (finding 2) · ~half a day

**Change**

```
npm install next@16.3.4 next-auth@5.0.0-beta.32 mongoose@8.24.4 styled-components@6.5.3
npm audit --omit=dev      # expect 0 high/critical
```

Keep mongoose on 8.x (9.x is a major with breaking changes and is not needed for the advisory). `eslint-config-next` can stay.

**Verify**

- `npm run verify`.
- Manual smoke test on a preview deployment: sign in, open the dashboard, save a guide in the editor, run one auto-graded exercise, open a group project page, upload a team image.
- Confirm `AUTH_SECRET` is set in Vercel for all environments. The next-auth fix makes configuration errors fail closed, which is what we want, but it means a missing secret now blocks sign-in instead of silently passing.

**Risk**: next-auth beta releases occasionally change callback typing. If `types/next-auth.d.ts` stops compiling, adjust the module augmentation rather than casting.

---

## PR 2 — Scope guide data to the session user (finding 1) · ~2 hours

**Files**: `app/serverActions/getGuides.ts`, `app/serverActions/getStudentGuides.ts`, `__tests__/serverActions/getGuides.test.ts`

**Change**

In `getGuides`, resolve the target user like this and use it for the pipeline:

```ts
const session = await auth();
if (!session?.user?.id) return null;
const targetId =
  hasTeacherPermissions(session) && userIdString ? userIdString : session.user.id;
```

`getStudentGuides` gets the same three lines so it cannot be used to bypass the check. Existing callers are unaffected: the dashboard, guides and edit-guides pages pass `session.user.id`; the reports page is teacher-only and passes the selected student.

**Tests**

- A student caller passing another user's id receives their own guides (assert on `returnsSubmitted` owner).
- A teacher caller passing a student id receives that student's guides.
- Update the comment at the top of the test file, which currently documents the old behaviour.

---

## PR 3 — Teacher approval for new accounts (finding 3) · ~1.5 days

**Model** (`app/models/user.ts`)

```ts
status: {
  type: Schema.Types.String,
  required: true,
  enum: ["pending", "active"],
  default: "active",
}
```

Default `active` means every existing account keeps working without a migration. Only `signUp` writes `pending`.

**Sign-up** (`app/serverActions/signUp.ts`)

- Create the user with `status: "pending"`.
- Remove the automatic `signIn` call and its "auto-login failed" branch.
- Return: "Account created. A teacher needs to approve it before you can sign in — you'll get access once that's done."
- `RegisterForm` shows that message and switches to the login tab instead of navigating to the dashboard.

**Sign-in** (`auth.ts`, `app/serverActions/authenticate.ts`)

- In `authorize`, after the bcrypt check succeeds: if `user.status === "pending"`, throw a `CredentialsSignin` subclass with `code = "pending"`.
- In `authenticate`, map that code to "Your account is waiting for a teacher to approve it." Everything else stays "Invalid credentials."
- Because a pending user never gets a session, no other authorisation check in the app needs to know about the status.

**LTI launch** (`app/api/lti/launch/route.ts`): users created from a Canvas launch are set `status: "active"` explicitly, since Canvas has already vetted them.

**Directory** (`app/serverActions/getUsers.ts`): add `status: { $ne: "pending" }` to the query so unapproved accounts never appear on the people page or anywhere `getUsers` feeds.

**Teacher tools** (new file `app/serverActions/approveUsers.ts`)

- `getPendingUsers()` — teacher-only, returns `{ id, name, email, createdAt }` sorted oldest first.
- `approveUser(id)` — teacher-only, sets `status: "active"`.
- `rejectUser(id)` — teacher-only, deletes the document if and only if it is still `pending`.
- All three use `hasTeacherPermissions` so an aliased teacher still sees the panel.

**UI** (`app/LMS/people/`)

- `page.tsx` calls `auth()` (also closes finding 14 for this page), and when the viewer is a teacher fetches pending users.
- New client component `components/pendingApprovals/PendingApprovals.tsx`: a short list above the Teachers section with name, email, "signed up 3 days ago", and Approve / Reject buttons using `useTransition` and `router.refresh()`. Hidden when the list is empty.

**Tests**

- `signUp.test.ts`: new user has `status: "pending"`; `signIn` is not called.
- New `approveUsers.test.ts`: student caller gets `NOT_AUTHORIZED`; teacher can approve; reject refuses to delete an active user.
- `authorize` path: a pending user with the right password is refused with the pending code.

**Rollout note**: after deploying, look through the current user list in Compass for accounts that don't belong to real students and delete them. Approval only gates accounts created from now on.

---

## PR 4 — Login and registration rate limiting (finding 4) · ~half a day

**New model** `app/models/rateLimit.ts`

```ts
{ key: String (unique), count: Number, createdAt: { type: Date, expires: 900 } }
```

**New helper** `app/utils/rateLimit.ts`

`consume(key, limit, windowSeconds)` does one `findOneAndUpdate` with `$inc` and `upsert`, and returns `{ allowed, retryAfterSeconds }`. `reset(key)` deletes the document. Keys are `sha256` of the scope plus identifier, so email addresses and IPs are never stored in clear.

**Where it is called**

- `authorize` in `auth.ts`: key on the lowercased email (10 failures per 15 minutes) and on the client IP from `headers().get("x-forwarded-for")` (30 per 15 minutes). `authorize` runs inside the `authenticate` server action, so `headers()` is available. On success, reset the email key. When blocked, throw a `CredentialsSignin` subclass with `code = "rate_limited"`; `authenticate` maps it to "Too many attempts. Try again in a few minutes."
- `signUp`: 5 registrations per IP per hour.

**Do not** raise the login minimum password length from 6 to 8. Existing accounts with shorter passwords would be locked out. Raise it only for `signUp`, which already requires 8.

**Tests**: the helper against `mongodb-memory-server` (allows N, blocks N+1, reset clears); `authenticate` returns the rate-limited message after the threshold.

---

## PR 5 — Validate reviews against the return (finding 7) · ~3 hours

**File**: `app/serverActions/returnFeedback.ts`, `app/models/review.ts`

**Change** in `returnReview`, before `Review.create`:

1. `ObjectId.isValid` on both ids (currently a bad id throws and is swallowed as a generic failure).
2. Load the `Return`. Fail with "Project not found" if missing.
3. `return.guide` must equal `guideId`; `return.owner` must not equal `session.user.id` ("You cannot review your own project").
4. `Review.exists({ owner, return })` → "You have already reviewed this project."

Add `reviewSchema.index({ owner: 1, return: 1 }, { unique: true })`.

**Before deploying the index**, run this in Compass on the `reviews` collection to find existing duplicates, and delete all but the oldest of each group; otherwise Mongoose cannot build the index:

```js
[{ $group: { _id: { owner: "$owner", return: "$return" }, n: { $sum: 1 }, ids: { $push: "$_id" } } },
 { $match: { n: { $gt: 1 } } }]
```

**Tests** in `returnFeedback.test.ts`: self-review rejected, wrong guide rejected, second review rejected, missing return rejected.

---

## PR 6 — Security headers and session lifetime (findings 8, 6) · ~half a day

**Headers** (`next.config.mjs`, `async headers()` applied to `/(.*)`)

| Header | Value |
|---|---|
| `Content-Security-Policy` | `frame-ancestors 'self' https://canvas.instructure.com` (only this directive enforced now) |
| `Content-Security-Policy-Report-Only` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self'; connect-src 'self' https://*.public.blob.vercel-storage.com; frame-src 'none'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Run report-only for a week, read the console violations from a teacher and a student session, then move the tightened policy into the enforced header. styled-components and the markdown editor are why `'unsafe-inline'` is there to start; a nonce-based policy can come later.

**Sessions** (`auth.ts`)

- `session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60, updateAge: 60 * 60 }`.
- In the `jwt` callback: store `token.checkedAt`. On any request where it is older than 15 minutes, reload the user by `token.id`; if it no longer exists or `status !== "active"`, return `null` (Auth.js treats this as sign-out); otherwise refresh `role`, `name` and `checkedAt`. This makes deleting or demoting a user take effect within 15 minutes instead of 30 days.
- Keep the DB lookup out of the `session` callback; it runs on every render.

**Verify**: `curl -sI https://<preview>/LMS/dashboard | grep -iE "policy|nosniff|referrer"`; sign in, delete the test user in Compass, confirm the session drops within 15 minutes.

---

## PR 7 — Input limits and error hygiene (findings 9, 10) · ~3 hours

**`app/serverActions/updateUserInfo.ts`**: replace `objOnlyHasEnumKeys` with a zod schema:

```ts
z.object({
  background: z.string().trim().max(2000).optional(),
  careerGoals: z.string().trim().max(2000).optional(),
  interests: z.string().trim().max(2000).optional(),
  favoriteArtists: z.string().trim().max(2000).optional(),
  avatarUrl: optionalStoredImageSchema.optional(),
}).strict()
```

`optionalStoredImageSchema` already exists in `utils/imageUpload.ts`. The existing "invalid user info" test keeps passing; add one for an over-long field and one for a non-image `avatarUrl`.

**`returnFeedback.ts`**: `comment.max(5000)`. **`returnGuide.ts`**: `projectName.max(200)`, `comment.max(5000)`, `.max(2000)` on both URL fields. Match the message style already used in the group-work schemas.

**Error responses**: in `app/api/lti/{login,launch,jwks,config,grades,deep-linking/response}/route.ts` and `app/api/blob/upload/route.ts`, keep `console.error(...)` and return `{ error: "<generic>" }` without `details`. The launch route's `LTIAuthError` branch can keep its `code` (it is ours, not a stack trace).

---

## PR 8 — LTI hardening before go-live (findings 5, 11) · ~half a day

Only needed before the Canvas developer key is issued, but small enough to do now.

**`app/api/lti/deep-linking/response/route.ts`**

1. `jwtVerify(ltiSession, new TextEncoder().encode(process.env.NEXTAUTH_SECRET))`, 401 on failure.
2. Require `payload.role === "teacher"`, 403 otherwise.
3. Re-validate the `lti-deep-link-return` cookie: parse as URL and require its origin to equal `new URL(getLTIConfig().issuer).origin`.

**`app/lib/lti-config.ts`**: `getUserRoleFromLTI` returns `"user"` for students, matching the app's role name. Update `__tests__/lib/lti-config.test.ts`.

**`app/api/lti/launch/route.ts`**: look up by `ltiId` first, then by email; set `status: "active"` on creation (from PR 3).

Out of scope here: turning a launch into a real NextAuth session. That belongs to the Canvas sync work tracked in `docs/handoff-2026-08-12.md`.

---

## PR 9 — Housekeeping (findings 12, 13, 14) · ~half a day plus the history rewrite

**Sandbox** (`app/api/guides/[id]/route.ts`): in `exerciseTaskSchema` add `entryPoint: z.string().regex(/^[A-Za-z_$][\w$]*$/).optional()` so the harness only ever interpolates an identifier. `codeRunner.ts` needs no change.

**Page-level auth**: `app/LMS/{resources,calendar,docs}/page.tsx` get

```ts
const session = await auth();
if (!session?.user) redirect("/signin");
```

(`people` is covered in PR 3.)

**Repository cleanup**

1. `git rm test.returns.json test.guides.json -r pictures_for_claude` (nothing in the code reads the JSON files; only the audit doc mentions them). Delete `.env.local.lti` locally. Add `.venv/` and `pictures_for_claude/` to `.gitignore`.
2. Commit and push.
3. Purge history, since the repo is public:

```
pipx install git-filter-repo        # or: pip install git-filter-repo
git clone --mirror git@github.com:ellertsmari/io.vefskoliv2.git io.vefskoliv2-mirror
cd io.vefskoliv2-mirror
git filter-repo --invert-paths \
  --path test.returns.json --path test.guides.json --path pictures_for_claude
git push --force --mirror
```

4. Re-clone your working copy afterwards (filter-repo rewrites every commit id). Anyone else with a clone must do the same.
5. Ask GitHub support to clear cached views of the old commits, or the files stay reachable by SHA for a while. Treat the student project URLs and comments as already public; they were.

---

## Order and dependencies

| Order | PR | Depends on | Effort |
|---|---|---|---|
| 1 | Dependency upgrades | — | ½ day |
| 2 | Scope guide data to session user | — | 2 h |
| 3 | Teacher approval for new accounts | — | 1½ days |
| 4 | Rate limiting | PR 3 (shares the `CredentialsSignin` error mapping) | ½ day |
| 5 | Review validation + unique index | — (needs the Compass duplicate check first) | 3 h |
| 6 | Headers + session lifetime | PR 3 (`status` check in the jwt callback) | ½ day |
| 7 | Input limits + error hygiene | — | 3 h |
| 8 | LTI hardening | PR 3 | ½ day |
| 9 | Housekeeping + history purge | — | ½ day |

PRs 1, 2 and 5 can ship the same day. Total is roughly five working days.
