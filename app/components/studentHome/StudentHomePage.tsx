"use client";

import { ExtendedGuideInfo, Module, ReviewStatus, ReturnStatus } from "types/guideTypes";
import { getIsSpecialty } from "utils/guideTaxonomy";
import GuideCard from "../../guides/components/guideCard/GuideCard";
import {
  HomeContainer,
  MainContent,
  StatusRow,
  WorkRow,
  Section,
  SectionSubtitle,
  WidgetHeading,
  GuidesList,
  ProgressBar,
  ProgressFill,
  ProgressRow,
  ProgressLabel,
  ProgressAmount,
  OverallProgress,
  ProgressGroupLabel,
  ModuleProgress,
  ModuleProgressList,
  ModuleProgressBar,
  ModuleProgressLabel,
  GradesList,
  GradeCard,
  GradeTitle,
  GradeValues,
  GradeItem,
  GradeLabel,
  GradeValue,
  ScoreStats,
  StatTile,
  StatValue,
  StatLabel,
  LeaderboardSlot,
  LeaderboardNote,
  EmptyState,
  HowGradingWorksSlot,
  HowGradingWorksButton
} from "./style";
import {
  ProgressIcon,
  GradesIcon,
  ScoreIcon,
  ReviewsIcon,
  ContinueIcon,
  WaitingIcon,
  CaughtUpIcon,
} from "./icons";
import { PageTitle, PageSubtitle, TitleBlock } from "globalStyles/pageStyles";
import { Suspense, lazy, useMemo } from "react";
import {
  calculateModuleGrades,
  countsTowardProgress,
  isCountedModule,
  isHandedIn,
} from "utils/guideUtils";
import type { GroupProjectListItem } from "types/groupTypes";
import { GroupWorkWidget, groupWorkItems } from "./GroupWorkWidget";
import Modal from "UIcomponents/modal/modal";
import { LoadingSpinner } from "UIcomponents/states/States";

// The walkthrough is a sizeable client component and most visits never open
// it, so it stays out of the dashboard bundle until asked for — the same
// pattern the guide modal uses.
const GradingSlideshow = lazy(() =>
  import("../../LMS/docs/GradingSlideshow").then((mod) => ({
    default: mod.GradingSlideshow,
  }))
);

interface StudentHomePageProps {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
  /** The student's group projects, for the "what does it need from me" widget. */
  groupProjects?: GroupProjectListItem[];
}

/** How many upcoming guides the "Continue Learning" widget shows. */
const NEXT_GUIDES_SHOWN = 3;

export const StudentHomePage = ({
  extendedGuides,
  modules,
  groupProjects = [],
}: StudentHomePageProps) => {
  // Organize guides by priority
  const organizedGuides = useMemo(() => {
    // Review-related prompts only for guides the student has handed in.
    const isReturned = (guide: ExtendedGuideInfo) =>
      isHandedIn(guide.returnStatus);

    // 1. Guides that need review (only for guides you've already returned)
    const guidesNeedingReview = extendedGuides.filter(guide =>
      guide.reviewStatus === ReviewStatus.NEED_TO_REVIEW && isReturned(guide)
    );

    // 2. Returned guides where the student still owes reviews but no projects
    //    are available to review yet. There's nothing for them to do here except
    //    wait, so we show this separately from "Give Reviews" to make it clear
    //    the ball isn't in their court.
    const guidesAwaitingProjects = extendedGuides.filter(guide =>
      guide.reviewStatus === ReviewStatus.AWAITING_PROJECTS && isReturned(guide)
    );

    // 3. The next few guides in sequence that haven't been returned
    const nextGuidesToReturn = getNextGuidesToReturn(
      extendedGuides,
      NEXT_GUIDES_SHOWN,
    );

    return {
      guidesNeedingReview,
      guidesAwaitingProjects,
      nextGuidesToReturn
    };
  }, [extendedGuides]);

  // Helper to check if a guide is a specialty guide (reads the canonical axis,
  // falling back to deriving from the legacy category — see utils/guideTaxonomy).
  const isSpecialtyGuide = (guide: ExtendedGuideInfo) => getIsSpecialty(guide);

  // Calculate progress for each module (counted modules, no specialty guides)
  const moduleProgress = useMemo(() => {
    return modules
      .filter(module => isCountedModule(module.number))
      .map(module => {
        const moduleGuides = extendedGuides.filter(guide =>
          guide.module.number === module.number && !isSpecialtyGuide(guide)
        );
        const completedGuides = moduleGuides.filter(guide =>
          countsTowardProgress(guide.returnStatus)
        );
        const progress = moduleGuides.length > 0 ? (completedGuides.length / moduleGuides.length) * 100 : 0;

        return {
          ...module,
          totalGuides: moduleGuides.length,
          completedGuides: completedGuides.length,
          progress: Math.round(progress)
        };
      });
  }, [extendedGuides, modules]);

  // Calculate overall course progress (counted modules, no specialty guides)
  const overallProgress = useMemo(() => {
    const relevantGuides = extendedGuides.filter(
      guide => isCountedModule(guide.module.number) && !isSpecialtyGuide(guide)
    );
    const totalGuides = relevantGuides.length;
    const completedGuides = relevantGuides.filter(guide =>
      countsTowardProgress(guide.returnStatus)
    ).length;
    return totalGuides > 0 ? Math.round((completedGuides / totalGuides) * 100) : 0;
  }, [extendedGuides]);

  const moduleGrades = useMemo(
    () => calculateModuleGrades(extendedGuides, modules),
    [extendedGuides, modules]
  );

  // Only what the returned guides actually tell us. No derived "points" — the
  // scoring rules aren't decided, and a placeholder number that changed once
  // they were would read as the student having lost score.
  const achievements = useMemo(() => {
    const passed = extendedGuides.filter(
      (guide) =>
        guide.returnStatus === ReturnStatus.PASSED ||
        guide.returnStatus === ReturnStatus.HALL_OF_FAME
    ).length;
    const hallOfFame = extendedGuides.filter(
      (guide) => guide.returnStatus === ReturnStatus.HALL_OF_FAME
    ).length;
    const returned = extendedGuides.filter((guide) =>
      isHandedIn(guide.returnStatus)
    ).length;

    return { passed, hallOfFame, returned };
  }, [extendedGuides]);

  const hasNothingToDo =
    groupWorkItems(groupProjects).length === 0 &&
    organizedGuides.guidesNeedingReview.length === 0 &&
    organizedGuides.guidesAwaitingProjects.length === 0 &&
    organizedGuides.nextGuidesToReturn.length === 0;

  return (
    <HomeContainer>
      <TitleBlock>
        <PageTitle>Welcome back</PageTitle>
        <PageSubtitle>Here&apos;s what you need to focus on today</PageSubtitle>
      </TitleBlock>

      {/*
        Where you stand first, then what to do about it. Progress and grades sit
        in a row directly under the greeting so they are readable without
        hunting; the actionable widgets stack full-width underneath.

        To add a widget, drop a <Section> into the status row or the stack below.
      */}
      <MainContent>
        <StatusRow>
          <Section>
            <WidgetHeading
              title="Progress"
              accent="blue"
              icon={<ProgressIcon />}
              help={
                <>
                  How far through each module you are. A bar fills as you return guides and they pass review.
                </>
              }
            />
            <OverallProgress>
              <ProgressRow>
                <ProgressLabel>Overall</ProgressLabel>
                <ProgressAmount>{overallProgress}%</ProgressAmount>
              </ProgressRow>
              {/* No Math.max floor on the width any more: padding an empty bar
                  out to 5% showed progress the student hasn't made. */}
              <ProgressBar
                role="progressbar"
                aria-valuenow={overallProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall course progress"
              >
                <ProgressFill style={{ width: `${overallProgress}%` }} />
              </ProgressBar>
            </OverallProgress>

            <ProgressGroupLabel>By module</ProgressGroupLabel>
            <ModuleProgressList>
              {moduleProgress.map((module) => (
              <ModuleProgress key={module.number}>
                <ProgressRow>
                  <ModuleProgressLabel>Module {module.number}</ModuleProgressLabel>
                  <ProgressAmount>
                    {module.completedGuides}/{module.totalGuides}
                  </ProgressAmount>
                </ProgressRow>
                <ModuleProgressBar
                  role="progressbar"
                  aria-valuenow={module.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Module ${module.number} progress`}
                >
                  <ProgressFill style={{ width: `${module.progress}%` }} />
                </ModuleProgressBar>
                </ModuleProgress>
              ))}
            </ModuleProgressList>
          </Section>

          <Section>
            <WidgetHeading
              title="Grades"
              accent="violet"
              icon={<GradesIcon />}
              help={
                <>
                  Progress, not a report card — guides you haven&apos;t returned
                  count as 0, so this climbs as you go.
                </>
              }
              /* Sits beside the question mark rather than behind it. A low
                 number here alarms students every term, and the walkthrough
                 that explains it away is no use hidden too. */
              actions={
                <HowGradingWorksSlot>
                  <Modal
                    size="lg"
                    modalTrigger={
                      <HowGradingWorksButton type="button" aria-haspopup="dialog">
                        How is this calculated?
                      </HowGradingWorksButton>
                    }
                    modalContent={
                      <Suspense
                        fallback={<LoadingSpinner label="Opening walkthrough…" />}
                      >
                        <GradingSlideshow />
                      </Suspense>
                    }
                  />
                </HowGradingWorksSlot>
              }
            />

            <GradesList>
              {moduleGrades.map((moduleGrade) => (
                <GradeCard key={moduleGrade.module.number}>
                  <GradeTitle>Module {moduleGrade.module.number}</GradeTitle>
                  <GradeValues>
                    <GradeItem>
                      <GradeLabel>Code</GradeLabel>
                      <GradeValue>
                        {moduleGrade.codingAverage !== null ? moduleGrade.codingAverage : "-"}
                      </GradeValue>
                    </GradeItem>
                    <GradeItem>
                      <GradeLabel>Design</GradeLabel>
                      <GradeValue>
                        {moduleGrade.designAverage !== null ? moduleGrade.designAverage : "-"}
                      </GradeValue>
                    </GradeItem>
                  </GradeValues>
                </GradeCard>
              ))}
            </GradesList>
          </Section>

          <Section>
            <WidgetHeading
              title="Score"
              accent="amber"
              icon={<ScoreIcon />}
              help={
                <>
                  What you&apos;ve earned so far. Points and ranking are on the way.
                </>
              }
            />

            <ScoreStats>
              <StatTile>
                <StatValue>{achievements.passed}</StatValue>
                <StatLabel>Passed</StatLabel>
              </StatTile>
              <StatTile>
                <StatValue>{achievements.hallOfFame}</StatValue>
                <StatLabel>Hall of fame</StatLabel>
              </StatTile>
              <StatTile>
                <StatValue>{achievements.returned}</StatValue>
                <StatLabel>Returned</StatLabel>
              </StatTile>
            </ScoreStats>

            <LeaderboardSlot>
              <ProgressGroupLabel>Leaderboard</ProgressGroupLabel>
              {/* Deliberately empty rather than seeded with example names: a
                  fake ranking is indistinguishable from a real one. */}
              <LeaderboardNote>
                Once scoring goes live you&apos;ll see how you&apos;re doing
                against the rest of the class here.
              </LeaderboardNote>
            </LeaderboardSlot>
          </Section>
        </StatusRow>

        {/* Side by side, so what to work on next is on screen rather than
            below a long list of reviews owed. */}
        <WorkRow>
          {/* Priority 0: a group project waiting on the student. Evaluations
              open and close within days, so this outranks the guides. */}
          <GroupWorkWidget projects={groupProjects} />

          {/* Priority 1: peer reviews owed — time-sensitive */}
          {organizedGuides.guidesNeedingReview.length > 0 && (
            <Section>
              <WidgetHeading
                title="Give Reviews"
                accent="rose"
                icon={<ReviewsIcon />}
                help="Guides you have returned that are waiting on a review from you. Reviewing a classmate is part of completing the guide."
              />
              <GuidesList>
                {organizedGuides.guidesNeedingReview.map((guide, index) => (
                  <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
                ))}
              </GuidesList>
            </Section>
          )}

          {/* Priority 2: what to work on next, best first */}
          {organizedGuides.nextGuidesToReturn.length > 0 && (
            <Section>
              <WidgetHeading
                title="Continue Learning"
                accent="teal"
                icon={<ContinueIcon />}
                help={
                  organizedGuides.nextGuidesToReturn.length === 1
                    ? "The next guide in your sequence."
                    : "The next guides in your sequence, in the order we suggest taking them."
                }
              />
              <GuidesList>
                {organizedGuides.nextGuidesToReturn.map((guide, index) => (
                  <GuideCard
                    key={guide._id.toString()}
                    guide={guide}
                    order={getGuideDisplayOrder(extendedGuides, index)}
                  />
                ))}
              </GuidesList>
            </Section>
          )}
        </WorkRow>

        {/* Passive: nothing to act on here, so it sits last */}
          {organizedGuides.guidesAwaitingProjects.length > 0 && (
            <Section>
              <WidgetHeading
                title="Waiting for Projects to Review"
                accent="blue"
                icon={<WaitingIcon />}
                help={
                  <>
                    You still owe reviews on these guides, but no peer projects are
                    available yet. There&apos;s nothing to do right now &mdash; we&apos;ll
                    surface them under &ldquo;Give Reviews&rdquo; as soon as a project shows up.
                  </>
                }
              />
              <GuidesList>
                {organizedGuides.guidesAwaitingProjects.map((guide, index) => (
                  <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
                ))}
              </GuidesList>
            </Section>
          )}

          {hasNothingToDo && (
            <EmptyState>
              {/* No question mark here: the sentence IS the widget, so hiding
                  it would leave an empty card. */}
              <WidgetHeading
                title="All caught up"
                accent="green"
                icon={<CaughtUpIcon />}
              >
                <SectionSubtitle>
                  You&apos;ve completed all your current tasks. Great job!
                </SectionSubtitle>
              </WidgetHeading>
            </EmptyState>
          )}
      </MainContent>
    </HomeContainer>
  );
};

/**
 * The next few guides to work on, best first.
 *
 * Builds one prioritised queue instead of returning on the first match, so the
 * widget can show several. The head of the queue is unchanged from when this
 * returned a single guide — the same Figma/early-stage heuristics run first —
 * and the remainder is filled in by sequence order.
 */
function getNextGuidesToReturn(
  guides: ExtendedGuideInfo[],
  limit: number,
): ExtendedGuideInfo[] {
  // A failed guide still has to be redone, so it is offered again.
  const completedGuides = guides.filter((guide) =>
    countsTowardProgress(guide.returnStatus),
  );
  const unreturnedGuides = guides.filter(
    (guide) => !countsTowardProgress(guide.returnStatus),
  );
  if (unreturnedGuides.length === 0) return [];

  // Guides without an order sort last rather than jumping to the front.
  const bySequence = (a: ExtendedGuideInfo, b: ExtendedGuideInfo) =>
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.title.localeCompare(b.title);

  const queue: ExtendedGuideInfo[] = [];
  const seen = new Set<string>();
  const enqueue = (guide: ExtendedGuideInfo) => {
    const id = guide._id.toString();
    if (!seen.has(id)) {
      seen.add(id);
      queue.push(guide);
    }
  };

  const hasCompletedHTMLCSS = completedGuides.some((guide) => {
    const title = guide.title.toLowerCase();
    return title.includes("html") && title.includes("css");
  });

  if (hasCompletedHTMLCSS) {
    const figmaGuide = unreturnedGuides.find((guide) => {
      const title = guide.title.toLowerCase();
      return title.includes("figma") && title.includes("introduction");
    });
    if (figmaGuide) enqueue(figmaGuide);

    unreturnedGuides
      .filter((guide) => {
        const title = guide.title.toLowerCase();
        return (
          title.includes("introduction") ||
          title.includes("basic") ||
          title.includes("getting started") ||
          (guide.order !== undefined && guide.order <= 2)
        );
      })
      .sort(bySequence)
      .forEach(enqueue);
  }

  // Everything else, in sequence, to top the queue up.
  [...unreturnedGuides].sort(bySequence).forEach(enqueue);

  return queue.slice(0, limit);
}

/**
 * Display position for an upcoming guide: how many are already done, plus its
 * place in the queue. The first card keeps the number it had when this widget
 * showed a single guide.
 */
function getGuideDisplayOrder(
  allGuides: ExtendedGuideInfo[],
  queueIndex: number,
): number {
  const completedGuides = allGuides.filter((g) =>
    countsTowardProgress(g.returnStatus),
  );

  return completedGuides.length + 1 + queueIndex;
}
