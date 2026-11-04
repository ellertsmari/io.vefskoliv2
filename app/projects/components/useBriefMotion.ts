"use client";

import { RefObject, useEffect, useState } from "react";

/**
 * Scroll events do not bubble, and inside the LMS the page scrolls in <Main>
 * (overflow: auto), not the window — a plain window listener never fired
 * there, so the contents rail stayed on the first section. Capturing on the
 * window hears a scroll from any container.
 */
const SCROLL_OPTS: AddEventListenerOptions = { passive: true, capture: true };

/**
 * The brief page's motion, driven by attributes on the elements:
 *
 *   data-animate="fade-up|fade-in|zoom-in|slide-left|slide-right|blur-in"
 *   data-delay="200"         — milliseconds before it starts
 *   data-stagger             — on a parent: its children come in one by one
 *   data-count="42"          — counts up from 0 when it scrolls into view
 *   data-parallax="0.15"     — drifts against the scroll by that factor
 *
 * Content is visible without JavaScript (and to crawlers); elements are only
 * hidden once this has run and marked the root `data-motion="on"`. With
 * reduced motion everything is shown at once and nothing moves.
 *
 * Returns the id of the section currently in view, for the side navigation.
 */
export function useBriefMotion(
  rootRef: RefObject<HTMLElement | null>,
  sectionIds: string[]
): string | null {
  const [active, setActive] = useState<string | null>(sectionIds[0] ?? null);
  const idsKey = sectionIds.join("|");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Children of a stagger parent get their own delay and the default motion.
    root.querySelectorAll<HTMLElement>("[data-stagger]").forEach((parent) => {
      const step = Number(parent.dataset.stagger) || 90;
      Array.from(parent.children).forEach((child, index) => {
        const el = child as HTMLElement;
        if (!el.dataset.animate) el.dataset.animate = "fade-up";
        if (!el.dataset.delay) el.dataset.delay = String(index * step);
      });
    });

    const animated = Array.from(
      root.querySelectorAll<HTMLElement>("[data-animate]")
    );
    const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"));

    const runCount = (el: HTMLElement) => {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      const decimals = (el.dataset.count!.split(".")[1] ?? "").length;
      if (reduce) {
        el.textContent = target.toFixed(decimals);
        return;
      }
      const start = performance.now();
      const duration = 1200;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (reduce) {
      animated.forEach((el) => el.classList.add("is-in"));
      counters.forEach(runCount);
    } else {
      animated.forEach((el) => {
        if (el.dataset.delay) el.style.transitionDelay = `${Number(el.dataset.delay) || 0}ms`;
      });
      root.dataset.motion = "on";
      // Counters are written with their final value (what crawlers and
      // no-JS readers see) and count up from zero here.
      counters.forEach((el) => {
        if (!el.dataset.counted) el.textContent = "0";
      });
    }

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("is-in");
          if (el.dataset.count !== undefined) runCount(el);
          reveal.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    if (!reduce) animated.forEach((el) => reveal.observe(el));
    counters.forEach((el) => reveal.observe(el));

    // Parallax, one rAF per scroll.
    const parallax = reduce
      ? []
      : Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const mid = window.innerHeight / 2;
        for (const el of parallax) {
          const factor = Math.max(-1, Math.min(1, Number(el.dataset.parallax) || 0.15));
          const rect = el.getBoundingClientRect();
          const offset = (rect.top + rect.height / 2 - mid) * factor * -1;
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        }
      });
    };
    if (parallax.length) {
      window.addEventListener("scroll", onScroll, SCROLL_OPTS);
      onScroll();
    }

    // Which section is being read: the last one whose top has passed 35%.
    const sections = sectionIds
      .map((id) => root.querySelector<HTMLElement>(`#${CSS.escape(id)}`))
      .filter((el): el is HTMLElement => !!el);
    let spyFrame = 0;
    const spy = () => {
      if (spyFrame) return;
      spyFrame = requestAnimationFrame(() => {
        spyFrame = 0;
        const line = window.innerHeight * 0.35;
        let current = sections[0]?.id ?? null;
        for (const section of sections) {
          if (section.getBoundingClientRect().top <= line) current = section.id;
        }
        // A short last section never reaches the line; once its end is on
        // screen, it is the one being read.
        const last = sections[sections.length - 1];
        if (last && last.getBoundingClientRect().bottom <= window.innerHeight + 2) {
          current = last.id;
        }
        setActive(current);
      });
    };
    window.addEventListener("scroll", spy, SCROLL_OPTS);
    spy();

    return () => {
      reveal.disconnect();
      window.removeEventListener("scroll", onScroll, SCROLL_OPTS);
      window.removeEventListener("scroll", spy, SCROLL_OPTS);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(spyFrame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids compared by value
  }, [rootRef, idsKey]);

  return active;
}

/** How far through the element the reader is, 0–1, for the progress bar. */
export function useReadingProgress(rootRef: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = rootRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        setProgress(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1);
      });
    };
    window.addEventListener("scroll", update, SCROLL_OPTS);
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update, SCROLL_OPTS);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(frame);
    };
  }, [rootRef]);
  return progress;
}
