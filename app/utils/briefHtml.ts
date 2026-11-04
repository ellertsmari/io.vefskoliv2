import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Options as SanitizeSchema } from "rehype-sanitize";

/**
 * The HTML a teacher writes into a brief section, made safe to serve on a
 * public page on our own domain.
 *
 * Almost everything stays: layout tags, inline styles, <style> blocks, classes,
 * data-* hooks for the brief's animations, images, video and iframes. What goes
 * is anything that runs code — <script>, on* handlers and javascript: URLs —
 * because a script here runs on io.vefskoli.is as whoever is reading, logged-in
 * students and teachers included. The realistic way that goes wrong is not a
 * rogue teacher but a phished teacher login or an embed snippet copied from
 * somewhere; the animations the page offers come from our own script, so
 * stripping theirs costs nothing.
 *
 * Runs on save (server) and in the editor's preview (browser), so what the
 * teacher previews is exactly what gets stored.
 */
const schema: SanitizeSchema = {
  ...defaultSchema,
  // Keep ids as written, so in-page #anchors work. `name` keeps the prefix.
  clobberPrefix: "brief-",
  clobber: ["name"],
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "section",
    "article",
    "header",
    "footer",
    "aside",
    "nav",
    "main",
    "figure",
    "figcaption",
    "picture",
    "video",
    "audio",
    "source",
    "track",
    "iframe",
    "style",
    "mark",
    "small",
    "span",
    "div",
    "u",
    "abbr",
    "time",
    "cite",
    "blockquote",
    "button",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      "className",
      "id",
      "style",
      "title",
      "role",
      "lang",
      "dir",
      "hidden",
      "tabIndex",
      "data*",
      "aria*",
    ],
    a: ["href", "target", "rel", "download", "hrefLang"],
    img: ["src", "alt", "width", "height", "loading", "decoding", "srcSet", "sizes"],
    source: ["src", "srcSet", "type", "media", "sizes"],
    video: [
      "src",
      "poster",
      "controls",
      "autoPlay",
      "muted",
      "loop",
      "playsInline",
      "preload",
      "width",
      "height",
    ],
    audio: ["src", "controls", "loop", "muted", "preload"],
    track: ["src", "kind", "srcLang", "label", "default"],
    iframe: [
      "src",
      "title",
      "width",
      "height",
      "allow",
      "allowFullScreen",
      "loading",
      "referrerPolicy",
      "frameBorder",
    ],
    ol: ["start", "reversed", "type"],
    li: ["value"],
    td: ["colSpan", "rowSpan", "align"],
    th: ["colSpan", "rowSpan", "align", "scope"],
    time: ["dateTime"],
    details: ["open"],
    blockquote: ["cite"],
    button: ["type"],
    // The default schema pins class names on these to GitHub's markdown
    // output; brief HTML uses its own classes.
    code: ["className"],
    ul: ["className"],
    input: [],
  },
  protocols: {
    href: ["http", "https", "mailto", "tel"],
    src: ["http", "https"],
    srcSet: ["http", "https"],
    poster: ["http", "https"],
    cite: ["http", "https"],
  },
  strip: ["script"],
  // No auto-required attributes (the default adds disabled checkboxes).
  required: {},
  ancestors: {},
};

const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeSanitize, schema)
  // &amp; rather than &#x26;, so the stored HTML stays readable when edited.
  .use(rehypeStringify, { characterReferences: { useNamedReferences: true } });

export function sanitizeBriefHtml(html: string): string {
  if (!html.trim()) return "";
  return String(processor.processSync(html)).trim();
}
