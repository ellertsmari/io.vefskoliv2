"use client";

import { useCallback, useEffect, useState } from "react";
import { useModal } from "UIcomponents/modal/ModalProvider";
import {
  REVIEW_GRACE_PERIOD_DAYS,
  REQUIRED_REVIEWS_COUNT,
  FAIL_THRESHOLD,
  GRADES_TO_AVERAGE,
} from "constants/peerReview";
import {
  FormulaBox,
  StatusBadge,
  GradeScale,
  GradeDescription,
} from "./style";
import {
  SlideshowRoot,
  TopBar,
  ProgressBarTrack,
  ProgressBarFill,
  StepCount,
  SlideStage,
  Slide,
  SlideIcon,
  SlideTitle,
  SlideSubtitle,
  SlideBody,
  Callout,
  Footer,
  Dots,
  Dot,
  NavButton,
  CalcWrap,
  RangeLabel,
  RangeInput,
  RangeValue,
  StackBar,
  StackBase,
  StackReview,
  CalcReadout,
  BigGrade,
  BigGradeLabel,
  PillRow,
  Pill,
  PillDesc,
  DuoGrid,
  DuoCard,
  DuoEmoji,
  DuoHeading,
  DuoText,
} from "./slideshowStyle";

/**
 * Mirrors `calculateGrade` (app/utils/guideUtils.ts): 5 base points for
 * returning + the review-quality average (0–10) rescaled to the 0–5 the review
 * half is worth. That rescale is just halving (x / 10 * 5 === x / 2).
 * Kept inline (not imported) so this client component doesn't pull in mongoose
 * models. If the real formula changes, update this to match.
 */
const computeGrade = (reviewAverage: number): number =>
  Math.round((5 + reviewAverage / 2) * 10) / 10;

const GradeCalculator = () => {
  const [avg, setAvg] = useState(8);
  const grade = computeGrade(avg);
  const reviewWidthPct = (avg / 10) * 50; // review half is worth up to 50% of the bar

  return (
    <CalcWrap>
      <RangeLabel htmlFor="avg-slider">
        Average quality of the reviews you gave:{" "}
        <RangeValue>{avg}/10</RangeValue>
      </RangeLabel>
      <RangeInput
        id="avg-slider"
        type="range"
        min={1}
        max={10}
        step={1}
        value={avg}
        onChange={(e) => setAvg(Number(e.target.value))}
        aria-label="Average review quality"
      />

      <StackBar aria-hidden="true">
        <StackBase>5 · returned</StackBase>
        <StackReview $pct={reviewWidthPct}>
          {reviewWidthPct > 12 ? `+${(grade - 5).toFixed(1)} · reviews` : ""}
        </StackReview>
      </StackBar>

      <CalcReadout>
        <BigGrade>{grade.toFixed(1)}</BigGrade>
        <BigGradeLabel>
          5 (returned) + {avg} ÷ 2 = {grade.toFixed(1)} out of 10
        </BigGradeLabel>
      </CalcReadout>
    </CalcWrap>
  );
};

const qualityBands = [
  {
    label: "1–2",
    text: 'Not helpful — just "good" or "bad" with no explanation.',
  },
  {
    label: "3–4",
    text: "Barely helpful — very short, less than a paragraph.",
  },
  {
    label: "5–6",
    text: "Helpful — points out specific things to improve or that were done well.",
  },
  {
    label: "7–8",
    text: "Very helpful — a thoughtful review with specific advice and suggestions.",
  },
  {
    label: "9–10",
    text: "Exceptional — thorough, with specific advice, suggestions to improve, AND praise for the good parts.",
  },
];

const QualityPicker = () => {
  const [selected, setSelected] = useState(3); // default highlights the 7–8 band

  return (
    <>
      <PillRow role="tablist" aria-label="Review quality levels">
        {qualityBands.map((band, i) => (
          <Pill
            key={band.label}
            role="tab"
            aria-selected={selected === i}
            $active={selected === i}
            onClick={() => setSelected(i)}
          >
            {band.label}
          </Pill>
        ))}
      </PillRow>
      <PillDesc>{qualityBands[selected].text}</PillDesc>
    </>
  );
};

type SlideDef = {
  icon: string;
  title: string;
  subtitle?: string;
  body: React.ReactNode;
};

const slides: SlideDef[] = [
  {
    icon: "🎓",
    title: "How your grades work",
    subtitle: "A 2-minute tour of the peer-review system at Vefskólinn.",
    body: (
      <SlideBody>
        <p>
          Two simple things drive every guide grade: <strong>returning your
          project</strong>, and <strong>giving genuinely helpful reviews</strong>{" "}
          to your classmates.
        </p>
        <p>Let&apos;s walk through exactly how the number is built.</p>
      </SlideBody>
    ),
  },
  {
    icon: "🧩",
    title: "Two things, every guide",
    body: (
      <SlideBody>
        <DuoGrid>
          <DuoCard>
            <DuoEmoji>📦</DuoEmoji>
            <DuoHeading>Return your project</DuoHeading>
            <DuoText>
              Submit your work for the guide. Classmates review it, and it
              passes or fails.
            </DuoText>
          </DuoCard>
          <DuoCard>
            <DuoEmoji>✍️</DuoEmoji>
            <DuoHeading>Give reviews</DuoHeading>
            <DuoText>
              Review classmates&apos; projects with helpful, specific feedback.
            </DuoText>
          </DuoCard>
        </DuoGrid>
        <Callout>
          These are separate! Returning gets <strong>your</strong> project a
          pass/fail. But it&apos;s the <strong>reviews you write</strong> that
          earn most of your grade.
        </Callout>
      </SlideBody>
    ),
  },
  {
    icon: "➕",
    title: "Your guide grade = 5 + up to 5",
    body: (
      <SlideBody>
        <p>Every guide is scored out of 10, in two halves:</p>
        <FormulaBox>
          Grade = 5 (returned) + your review quality ÷ 2
        </FormulaBox>
        <p>
          You get <strong>5 points</strong> just for returning a guide that
          passes. You earn up to <strong>5 more</strong> based on how good the
          reviews <strong>you give</strong> are — graded by your teachers.
        </p>
        <Callout>
          Better reviews → a higher grade. Helping your classmates is literally
          how you score.
        </Callout>
      </SlideBody>
    ),
  },
  {
    icon: "🎚️",
    title: "Try it",
    subtitle: "Drag the slider to see how review quality moves your grade.",
    body: (
      <SlideBody>
        <GradeCalculator />
      </SlideBody>
    ),
  },
  {
    icon: "⭐",
    title: "What earns review points",
    subtitle: "Teachers grade each review 1–10. Tap a level to see what it means.",
    body: (
      <SlideBody>
        <QualityPicker />
        <Callout>
          The fastest way to a high grade: look closely at the project, point to
          specific things, suggest improvements, and call out what&apos;s good.
        </Callout>
      </SlideBody>
    ),
  },
  {
    icon: "🚦",
    title: "What your project status means",
    body: (
      <SlideBody>
        <GradeScale as="div" style={{ gridTemplateColumns: "auto 1fr" }}>
          <StatusBadge $color="#6c757d">Not Returned</StatusBadge>
          <GradeDescription>You haven&apos;t submitted yet.</GradeDescription>

          <StatusBadge $color="#28a745">Awaiting Reviews</StatusBadge>
          <GradeDescription>
            Submitted, waiting for {REQUIRED_REVIEWS_COUNT} peer reviews.
          </GradeDescription>

          <StatusBadge $color="#28a745">Passed</StatusBadge>
          <GradeDescription>Enough reviews, and it passed. 🎉</GradeDescription>

          <StatusBadge $color="#6f42c1">Hall of Fame</StatusBadge>
          <GradeDescription>
            A reviewer recommended it to the gallery.
          </GradeDescription>

          <StatusBadge $color="#dc3545">Failed</StatusBadge>
          <GradeDescription>
            Got {FAIL_THRESHOLD}+ &quot;no pass&quot; votes — fix it and
            resubmit.
          </GradeDescription>
        </GradeScale>
      </SlideBody>
    ),
  },
  {
    icon: "🕒",
    title: "No projects to review? You're covered",
    body: (
      <SlideBody>
        <p>
          To earn full review points you normally give {GRADES_TO_AVERAGE}{" "}
          reviews. But sometimes no classmate projects are available yet —
          that&apos;s not your fault.
        </p>
        <p>
          So if you&apos;re stuck waiting for more than{" "}
          <strong>{REVIEW_GRACE_PERIOD_DAYS} days</strong>, we grade you on the
          reviews you <strong>did</strong> manage to give. You won&apos;t be left
          stuck at 5.
        </p>
        <Callout>
          And if a project shows up later, it can only <strong>help</strong> —
          it will never drop a grade you already earned.
        </Callout>
      </SlideBody>
    ),
  },
  {
    icon: "⏰",
    // Mirrors GRADING_MONTHS in constants/peerReview.ts (May, Aug, Dec).
    title: "Grading months: no waiting",
    body: (
      <SlideBody>
        <p>
          In <strong>May, August, and December</strong> we issue final grades.
          During those months the {REVIEW_GRACE_PERIOD_DAYS}-day wait above is{" "}
          <strong>switched off</strong> — your reviews count toward your grade{" "}
          <strong>right away</strong>, with no grace period.
        </p>
        <p>
          That keeps everyone&apos;s grades accurate and final when they&apos;re
          handed out, so make sure your reviews (and projects) are{" "}
          <strong>done in time</strong> — what&apos;s finished is what gets graded.
        </p>
        <Callout>
          Don&apos;t leave reviews for the last days of a grading month — finish
          early so your grade reflects all your work.
        </Callout>
      </SlideBody>
    ),
  },
  {
    icon: "📈",
    title: "Your Home grade is a progress bar",
    body: (
      <SlideBody>
        <p>
          The grade on your <strong>Home</strong> page is a{" "}
          <strong>living progress view</strong> — not a final report-card grade.
        </p>
        <p>
          Guides you haven&apos;t done yet (and failed ones) count as 0{" "}
          <strong>on purpose</strong>. That way the number climbs as you
          complete and pass more, showing how far you&apos;ve come and what&apos;s
          left.
        </p>
        <p>
          By the time you graduate you&apos;ll have turned in all your guides, so
          there are no 0s left to fill in — at that point this number{" "}
          <strong>becomes your final report-card grade</strong>. The progress bar
          today and your grade at graduation are the same number, just earlier in
          the journey.
        </p>
        <Callout>
          Don&apos;t panic if it looks low early on — that&apos;s completely
          normal. It rises as you go, and lands on your real grade by the end.
        </Callout>
      </SlideBody>
    ),
  },
  {
    icon: "🚀",
    title: "Specialty guides & quick tips",
    body: (
      <SlideBody>
        <p>
          <strong>Specialty guides</strong> are optional. They don&apos;t count
          toward your progress percentage, and a good one can{" "}
          <strong>replace a lower grade</strong> in the same category — a nice
          way to boost your score while exploring what interests you.
        </p>
        <p>To do well:</p>
        <ul>
          <li>Polish your projects before returning them.</li>
          <li>Write specific, constructive reviews — be the reviewer you&apos;d want.</li>
          <li>Review regularly so you&apos;re never stuck waiting.</li>
        </ul>
        <Callout>That&apos;s it — you&apos;ve got this! 💪</Callout>
      </SlideBody>
    ),
  },
];

export const GradingSlideshow = () => {
  const { setIsModalOpen } = useModal();
  const [current, setCurrent] = useState(0);

  const isLast = current === slides.length - 1;
  const isFirst = current === 0;

  // Advance, or close the modal on the last slide. Closing is done here in the
  // event handler — never inside a setState updater, which runs during render
  // and would update ModalProvider mid-render.
  const goNext = useCallback(() => {
    if (isLast) {
      setIsModalOpen(false);
      return;
    }
    setCurrent((c) => Math.min(c + 1, slides.length - 1));
  }, [isLast, setIsModalOpen]);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(0, c - 1));
  }, []);

  // Arrow-key navigation for a slideshow feel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const slide = slides[current];
  const pct = ((current + 1) / slides.length) * 100;

  return (
    <SlideshowRoot>
      <TopBar>
        <ProgressBarTrack>
          <ProgressBarFill $pct={pct} />
        </ProgressBarTrack>
        <StepCount>
          {current + 1} / {slides.length}
        </StepCount>
      </TopBar>

      <SlideStage>
        <Slide key={current}>
          <SlideIcon aria-hidden="true">{slide.icon}</SlideIcon>
          <SlideTitle>{slide.title}</SlideTitle>
          {slide.subtitle && <SlideSubtitle>{slide.subtitle}</SlideSubtitle>}
          {slide.body}
        </Slide>
      </SlideStage>

      <Footer>
        <NavButton
          $variant="ghost"
          onClick={goPrev}
          disabled={isFirst}
          aria-label="Previous slide"
        >
          ← Back
        </NavButton>

        <Dots>
          {slides.map((_, i) => (
            <Dot
              key={i}
              $active={i === current}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </Dots>

        <NavButton $variant="primary" onClick={goNext}>
          {isLast ? "Got it! ✓" : "Next →"}
        </NavButton>
      </Footer>
    </SlideshowRoot>
  );
};
