# Public traffic analytics

Teacher-only dashboard at `/LMS/analytics`, linked from the "Site analytics" card on the teacher home page. It measures logged-out traffic to the public pages: people, and the search and AI crawlers that the guides need to be found by. The design was agreed in `docs/handoff-2026-10-23.md`; this note records what was built and why.

## What is recorded

`proxy.ts` decides per request (`shouldRecordHit` in `app/utils/analytics.ts`) and, when it counts, schedules `recordPageview` with `after()`, so the visitor's response is never delayed. The recorder is imported lazily, which keeps mongoose out of requests that record nothing.

Counted: `GET` page loads (`Accept: text/html`) and client-side navigations (`RSC: 1`) on `/`, `/guides*`, `/showcase*` and `/handouts/*`. Crawlers are counted on those paths whatever they accept, plus `/robots.txt`, `/sitemap.xml` and `/llms.txt`.

Not counted:
- anyone with a session (students and teachers, including a teacher viewing as a student)
- Link prefetches (`Next-Router-Prefetch`, `Next-Router-Segment-Prefetch`) and browser speculative prefetches (`Sec-Purpose`, `Purpose`)
- `HEAD` and every other method
- `/signin`, because that is where students land before logging in
- `/judge/<token>`, because the path carries a credential that must never be written to a collection

A navigation served entirely from the client router cache sends no request, so the counts err slightly low.

## What is stored

`pageviews` holds one row per hit: day (UTC, which is Iceland's local time), path, campaign tag (`?utm_source=` or `?ref=`), referrer *host* (internal clicks are dropped), country and city from Vercel's geo headers, device class, crawler label and anonymous visitor id. Nothing else is kept: no IP address, no user agent string, no cookie, no query string beyond the campaign tag. The one exception is `agent`: for a bot that declares itself but isn't on the named list, the short name it gives itself ("Barkrowler", "python-requests"), without version, links or e-mail addresses. It is never stored for people or for named crawlers. Rows expire after 90 days through a TTL index on `at`.

The visitor id is `sha256(dailySalt + ip + ua)`, truncated to 64 bits. The salt is random, one per day, in `analyticssalts`, and a TTL index deletes it when the day ends. It has to be stored somewhere shared, because two requests from one visitor can land on different Vercel instances and must hash alike. Once the salt is deleted, that day's ids can't be linked back to an address. That is the Plausible/Umami method, and it is why no consent banner is needed. One consequence: "visitors" over a range is the sum of each day's visitors, since nothing can link the same person across days.

`dailystats` keeps per-day totals (views, visitors, crawler hits) for good. Finished days are rolled up by `rollUpFinishedDays` whenever the dashboard or the teacher home card is read: it is idempotent, waits 10 minutes past midnight, and needs no cron. A day nobody looked at for 90 days would lose its total; with teachers on the home page daily, that doesn't happen.

All three collections and their indexes are created by mongoose on first use. No Compass import is needed.

## Changing things

- **Retention**: `RETENTION_DAYS` in `app/utils/analytics.ts`. MongoDB keeps an existing TTL index's `expireAfterSeconds` until it is changed with `collMod` (in Compass: Indexes, then edit `at_1`).
- **A new crawler**: add an entry to `CRAWLERS`. Labels are what is stored, so add new ones; renaming an old label splits its history. The names listed under the unnamed groups in the crawler panel are the candidates.

## Crawler groups

Crawlers we name (`CRAWLERS`) are AI, Search, Link preview or SEO tool. Everything else automated is sorted into a group (`UNNAMED`), first match wins:

- **Scanner**: security and internet-wide scanners (Censys, Expanse, zgrab, Nuclei…).
- **Monitor**: uptime checks and Vercel's own fetchers.
- **Headless browser** and **Script**: automation libraries and command-line tools (curl, python-requests, Go-http-client…). An empty user agent is a script.
- **Other bot**: anything else that calls itself a bot, crawler or spider.
- **Undeclared bot**: a browser user agent without the `Accept-Language` header that every real browser sends. These used to count as visitors.

Until 2026-10-30 all of the first four were stored as "Other bot", so older rows can't be split.
- **Turning it off**: set `ANALYTICS_DISABLED=1` in Vercel. No code change needed.

## Checking it after a deploy

Open a guide in a private window, then reload `/LMS/analytics` as a teacher: the visit appears under today. `curl -A GPTBot https://io.vefskoli.is/guides` shows up in the crawler panel. The crawler panel's "Guides fetched N of M" column is the before/after measurement for the Phase 1 SEO work in the handoff.
