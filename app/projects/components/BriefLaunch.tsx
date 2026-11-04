"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled, { css, keyframes } from "styled-components";
import { Icon } from "@iconify/react";
import { BriefProject } from "types/groupTypes";
import { briefFontUrls } from "constants/projectBrief";
import { rubricForProject } from "constants/groupWork";
import { BriefView } from "./BriefView";

/**
 * The brief as the module's grand finale: a teaser card in the project page
 * with one call to action, which opens the full brief over the whole screen.
 *
 * The first time a student opens it there is a short title sequence — the
 * module, "the final project", then the cover wipes in. After that it opens
 * straight on the cover. Any key or click skips the sequence, and reduced
 * motion never plays it.
 *
 * Opening adds a #read-brief history entry, so the phone's back button
 * closes the brief instead of leaving the project, and the address can be
 * shared to land straight in it.
 */

const HASH = "#read-brief";
const DAY = 24 * 60 * 60 * 1000;

const seenKey = (id: string) => `brief-intro-seen:${id}`;
const readSeen = (id: string) => {
  try {
    return window.localStorage.getItem(seenKey(id)) === "1";
  } catch {
    return false;
  }
};
const markSeen = (id: string) => {
  try {
    window.localStorage.setItem(seenKey(id), "1");
  } catch {
    /* private mode: the intro just plays again next time */
  }
};

/** Rough reading time of the brief, for the teaser. */
const readingMinutes = (project: BriefProject) => {
  // Every string in the brief is something to read, apart from the look.
  const text = JSON.stringify({ ...project.brief, theme: null }).replace(/"[a-zA-Z]+":/g, " ");
  const count =
    text.split(/\s+/).filter(Boolean).length +
    rubricForProject(project.rubric).length * 15;
  return Math.max(2, Math.round(count / 200));
};

type Phase = "closed" | "intro" | "open";

export const BriefLaunch = ({
  project,
  publicUrl,
}: {
  project: BriefProject;
  publicUrl?: string | null;
}) => {
  const theme = project.brief.theme;
  const [phase, setPhase] = useState<Phase>("closed");
  // The brief mounts as the curtain starts to lift, so it is revealed
  // underneath rather than popping in after.
  const [revealing, setRevealing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const launchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    // Arrived by a shared #read-brief link: open on the cover.
    if (window.location.hash === HASH) setPhase("open");
  }, []);

  const open = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intro = !reduce && !readSeen(project._id);
    markSeen(project._id);
    setRevealing(false);
    if (window.location.hash !== HASH) {
      window.history.pushState(null, "", HASH);
    }
    setPhase(intro ? "intro" : "open");
  };

  const close = useCallback(() => {
    // Leave through history when we added the entry, so Back stays sane.
    if (window.location.hash === HASH) {
      window.history.back();
    } else {
      setPhase("closed");
    }
  }, []);

  // Back button (or the close button above) took the hash away.
  useEffect(() => {
    const onPop = () => {
      if (window.location.hash === "") setPhase("closed");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // While open: the page behind does not scroll, Esc closes, and focus goes
  // back to the button afterwards.
  useEffect(() => {
    if (phase === "closed") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const launcher = launchRef.current;
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      launcher?.focus({ preventScroll: true });
    };
  }, [phase, close]);

  const minutes = useMemo(() => readingMinutes(project), [project]);
  const countdown = (() => {
    if (!project.presentationDate || now === null) return null;
    const days = Math.ceil((new Date(project.presentationDate).getTime() - now) / DAY);
    if (days < 0) return null;
    if (days === 0) return "Presentations are today";
    return `Presentations in ${days} day${days === 1 ? "" : "s"}`;
  })();
  const moduleLabel = project.module ? `Module ${project.module}` : "Group project";

  const vars = {
    "--t-bg": theme.heroBackground,
    "--t-text": theme.heroText,
    "--t-accent": theme.accent,
    "--t-accent-text": theme.accentText,
    "--t-head": `"${theme.headingFont}", Georgia, serif`,
    "--t-cover": project.brief.coverImage
      ? `url(${JSON.stringify(project.brief.coverImage)})`
      : "none",
  } as CSSProperties;

  return (
    <>
      {briefFontUrls(theme).map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}

      <Teaser style={vars}>
        <Glow aria-hidden />
        <TeaserInner>
          <TeaserEyebrow>
            {moduleLabel} · The final project
          </TeaserEyebrow>
          <TeaserTitle>{project.brief.title}</TeaserTitle>
          <TeaserTagline>{project.brief.tagline}</TeaserTagline>
          <TeaserMeta>
            {project.brief.teamSize && (
              <span>
                <Icon icon="mdi:account-group-outline" aria-hidden /> {project.brief.teamSize}
              </span>
            )}
            {countdown && (
              <span>
                <Icon icon="mdi:calendar-star" aria-hidden /> {countdown}
              </span>
            )}
            <span>
              <Icon icon="mdi:book-open-page-variant-outline" aria-hidden /> {minutes} min read
            </span>
          </TeaserMeta>
          <CallToAction ref={launchRef} type="button" onClick={open}>
            Read the project description
            <Icon icon="mdi:arrow-right" aria-hidden />
          </CallToAction>
        </TeaserInner>
      </Teaser>

      {mounted &&
        phase !== "closed" &&
        createPortal(
          <Overlay
            role="dialog"
            aria-modal="true"
            aria-label={`${project.brief.title} — project description`}
            style={vars}
          >
            {phase === "intro" && (
              <Intro
                moduleLabel={moduleLabel}
                title={project.brief.title}
                onLift={() => setRevealing(true)}
                onDone={() => setPhase("open")}
              />
            )}
            {(phase === "open" || revealing) && (
              <Scroller>
                <BriefView project={project} onClose={close} publicUrl={publicUrl} />
              </Scroller>
            )}
            <CloseButton type="button" onClick={close} aria-label="Close the project description">
              <Icon icon="mdi:close" aria-hidden />
              <span>Close</span>
            </CloseButton>
          </Overlay>,
          document.body
        )}
    </>
  );
};

/** The title sequence: three beats, then the curtain lifts. */
const Intro = ({
  moduleLabel,
  title,
  onLift,
  onDone,
}: {
  moduleLabel: string;
  title: string;
  onLift: () => void;
  onDone: () => void;
}) => {
  const [lifting, setLifting] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const liftRef = useRef(onLift);
  liftRef.current = onLift;

  useEffect(() => {
    const lift = setTimeout(() => {
      setLifting(true);
      liftRef.current();
    }, 2300);
    const done = setTimeout(() => doneRef.current(), 2300 + 700);
    const skip = () => {
      clearTimeout(lift);
      clearTimeout(done);
      doneRef.current();
    };
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      clearTimeout(lift);
      clearTimeout(done);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  return (
    <Curtain $lifting={lifting} onClick={() => doneRef.current()}>
      <IntroLine $delay={150}>{moduleLabel}</IntroLine>
      <IntroRule aria-hidden />
      <IntroBig $delay={650}>The final project</IntroBig>
      <IntroTitle $delay={1250}>{title}</IntroTitle>
      <IntroSkip>Tap, click or press any key to skip</IntroSkip>
    </Curtain>
  );
};

/* ------------------------------- styles ------------------------------- */

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

const drift = keyframes`
  0% { transform: translate3d(-10%, -6%, 0) scale(1); }
  50% { transform: translate3d(8%, 6%, 0) scale(1.15); }
  100% { transform: translate3d(-10%, -6%, 0) scale(1); }
`;

const rise = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
`;

const sheen = keyframes`
  from { transform: translateX(-120%) skewX(-20deg); }
  to { transform: translateX(220%) skewX(-20deg); }
`;

const Teaser = styled.section`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: var(--radius-xl);
  background: var(--t-bg);
  color: var(--t-text);
  min-height: clamp(22rem, 52vh, 32rem);
  display: flex;
  align-items: flex-end;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    background: var(--t-cover) center / cover no-repeat;
    opacity: 0.55;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--t-bg) 15%, transparent) 0%,
      var(--t-bg) 85%
    );
  }
`;

const Glow = styled.div`
  position: absolute;
  inset: -30%;
  z-index: -1;
  background:
    radial-gradient(40% 40% at 70% 30%, color-mix(in srgb, var(--t-accent) 55%, transparent), transparent 70%),
    radial-gradient(35% 35% at 20% 80%, color-mix(in srgb, var(--t-accent) 30%, transparent), transparent 70%);
  animation: ${drift} 18s ease-in-out infinite;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const TeaserInner = styled.div`
  position: relative;
  padding: clamp(1.75rem, 5vw, 3.5rem);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: 100%;

  & > * {
    animation: ${rise} 0.8s ${ease} both;
  }
  & > :nth-child(2) { animation-delay: 80ms; }
  & > :nth-child(3) { animation-delay: 160ms; }
  & > :nth-child(4) { animation-delay: 240ms; }
  & > :nth-child(5) { animation-delay: 320ms; }

  @media (prefers-reduced-motion: reduce) {
    & > * {
      animation: none;
    }
  }
`;

const TeaserEyebrow = styled.p`
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--t-text) 70%, var(--t-accent));
`;

const TeaserTitle = styled.h2`
  margin: 0;
  font-family: var(--t-head);
  font-size: clamp(2.4rem, 6vw, 4.75rem);
  line-height: 0.98;
  letter-spacing: -0.02em;
  max-width: 16ch;
  text-wrap: balance;
`;

const TeaserTagline = styled.p`
  margin: 0;
  max-width: 50ch;
  font-size: clamp(1.05rem, 1.8vw, 1.3rem);
  opacity: 0.85;
`;

const TeaserMeta = styled.p`
  margin: 0.25rem 0 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  font-size: 0.95rem;
  opacity: 0.85;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
`;

const CallToAction = styled.button`
  position: relative;
  overflow: hidden;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.05rem 1.75rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--t-accent);
  color: var(--t-accent-text);
  font: inherit;
  font-size: clamp(1.05rem, 1.6vw, 1.2rem);
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 18px 40px -16px color-mix(in srgb, var(--t-accent) 80%, transparent);
  transition: transform 0.3s ${ease}, box-shadow 0.3s ${ease};

  svg {
    font-size: 1.3em;
    transition: transform 0.3s ${ease};
  }

  /* A light sweep every few seconds, so the button reads as the way in. */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
    animation: ${sheen} 3.2s ${ease} 1.2s infinite;
  }

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 24px 50px -16px color-mix(in srgb, var(--t-accent) 90%, transparent);
  }

  &:hover svg {
    transform: translateX(5px);
  }

  &:focus-visible {
    outline: 3px solid var(--t-text);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::after {
      display: none;
    }
  }
`;

const overlayIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-modal, 1000) + 10);
  background: var(--t-bg);
  animation: ${overlayIn} 0.35s ease both;
`;

const Scroller = styled.div`
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  animation: ${overlayIn} 0.6s ease both;
`;

const CloseButton = styled.button`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 60;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-pill);
  border: 1px solid color-mix(in srgb, var(--t-text) 30%, transparent);
  background: color-mix(in srgb, var(--t-bg) 70%, transparent);
  backdrop-filter: blur(10px);
  color: var(--t-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  svg {
    font-size: 1.2rem;
  }

  &:hover {
    background: var(--t-bg);
  }
`;

const Curtain = styled.div<{ $lifting: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background:
    radial-gradient(60% 50% at 50% 50%, color-mix(in srgb, var(--t-accent) 25%, transparent), transparent 70%),
    var(--t-bg);
  color: var(--t-text);
  transition: transform 0.7s cubic-bezier(0.76, 0, 0.24, 1);
  ${({ $lifting }) =>
    $lifting &&
    css`
      transform: translateY(-100%);
    `}
`;

const IntroLine = styled.p<{ $delay: number }>`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0;
  animation: ${rise} 0.8s ${ease} ${({ $delay }) => $delay}ms forwards;
`;

const grow = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const IntroRule = styled.span`
  width: 4rem;
  height: 2px;
  background: var(--t-accent);
  transform: scaleX(0);
  animation: ${grow} 0.6s ${ease} 450ms forwards;
`;

const IntroBig = styled.p<{ $delay: number }>`
  margin: 0;
  font-family: var(--t-head);
  font-size: clamp(2.5rem, 8vw, 6rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  opacity: 0;
  animation: ${rise} 0.9s ${ease} ${({ $delay }) => $delay}ms forwards;
`;

const IntroTitle = styled.p<{ $delay: number }>`
  margin: 0;
  font-family: var(--t-head);
  font-size: clamp(1.3rem, 3vw, 2rem);
  /* The accent alone can be too dark on the cover colour; lift it. */
  color: color-mix(in srgb, var(--t-accent) 55%, var(--t-text));
  opacity: 0;
  animation: ${rise} 0.9s ${ease} ${({ $delay }) => $delay}ms forwards;
`;

const IntroSkip = styled.span`
  position: absolute;
  bottom: 1.5rem;
  font-size: 0.8rem;
  opacity: 0.5;
`;
