# Canvas / LTI: known issues to fix before going live

Found 2026-10-29 during a codebase cleanup. Nothing here affects anyone today, because the LTI tool has never been connected to a real Canvas (`LTI_CLIENT_ID` is still a placeholder). It all matters the moment the developer key arrives from school IT, so read this before the first real launch.

## 1. The LTI content page fetches an endpoint that does not exist

**CONFIRMED** by reading the code and the file history.

- Deep linking (`app/api/lti/deep-linking/response/route.ts:97`) gives Canvas the URL `${NEXTAUTH_URL}/lti/content/<guideId>` for each guide a teacher picks.
- That page (`app/lti/content/[id]/page.tsx`) is a client component that runs `fetch(\`/api/guides/${guideId}\`)` with no method, i.e. a GET.
- `app/api/guides/[id]/route.ts` exports only `PUT`. It has never had a GET (`git log -S GET` on the file finds nothing). There was also a `DELETE`, which nothing called; it was removed on 2026-10-29.
- Result: Next answers 405, the page throws `Guide not found` and shows "Failed to load guide content". It can never display a guide.

**Fix:** don't add a GET to the API route. Make `/lti/content/[id]` a server component that loads the guide directly, the way `app/guides/[id]/page.tsx` does, or just redirect it to `/guides/<id>`. Never return the raw document: it contains the exercise answer key. Use `sanitizeGuideForClient` / the same loader the guide page uses.

## 2. A Canvas launch never reaches `/lti/content` anyway

**CONFIRMED** by reading `app/api/lti/launch/route.ts`.

- A resource-link launch ignores the `target_link_uri` claim (it is read at line ~100 but only stored) and always redirects to `/LMS/dashboard?resource_link=…` (lines ~193–201).
- So even with issue 1 fixed, a student who clicks a guide in Canvas lands on the dashboard, not on the guide.

**Fix:** redirect to the guide from `target_link_uri` (or the `guide_id` custom claim that deep linking already sets), after checking it is one of our own URLs.

## 3. The LTI session is invisible outside `/lti`

**HYPOTHESIS**: inferred from the code, not tried against a real Canvas.

- The launch sets the `lti-session` cookie with `path: '/lti'`, so `/LMS/*` and `/guides/*` never receive it.
- `/lti` is not in `PUBLIC_ROUTES` (`auth.config.ts:9`). A student without a next-auth session who is sent to `/lti/content/…` or `/LMS/dashboard` would therefore be redirected to `/signin`, inside the Canvas iframe.
- Check this on the first real launch. If it holds, the launch has to sign the student in (map the LTI user to a `User`, issue the normal session), or the LTI pages must become public and read the `lti-session` cookie themselves.

## Where this fits

The grade sync (outbox, cron, NRPS roster, AGS sink) doesn't depend on any of this: it pushes grades over AGS and never needs a launch. These three only matter if students are meant to *open* guides from inside Canvas. Decide that first. If the answer is "no, Canvas only shows the grade column", deep linking can be dropped instead of fixed.
