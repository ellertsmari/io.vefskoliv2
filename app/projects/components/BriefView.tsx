"use client";

import { CSSProperties, Fragment, ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { BriefProject } from "types/groupTypes";
import { briefFontUrls } from "constants/projectBrief";
import { rubricForProject } from "constants/groupWork";
import { SITE_NAME } from "constants/site";
import { useBriefMotion, useReadingProgress } from "./useBriefMotion";
import {
  FaqSection,
  IdeasSection,
  MissionSection,
  PresentationSection,
  RequirementsSection,
  TimelineSection,
  dateFmt,
} from "./BriefSections";
import { GradingLab } from "./GradingLab";
import * as S from "./briefStyles";

type Props = {
  project: BriefProject;
  /** Inside the LMS: a rounded panel instead of a full page. */
  embedded?: boolean;
  /** A teacher looking at a page that is not public yet. */
  previewBanner?: string | null;
  /** Link out to the public page from the LMS. */
  publicUrl?: string | null;
  /** Opened full-screen from the LMS: ends with a way back, not a footer. */
  onClose?: () => void;
};

const DAY = 24 * 60 * 60 * 1000;

/** "4–5 students" → big "4–5", label "students per team". */
const splitTeamSize = (teamSize: string) => {
  const match = teamSize.match(/^([\d][\d\s–—-]*)\s*(.*)$/);
  if (match) {
    return {
      value: match[1].trim(),
      label: `${match[2].trim() || "people"} per team`,
    };
  }
  return { value: teamSize, label: "" };
};

export const BriefView = ({
  project,
  embedded = false,
  previewBanner,
  publicUrl,
  onClose,
}: Props) => {
  const { brief } = project;
  const theme = brief.theme;
  const rootRef = useRef<HTMLElement>(null);
  const rubric = rubricForProject(project.rubric);

  // Only known after hydration, so server and first client render agree.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const sections: Array<{ key: string; title: string; icon: string; content: ReactNode }> = [
    {
      key: "mission",
      title: "The mission",
      icon: "mdi:compass-outline",
      content: <MissionSection brief={brief} />,
    },
    {
      key: "requirements",
      title: "Requirements",
      icon: "mdi:clipboard-check-outline",
      content: <RequirementsSection brief={brief} />,
    },
    {
      key: "ideas",
      title: "Ideas",
      icon: "mdi:lightbulb-on-outline",
      content: <IdeasSection brief={brief} />,
    },
    {
      key: "timeline",
      title: "Timeline",
      icon: "mdi:timeline-clock-outline",
      content: (
        <TimelineSection
          brief={brief}
          startDate={project.startDate}
          endDate={project.endDate}
          presentationDate={project.presentationDate}
          now={now}
        />
      ),
    },
    {
      key: "presentation",
      title: "Presentation",
      icon: "mdi:presentation",
      content: <PresentationSection brief={brief} rubric={rubric} />,
    },
    {
      key: "grading",
      title: "How it's graded",
      icon: "mdi:scale-balance",
      content: <GradingLab rubric={rubric} panelWeight={project.panelWeight} />,
    },
    ...(brief.faq.length
      ? [
          {
            key: "faq",
            title: "Questions",
            icon: "mdi:help-circle-outline",
            content: <FaqSection brief={brief} />,
          },
        ]
      : []),
  ];

  const sectionIds = sections.map((s) => `brief-${s.key}`);
  const active = useBriefMotion(rootRef, sectionIds);
  const progress = useReadingProgress(rootRef);

  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const weeks = Math.max(1, Math.round((end - start) / (7 * DAY)));
  const minutes =
    brief.presentation.reduce((sum, part) => sum + part.minutes, 0) ||
    project.presentationLength ||
    0;

  const facts: Array<{ value: string; label: string; count?: number }> = [];
  if (brief.teamSize) facts.push(splitTeamSize(brief.teamSize));
  facts.push({ value: String(weeks), label: weeks === 1 ? "week" : "weeks", count: weeks });
  if (minutes) {
    facts.push({ value: String(minutes), label: "minute presentation", count: minutes });
  }
  if (project.presentationDate) {
    facts.push({
      value: dateFmt(project.presentationDate, { day: "numeric", month: "short" }),
      label: "presentation day",
    });
  }
  facts.push({ value: String(rubric.length), label: "graded criteria", count: rubric.length });

  const style = {
    "--b-bg": theme.background,
    "--b-surface": theme.surface,
    "--b-text": theme.text,
    "--b-muted": theme.muted,
    "--b-accent": theme.accent,
    "--b-accent-text": theme.accentText,
    "--b-hero-bg": theme.heroBackground,
    "--b-hero-text": theme.heroText,
    "--b-heading-font": `"${theme.headingFont}"`,
    "--b-body-font": `"${theme.bodyFont}"`,
  } as CSSProperties;

  const words = brief.title.split(/\s+/);

  /**
   * Contents links scroll by script rather than by #hash: inside the LMS the
   * brief may be open full-screen on a #read-brief history entry, which a
   * hash change would replace. The href stays for no-JS readers.
   */
  const jumpTo = (event: React.MouseEvent, key: string) => {
    const target = rootRef.current?.querySelector(`#brief-${key}`);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const moduleLabel = project.module ? `Module ${project.module}` : null;

  return (
    <S.BriefRoot ref={rootRef} style={style} $embedded={embedded}>
      {briefFontUrls(theme).map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      {previewBanner && <S.PreviewBanner>{previewBanner}</S.PreviewBanner>}
      <S.ProgressBar $embedded={embedded} aria-hidden>
        <span style={{ transform: `scaleX(${progress})` }} />
      </S.ProgressBar>

      <S.Hero $embedded={embedded}>
        {brief.coverImage && <S.HeroImage $src={brief.coverImage} aria-hidden />}
        <S.HeroShade $hasImage={!!brief.coverImage} aria-hidden />
        {!embedded && (
          <S.HeroTopLine>
            {onClose ? (
              <span>{SITE_NAME} · {dateFmt(project.startDate, { month: "long", year: "numeric" })}</span>
            ) : (
              <>
                <Link href="/projects">{SITE_NAME} · Group projects</Link>
                <span>{dateFmt(project.startDate, { month: "long", year: "numeric" })}</span>
              </>
            )}
          </S.HeroTopLine>
        )}
        <S.Eyebrow>
          {[moduleLabel, "Group project"].filter(Boolean).join(" · ")}
        </S.Eyebrow>
        <S.HeroTitle>
          {words.map((word, index) => (
            <Fragment key={index}>
              <span style={{ animationDelay: `${80 + index * 70}ms` }}>{word}</span>{" "}
            </Fragment>
          ))}
        </S.HeroTitle>
        <S.HeroTagline>{brief.tagline}</S.HeroTagline>
        <S.Facts>
          {facts.map((fact, index) => (
            <S.Fact key={fact.label || fact.value} style={{ animationDelay: `${450 + index * 90}ms` }}>
              <dd {...(fact.count !== undefined ? { "data-count": fact.count } : {})}>
                {fact.value}
              </dd>
              {fact.label && <dt>{fact.label}</dt>}
            </S.Fact>
          ))}
        </S.Facts>
        {!embedded && (
          <S.ScrollCue
            href={`#brief-${sections[0].key}`}
            aria-label="Read the brief"
            onClick={(event) => jumpTo(event, sections[0].key)}
          >
            <Icon icon="mdi:arrow-down" aria-hidden />
          </S.ScrollCue>
        )}
      </S.Hero>

      <S.BodyFrame>
        <S.Body>
          <S.Rail aria-label="Sections">
            <S.RailLabel>Contents</S.RailLabel>
            {sections.map((section, index) => (
              <S.RailLink
                key={section.key}
                href={`#brief-${section.key}`}
                onClick={(event) => jumpTo(event, section.key)}
                $active={active === `brief-${section.key}`}
                aria-current={active === `brief-${section.key}` ? "true" : undefined}
              >
                <small>{String(index + 1).padStart(2, "0")}</small>
                {section.title}
              </S.RailLink>
            ))}
            {publicUrl && (
              <S.RailAction href={publicUrl} target="_blank" rel="noopener">
                <Icon icon="mdi:open-in-new" aria-hidden /> Public page
              </S.RailAction>
            )}
          </S.Rail>

          <S.Sections>
            {sections.map((section, index) => (
              <S.Section key={section.key} id={`brief-${section.key}`}>
                <S.SectionHead data-animate="fade-up">
                  <S.SectionNumber aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </S.SectionNumber>
                  <S.SectionTitle>
                    <Icon icon={section.icon} aria-hidden />
                    {section.title}
                  </S.SectionTitle>
                </S.SectionHead>
                {section.content}
              </S.Section>
            ))}
          </S.Sections>
        </S.Body>
      </S.BodyFrame>

      {onClose && (
        <S.Finale>
          <p>That&apos;s the brief.</p>
          <h2>Now build something big.</h2>
          <button type="button" onClick={onClose}>
            <Icon icon="mdi:arrow-left" aria-hidden /> Back to the project
          </button>
        </S.Finale>
      )}

      {!embedded && !onClose && (
        <S.Footer>
          <span>
            A group project at{" "}
            <Link href="/">{SITE_NAME}</Link>, the web development programme at
            Tækniskólinn in Reykjavík.
          </span>
          <span>
            <Link href="/projects">All project briefs</Link> ·{" "}
            <Link href="/showcase">See what teams built</Link>
          </span>
        </S.Footer>
      )}
    </S.BriefRoot>
  );
};
