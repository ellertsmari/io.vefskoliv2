"use client";

import { CSSProperties, Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { BriefProject } from "types/groupTypes";
import {
  BRIEF_SECTIONS,
  BriefSectionKey,
  briefDisplayTitle,
  briefFontUrls,
} from "constants/projectBrief";
import { DISCIPLINE_META, rubricForProject } from "constants/groupWork";
import { SITE_NAME } from "constants/site";
import { useBriefMotion, useReadingProgress } from "./useBriefMotion";
import * as S from "./briefStyles";

type Props = {
  project: BriefProject;
  /** Inside the LMS: a rounded panel instead of a full page. */
  embedded?: boolean;
  /** Teachers editing: edit buttons on each part, empty sections shown. */
  onEditSection?: (key: BriefSectionKey) => void;
  onEditLook?: () => void;
  /** Unpublished page seen by a teacher. */
  previewBanner?: string | null;
  /** Link out to the public page from the LMS. */
  publicUrl?: string | null;
  /** Opened full-screen from the LMS: ends with a way back, not a footer. */
  onClose?: () => void;
};

const dateFmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  // Iceland is UTC all year; pinning it keeps server and browser identical.
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

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
  return { value: teamSize, label: "team" };
};

export const BriefView = ({
  project,
  embedded = false,
  onEditSection,
  onEditLook,
  previewBanner,
  publicUrl,
  onClose,
}: Props) => {
  const { brief } = project;
  const theme = brief.theme;
  const editing = !!onEditSection;
  const rootRef = useRef<HTMLElement>(null);

  const rubric = rubricForProject(project.rubric);

  /** Sections in their fixed order; empty ones only while editing. */
  const sections = useMemo(
    () =>
      BRIEF_SECTIONS.map((meta) => {
        const stored = brief.sections.find((s) => s.key === meta.key);
        return {
          ...meta,
          title: stored?.title || meta.defaultTitle,
          html: stored?.html || "",
        };
      }).filter((s) => editing || s.automatic || s.html),
    [brief.sections, editing]
  );

  const sectionIds = sections.map((s) => `brief-${s.key}`);
  const active = useBriefMotion(rootRef, sectionIds, brief);
  const progress = useReadingProgress(rootRef);

  // Only known after hydration, so server and first client render agree.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const weeks = Math.max(1, Math.round((end - start) / (7 * DAY)));

  const facts: Array<{ value: string; label: string; count?: number }> = [];
  if (brief.teamSize) facts.push(splitTeamSize(brief.teamSize));
  facts.push({ value: String(weeks), label: weeks === 1 ? "week" : "weeks", count: weeks });
  if (project.presentationLength) {
    facts.push({
      value: String(project.presentationLength),
      label: "minute presentation",
      count: project.presentationLength,
    });
  }
  if (project.presentationDate) {
    facts.push({
      value: dateFmt(project.presentationDate, { day: "numeric", month: "short" }),
      label: "presentation day",
    });
  }
  facts.push({ value: String(rubric.length), label: "graded criteria", count: rubric.length });

  const points = [
    { label: "Kick-off", iso: project.startDate },
    ...(project.presentationDate
      ? [{ label: "Presentations", iso: project.presentationDate }]
      : []),
    { label: "Wrap-up", iso: project.endDate },
  ];
  const done =
    now === null ? 0 : Math.min(1, Math.max(0, (now - start) / (end - start || 1)));

  const panelPercent = Math.round(project.panelWeight * 100);

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

  const words = briefDisplayTitle(project.title).split(/\s+/);

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

  const automaticContent = (key: BriefSectionKey) => {
    if (key === "timeline") {
      return (
        <S.Timeline
          style={{ "--points": points.length, "--done": done } as CSSProperties}
          aria-label="Project dates"
        >
          {points.map((point) => (
            <S.TimelinePoint
              key={point.label}
              $passed={now !== null && new Date(point.iso).getTime() <= now}
              data-animate="fade-up"
            >
              <strong>{dateFmt(point.iso, { day: "numeric", month: "short" })}</strong>
              <span>
                {point.label} · {dateFmt(point.iso, { weekday: "long" })}
              </span>
            </S.TimelinePoint>
          ))}
        </S.Timeline>
      );
    }
    if (key === "grading") {
      return (
        <>
          <S.WeightBar
            role="img"
            aria-label={`Teachers and judges ${panelPercent}%, student audience ${100 - panelPercent}%`}
          >
            <S.WeightPart $tone="accent" style={{ flexBasis: `${panelPercent}%` }}>
              Teachers & judges {panelPercent}%
            </S.WeightPart>
            {panelPercent < 100 && (
              <S.WeightPart $tone="soft" style={{ flexBasis: `${100 - panelPercent}%` }}>
                Audience {100 - panelPercent}%
              </S.WeightPart>
            )}
          </S.WeightBar>
          <S.Note style={{ marginTop: "0.5rem" }}>
            Every team is scored 0–10 on each criterion below by the teachers,
            invited industry judges and the other students.
            {panelPercent === 100 &&
              " Only the teachers' and judges' scores count towards the grade; the students' scores are feedback."}
          </S.Note>
          <S.RubricGrid data-stagger="70">
            {rubric.map((item) => {
              const meta = DISCIPLINE_META[item.discipline ?? "general"];
              return (
                <S.RubricCard key={item.key} $color={meta.color}>
                  <S.Discipline $color={meta.color} $background={meta.background}>
                    {meta.label}
                  </S.Discipline>
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                </S.RubricCard>
              );
            })}
          </S.RubricGrid>
          <S.Note>
            Your own grade is the team&apos;s result adjusted by the contribution
            and teamwork figures your teachers confirm from the teammate ratings.
            An average team member keeps the team&apos;s result.
          </S.Note>
        </>
      );
    }
    return null;
  };

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
        {onEditLook && (
          <S.HeroEdit type="button" onClick={onEditLook}>
            <Icon icon="mdi:palette-outline" aria-hidden /> Cover & theme
          </S.HeroEdit>
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
        {brief.tagline && <S.HeroTagline>{brief.tagline}</S.HeroTagline>}
        <S.Facts>
          {facts.map((fact, index) => (
            <S.Fact key={fact.label} style={{ animationDelay: `${450 + index * 90}ms` }}>
              <dd {...(fact.count !== undefined ? { "data-count": fact.count } : {})}>
                {fact.value}
              </dd>
              <dt>{fact.label}</dt>
            </S.Fact>
          ))}
        </S.Facts>
        {!embedded && sections[0] && (
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
                {onEditSection && (
                  <S.EditButton type="button" onClick={() => onEditSection(section.key)}>
                    <Icon icon="mdi:pencil-outline" aria-hidden /> Edit
                  </S.EditButton>
                )}
              </S.SectionHead>
              {section.html ? (
                <S.Html
                  className="brief-html"
                  data-animate="fade-up"
                  dangerouslySetInnerHTML={{ __html: section.html }}
                />
              ) : (
                editing &&
                !section.automatic && (
                  <S.EmptySection type="button" onClick={() => onEditSection?.(section.key)}>
                    <strong>Empty — click to write it.</strong> {section.hint} Empty
                    sections are hidden from students and the public page.
                  </S.EmptySection>
                )
              )}
              {automaticContent(section.key)}
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
