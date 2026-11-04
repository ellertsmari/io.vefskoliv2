"use client";
import styled, { css, keyframes } from "styled-components";

/*
 * The project brief, styled like a company's annual report: a full-bleed
 * cover, big key figures, numbered sections with a sticky contents rail, and
 * generous type. Every colour and both typefaces come from the project's
 * theme as CSS variables set on <BriefRoot>, so one stylesheet serves every
 * project.
 */

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

const rise = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: none; }
`;

const drift = keyframes`
  from { transform: scale(1.08); }
  to { transform: scale(1); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
`;

export const BriefRoot = styled.article<{ $embedded?: boolean }>`
  --b-head: var(--b-heading-font), Georgia, serif;
  --b-body: var(--b-body-font), system-ui, sans-serif;
  --b-line: color-mix(in srgb, var(--b-text) 14%, transparent);
  --b-soft: color-mix(in srgb, var(--b-accent) 10%, var(--b-surface));
  position: relative;
  background: var(--b-bg);
  color: var(--b-text);
  font-family: var(--b-body);
  font-size: 1.0625rem;
  line-height: 1.65;
  min-height: ${({ $embedded }) => ($embedded ? "auto" : "100vh")};
  ${({ $embedded }) =>
    $embedded &&
    css`
      border-radius: var(--radius-xl);
      overflow: clip;
      border: 1px solid var(--b-line);
    `}

  /* Motion: hidden only once the script has run (data-motion="on"). */
  &[data-motion="on"] [data-animate] {
    opacity: 0;
    transition: opacity 0.8s ${ease}, transform 0.8s ${ease}, filter 0.8s ${ease};
    will-change: opacity, transform;
  }
  &[data-motion="on"] [data-animate="fade-up"] { transform: translateY(28px); }
  &[data-motion="on"] [data-animate="zoom-in"] { transform: scale(0.92); }
  &[data-motion="on"] [data-animate="slide-left"] { transform: translateX(48px); }
  &[data-motion="on"] [data-animate="slide-right"] { transform: translateX(-48px); }
  &[data-motion="on"] [data-animate="blur-in"] { filter: blur(12px); transform: scale(1.02); }
  &[data-motion="on"] [data-animate].is-in {
    opacity: 1;
    transform: none;
    filter: none;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-motion="on"] [data-animate] {
      opacity: 1;
      transform: none;
      filter: none;
      transition: none;
    }
  }
`;

export const ProgressBar = styled.div<{ $embedded?: boolean }>`
  position: ${({ $embedded }) => ($embedded ? "sticky" : "fixed")};
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 30;
  background: transparent;

  span {
    display: block;
    height: 100%;
    background: var(--b-accent);
    transform-origin: left;
    transition: transform 0.1s linear;
  }
`;

/* ------------------------------- Cover ------------------------------- */

export const Hero = styled.header<{ $embedded?: boolean }>`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--b-hero-bg);
  color: var(--b-hero-text);
  min-height: ${({ $embedded }) => ($embedded ? "0" : "min(92vh, 56rem)")};
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(1.5rem, 5vw, 4.5rem);
  padding-top: clamp(4rem, 10vw, 7rem);

  /* Inside the LMS the cover is a header, not a landing: the key facts
     must be visible without scrolling. */
  ${({ $embedded }) =>
    $embedded &&
    css`
      padding: clamp(1.25rem, 3vw, 2.25rem);
      padding-top: clamp(2.5rem, 5vw, 3.5rem);

      h1 {
        font-size: clamp(2rem, 4.5vw, 3.5rem);
        max-width: 20ch;
      }

      dl {
        margin-top: 1.5rem;
      }

      dd {
        font-size: clamp(1.5rem, 3vw, 2.25rem) !important;
      }
    `}
`;

export const HeroImage = styled.div<{ $src: string }>`
  position: absolute;
  inset: 0;
  z-index: -2;
  background: url(${({ $src }) => JSON.stringify($src)}) center / cover no-repeat;
  animation: ${drift} 2.4s ${ease} both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const HeroShade = styled.div<{ $hasImage: boolean }>`
  position: absolute;
  inset: 0;
  z-index: -1;
  background: ${({ $hasImage }) =>
    $hasImage
      ? `linear-gradient(180deg, color-mix(in srgb, var(--b-hero-bg) 30%, transparent) 0%, color-mix(in srgb, var(--b-hero-bg) 92%, transparent) 78%)`
      : `radial-gradient(120% 90% at 85% 0%, color-mix(in srgb, var(--b-accent) 45%, transparent) 0%, transparent 60%),
         radial-gradient(80% 70% at 0% 100%, color-mix(in srgb, var(--b-accent) 22%, transparent) 0%, transparent 65%)`};
`;

export const HeroTopLine = styled.div`
  position: absolute;
  top: clamp(1.25rem, 3vw, 2rem);
  left: clamp(1.5rem, 5vw, 4.5rem);
  right: clamp(1.5rem, 5vw, 4.5rem);
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.8;

  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  @media (max-width: 520px) {
    span {
      display: none;
    }
  }
`;

export const Eyebrow = styled.p`
  margin: 0 0 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--b-hero-text) 75%, var(--b-accent));
  animation: ${rise} 0.8s ${ease} both;
`;

export const HeroTitle = styled.h1`
  margin: 0;
  font-family: var(--b-head);
  font-weight: 700;
  font-size: clamp(2.6rem, 7.5vw, 6.5rem);
  line-height: 0.98;
  letter-spacing: -0.025em;
  max-width: 14ch;
  text-wrap: balance;

  span {
    display: inline-block;
    animation: ${rise} 0.9s ${ease} both;
  }

  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
    }
  }
`;

export const HeroTagline = styled.p`
  margin: 1.25rem 0 0;
  max-width: 46ch;
  font-size: clamp(1.1rem, 2vw, 1.45rem);
  line-height: 1.45;
  opacity: 0.88;
  animation: ${rise} 0.9s ${ease} 0.35s both;
`;

export const Facts = styled.dl`
  margin: clamp(2rem, 5vw, 3.5rem) 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0;
  border-top: 1px solid color-mix(in srgb, var(--b-hero-text) 25%, transparent);
`;

export const Fact = styled.div`
  padding: 1.1rem 1.25rem 0.25rem 0;
  animation: ${rise} 0.8s ${ease} both;

  dt {
    order: 2;
    font-size: 0.85rem;
    opacity: 0.75;
  }

  dd {
    margin: 0;
    font-family: var(--b-head);
    font-size: clamp(1.9rem, 4vw, 3rem);
    font-weight: 700;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }

  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const ScrollCue = styled.a`
  position: absolute;
  right: clamp(1.5rem, 5vw, 4.5rem);
  bottom: clamp(1.5rem, 4vw, 3rem);
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: inherit;
  border: 1px solid color-mix(in srgb, var(--b-hero-text) 40%, transparent);
  animation: ${bob} 2.4s ease-in-out infinite;

  @media (max-width: 720px) {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* ------------------------------- Body ------------------------------- */

/** Sized by its own width, not the window: the editor's drawer narrows it. */
export const BodyFrame = styled.div`
  container-type: inline-size;
  container-name: brief-body;
`;

export const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 5rem);
  padding: clamp(1.25rem, 5cqi, 4.5rem);
  max-width: 82rem;
  margin: 0 auto;

  @container brief-body (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    padding-top: 0;
  }
`;

export const Rail = styled.nav`
  position: sticky;
  top: 1.5rem;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  @container brief-body (max-width: 900px) {
    top: 0;
    z-index: 20;
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: none;
    gap: 0.4rem;
    margin: 0 calc(-1 * clamp(1.25rem, 5cqi, 4.5rem));
    padding: 0.75rem clamp(1.25rem, 5cqi, 4.5rem);
    background: color-mix(in srgb, var(--b-bg) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--b-line);
  }
`;

export const RailLabel = styled.p`
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--b-muted);

  @container brief-body (max-width: 900px) {
    display: none;
  }
`;

export const RailLink = styled.a<{ $active: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-md);
  color: ${({ $active }) => ($active ? "var(--b-text)" : "var(--b-muted)")};
  background: ${({ $active }) => ($active ? "var(--b-soft)" : "transparent")};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  text-decoration: none;
  font-size: 0.95rem;
  white-space: nowrap;
  transition: background-color 0.25s ease, color 0.25s ease;
  position: relative;

  small {
    font-variant-numeric: tabular-nums;
    font-size: 0.75rem;
    color: ${({ $active }) => ($active ? "var(--b-accent)" : "var(--b-muted)")};
    font-weight: 700;
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 20%;
    width: 3px;
    border-radius: 2px;
    background: var(--b-accent);
    transform: scaleY(${({ $active }) => ($active ? 1 : 0)});
    transition: transform 0.3s ${ease};
  }

  &:hover {
    color: var(--b-text);
  }

  @container brief-body (max-width: 900px) {
    border: 1px solid var(--b-line);
    border-radius: var(--radius-pill);
    padding: 0.35rem 0.85rem;

    &::before {
      display: none;
    }
  }
`;

export const RailAction = styled.a`
  margin-top: 1.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--b-muted);
  text-decoration: none;

  &:hover {
    color: var(--b-text);
  }

  @container brief-body (max-width: 900px) {
    display: none;
  }
`;

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const Section = styled.section`
  position: relative;
  padding: clamp(2.5rem, 6vw, 4.5rem) 0;
  border-top: 1px solid var(--b-line);
  scroll-margin-top: 4rem;

  &:first-child {
    border-top: none;
    padding-top: clamp(1rem, 3vw, 2rem);
  }
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  margin-bottom: clamp(1.25rem, 3vw, 2rem);
  flex-wrap: wrap;
`;

export const SectionNumber = styled.span`
  font-family: var(--b-head);
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 700;
  line-height: 0.8;
  color: transparent;
  -webkit-text-stroke: 1.5px var(--b-accent);
  font-variant-numeric: tabular-nums;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-family: var(--b-head);
  font-size: clamp(1.9rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.015em;
  display: flex;
  align-items: center;
  gap: 0.6rem;

  svg {
    font-size: 0.6em;
    color: var(--b-accent);
  }
`;

export const EditButton = styled.button`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--b-line);
  background: var(--b-surface);
  color: var(--b-text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: var(--b-accent);
    transform: translateY(-1px);
  }
`;

export const HeroEdit = styled(EditButton)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  margin: 0;
  z-index: 2;
`;

export const EmptySection = styled.button`
  width: 100%;
  padding: 2rem;
  border: 2px dashed var(--b-line);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--b-muted);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: var(--b-accent);
    color: var(--b-text);
  }
`;

export const PreviewBanner = styled.div`
  position: sticky;
  top: 0;
  z-index: 40;
  padding: 0.6rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  background: #ffe066;
  color: #2b2100;
`;

/* ---------------- Teacher HTML: base typography + building blocks ---------------- */

export const Html = styled.div`
  max-width: 46rem;

  & > :first-child {
    margin-top: 0;
  }

  h2,
  h3,
  h4 {
    font-family: var(--b-head);
    line-height: 1.15;
    margin: 2rem 0 0.75rem;
  }
  h2 { font-size: 1.8rem; }
  h3 { font-size: 1.35rem; }
  h4 { font-size: 1.1rem; }

  p {
    margin: 0 0 1rem;
  }

  ul,
  ol {
    padding-left: 1.25rem;
    margin: 0 0 1.25rem;
  }

  li {
    margin: 0.35rem 0;
  }

  li::marker {
    color: var(--b-accent);
    font-weight: 700;
  }

  a {
    color: var(--b-accent);
    text-underline-offset: 3px;
  }

  strong {
    font-weight: 700;
  }

  blockquote {
    margin: 1.5rem 0;
    padding: 0.25rem 0 0.25rem 1.25rem;
    border-left: 3px solid var(--b-accent);
    font-family: var(--b-head);
    font-size: 1.35rem;
    line-height: 1.4;
  }

  img,
  video,
  iframe {
    max-width: 100%;
    border-radius: var(--radius-lg);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0 1.5rem;
    font-size: 0.95rem;
  }

  th,
  td {
    text-align: left;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--b-line);
  }

  hr {
    border: none;
    border-top: 1px solid var(--b-line);
    margin: 2rem 0;
  }

  code {
    font-size: 0.9em;
    padding: 0.1em 0.35em;
    border-radius: 4px;
    background: var(--b-soft);
  }

  /* Building blocks from the editor's cheat sheet */

  .brief-lead {
    font-family: var(--b-head);
    font-size: clamp(1.35rem, 2.6vw, 1.9rem);
    line-height: 1.35;
    letter-spacing: -0.01em;
    margin-bottom: 1.5rem;
  }

  .brief-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
    max-width: none;
  }

  .brief-card {
    background: var(--b-surface);
    border: 1px solid var(--b-line);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.35rem;
    transition: transform 0.3s ${ease}, box-shadow 0.3s ${ease}, border-color 0.3s ease;

    h3,
    h4 {
      margin-top: 0;
    }

    p:last-child {
      margin-bottom: 0;
    }

    &:hover {
      transform: translateY(-4px);
      border-color: var(--b-accent);
      box-shadow: 0 18px 40px -24px color-mix(in srgb, var(--b-text) 50%, transparent);
    }
  }

  .brief-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .brief-stat {
    display: flex;
    flex-direction: column;
    padding-top: 0.75rem;
    border-top: 2px solid var(--b-accent);

    strong {
      font-family: var(--b-head);
      font-size: clamp(2.5rem, 5vw, 3.75rem);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    span {
      color: var(--b-muted);
      font-size: 0.95rem;
    }
  }

  .brief-callout {
    margin: 1.5rem 0;
    padding: 1.1rem 1.35rem;
    border-radius: var(--radius-lg);
    background: var(--b-accent);
    color: var(--b-accent-text);
    font-weight: 500;

    a {
      color: inherit;
    }
  }

  .brief-checklist {
    list-style: none;
    padding: 0;

    li {
      position: relative;
      padding-left: 2rem;
      margin: 0.6rem 0;
    }

    li::before {
      content: "✓";
      position: absolute;
      left: 0;
      top: 0.1em;
      width: 1.35rem;
      height: 1.35rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--b-accent);
      color: var(--b-accent-text);
    }
  }

  .brief-steps {
    list-style: none;
    padding: 0;
    counter-reset: brief-step;

    & > li {
      counter-increment: brief-step;
      position: relative;
      padding: 0 0 1.5rem 3.5rem;
      margin: 0;
      border-left: 2px solid var(--b-line);
      margin-left: 1.1rem;
      padding-left: 2.4rem;
    }

    & > li:last-child {
      border-left-color: transparent;
      padding-bottom: 0;
    }

    & > li::before {
      content: counter(brief-step);
      position: absolute;
      left: -1.15rem;
      top: -0.1rem;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-weight: 700;
      background: var(--b-surface);
      border: 2px solid var(--b-accent);
      color: var(--b-accent);
    }

    p {
      margin: 0.25rem 0 0;
      color: var(--b-muted);
    }
  }

  .brief-pill {
    display: inline-block;
    padding: 0.1rem 0.6rem;
    border-radius: var(--radius-pill);
    background: var(--b-soft);
    color: var(--b-accent);
    font-size: 0.8rem;
    font-weight: 700;
    vertical-align: middle;
  }

  .brief-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: 1.5rem 2rem;
    margin: 1.5rem 0;
  }

  .brief-video {
    position: relative;
    aspect-ratio: 16 / 9;
    margin: 1.5rem 0;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: #000;

    iframe,
    video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      border-radius: 0;
    }
  }

  .brief-figure {
    margin: 1.5rem 0;

    img {
      width: 100%;
      display: block;
    }

    figcaption {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: var(--b-muted);
    }
  }

  .brief-wide {
    width: 100%;
    display: block;
    margin: 1.5rem 0;
  }
`;

/* ------------------------- Automatic sections ------------------------- */

export const Timeline = styled.ol`
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--points), minmax(0, 1fr));
  gap: 1rem;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    right: 0.6rem;
    height: 3px;
    border-radius: 2px;
    background: var(--b-line);
  }

  &::after {
    background: var(--b-accent);
    right: auto;
    width: calc((100% - 1.2rem) * var(--done, 0));
    transition: width 1.4s ${ease};
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);

    &::before,
    &::after {
      top: 0.6rem;
      bottom: 0.6rem;
      left: 0.55rem;
      right: auto;
      width: 3px;
      height: auto;
    }

    &::after {
      height: calc((100% - 1.2rem) * var(--done, 0));
      bottom: auto;
    }
  }
`;

export const TimelinePoint = styled.li<{ $passed: boolean }>`
  position: relative;
  padding-top: 2rem;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    z-index: 1;
    background: ${({ $passed }) => ($passed ? "var(--b-accent)" : "var(--b-bg)")};
    border: 3px solid ${({ $passed }) => ($passed ? "var(--b-accent)" : "var(--b-line)")};
    box-sizing: border-box;
  }

  strong {
    display: block;
    font-family: var(--b-head);
    font-size: 1.5rem;
    line-height: 1.1;
  }

  span {
    color: var(--b-muted);
    font-size: 0.95rem;
  }

  @media (max-width: 640px) {
    padding: 0 0 0 2.25rem;
  }
`;

export const WeightBar = styled.div`
  display: flex;
  height: 3.25rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin: 1.25rem 0 0.5rem;
  background: var(--b-line);
  font-weight: 700;
  font-size: 0.95rem;
`;

export const WeightPart = styled.div<{ $tone: "accent" | "soft" }>`
  display: flex;
  align-items: center;
  padding: 0 1rem;
  white-space: nowrap;
  overflow: hidden;
  background: ${({ $tone }) => ($tone === "accent" ? "var(--b-accent)" : "var(--b-soft)")};
  color: ${({ $tone }) => ($tone === "accent" ? "var(--b-accent-text)" : "var(--b-text)")};
  transition: flex-basis 1.2s ${ease};
`;

export const RubricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: 1rem;
  margin-top: 1.75rem;
`;

export const RubricCard = styled.div<{ $color: string }>`
  position: relative;
  background: var(--b-surface);
  border: 1px solid var(--b-line);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.25rem 1.1rem;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: ${({ $color }) => $color};
  }

  h3 {
    margin: 0.5rem 0 0.35rem;
    font-family: var(--b-head);
    font-size: 1.2rem;
    line-height: 1.2;
  }

  p {
    margin: 0;
    color: var(--b-muted);
    font-size: 0.95rem;
  }
`;

export const Discipline = styled.span<{ $color: string; $background: string }>`
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ $color }) => $color};
  background: ${({ $background }) => $background};
`;

export const Note = styled.p`
  margin: 1.5rem 0 0;
  max-width: 46rem;
  color: var(--b-muted);
  font-size: 0.95rem;
`;

/** The last screen of the full-screen brief: a send-off and a way back. */
export const Finale = styled.footer`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem clamp(1.5rem, 5vw, 4.5rem);
  text-align: center;
  background:
    radial-gradient(60% 60% at 50% 60%, color-mix(in srgb, var(--b-accent) 30%, transparent), transparent 70%),
    var(--b-hero-bg);
  color: var(--b-hero-text);

  p {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  h2 {
    margin: 0 0 1.5rem;
    font-family: var(--b-head);
    font-size: clamp(2.5rem, 7vw, 5.5rem);
    line-height: 1;
    letter-spacing: -0.02em;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 1rem 1.6rem;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--b-accent);
    color: var(--b-accent-text);
    font: inherit;
    font-weight: 700;
    font-size: 1.05rem;
    cursor: pointer;
    transition: transform 0.3s ${ease};

    &:hover {
      transform: translateY(-2px);
    }
  }
`;

export const Footer = styled.footer`
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 4.5rem);
  background: var(--b-hero-bg);
  color: var(--b-hero-text);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;

  a {
    color: inherit;
  }
`;
