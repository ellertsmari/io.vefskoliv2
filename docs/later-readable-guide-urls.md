# Later: readable guide URLs

Deferred on 4 November 2026 (decided with Smári). Not started.

## Why

Guide addresses are MongoDB ids: `/guides/63e4ee1210e335000886de4d`. The address says nothing
to a person reading a search result or a shared link, and gives search engines and AI
assistants no hint of the topic. A slug like `/guides/cms-system` does.

It was left out of the agent-readability work (branch `feat/agent-readable-landing`) because it
is the riskiest change for the smallest gain: every link students, Canvas and search engines
already hold points at the id form, and those must keep working.

## Plan

1. **Model.** Add `slug: string` to the Guide model, unique, indexed. Additive with no default
   needed for reads, so no Compass import; backfill with a one-off script that slugifies the
   title (strip the "(6-8h)" duration suffixes, transliterate þ→th, ð→d, æ→ae, ö→o) and
   de-duplicates with `-2`, `-3`.
2. **Route.** Keep the folder `app/guides/[id]`. In the page, look the guide up by slug first,
   then by id. When the request used an id (or an old slug) and the guide has a slug,
   `permanentRedirect()` to `/guides/<slug>` before anything streams, so the status is a real
   308 (see the streaming note in `node_modules/next/dist/docs/01-app/02-guides/streaming.md`).
3. **Canonical and sitemap.** `generateMetadata` and `app/sitemap.ts` use the slug URL.
   `getPublicGuides` returns the slug.
4. **Links inside the app.** Search for `/guides/${` and `guide.link`; switch to the slug where
   the guide object has one. Ids keep working through the redirect, so this can be gradual.
5. **Renames.** If a teacher edits a title, the slug must not change silently, or old links
   break. Either freeze the slug after first publish, or keep a `previousSlugs: string[]`
   and redirect from those too. Freezing is simpler.
6. **LTI / Canvas.** Deep links stored in Canvas use the id URL. The redirect covers them;
   check one deep-linked assignment end to end before merging.

## Tests

- slugify: Icelandic letters, duration suffixes, duplicates.
- id → 308 to slug; unknown slug and unknown id → 404; slug → 200.
- sitemap lists slug URLs only.

## Done when

`curl -sI https://io.vefskoli.is/guides/<old id>` returns 308 with the slug in `location`,
and the slug URL returns 200 with a matching canonical link.
