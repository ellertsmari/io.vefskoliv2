"use client";

import { ExtendedGuideInfo, Module, ReviewStatus, ReturnStatus } from "types/guideTypes";
import { getDiscipline, getIsSpecialty } from "utils/guideTaxonomy";
import GuideCard from "../../guides/components/guideCard/GuideCard";
import {
  HomeContainer,
  MainContent,
  Section,
  SectionTitle,
  SectionSubtitle,
  WidgetHeader,
  GuidesList,
  ProgressBar,
  ProgressLabel,
  ProgressValue,
  ModuleProgress,
  ModuleProgressBar,
  ModuleProgressLabel,
  ModuleProgressValue,
  GradesList,
  GradeCard,
  GradeTitle,
  GradeValues,
  GradeItem,
  GradeLabel,
  GradeValue,
  EmptyState
} from "./style";
import { PageTitle, PageSubtitle, TitleBlock } from "globalStyles/pageStyles";
import { useMemo } from "react";
import { extractModuleNumber } from "utils/moduleUtils";

interface StudentHomePageProps {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}

/** How many upcoming guides the "Continue Learning" widget shows. */
const NEXT_GUIDES_SHOWN = 3;

export const StudentHomePage = ({ extendedGuides, modules }: StudentHomePageProps) => {
  // Organize guides by priority
  const organizedGuides = useMemo(() => {
    // A guide counts as "returned" once the student has submitted it. We only
    // surface review-related prompts for guides the student is actively in.
    const isReturned = (guide: ExtendedGuideInfo) =>
      guide.returnStatus === ReturnStatus.PASSED ||
      guide.returnStatus === ReturnStatus.HALL_OF_FAME ||
      guide.returnStatus === ReturnStatus.FAILED ||
      guide.returnStatus === ReturnStatus.AWAITING_REVIEWS;

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

  // Calculate progress for each module (exclude modules 0, 2 and specialty guides)
  const moduleProgress = useMemo(() => {
    return modules
      .filter(module => module.number !== 0 && module.number !== 2)
      .map(module => {
        const moduleGuides = extendedGuides.filter(guide =>
          extractModuleNumber(guide.module.title) === module.number && !isSpecialtyGuide(guide)
        );
        const completedGuides = moduleGuides.filter(guide =>
          guide.returnStatus === ReturnStatus.PASSED ||
          guide.returnStatus === ReturnStatus.HALL_OF_FAME ||
          guide.returnStatus === ReturnStatus.AWAITING_REVIEWS
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

  // Calculate overall course progress (exclude modules 0, 2 and specialty guides)
  const overallProgress = useMemo(() => {
    const relevantGuides = extendedGuides.filter(guide => {
      const moduleNumber = extractModuleNumber(guide.module.title);
      return moduleNumber !== 0 && moduleNumber !== 2 && !isSpecialtyGuide(guide);
    });
    const totalGuides = relevantGuides.length;
    const completedGuides = relevantGuides.filter(guide =>
      guide.returnStatus === ReturnStatus.PASSED ||
      guide.returnStatus === ReturnStatus.HALL_OF_FAME ||
      guide.returnStatus === ReturnStatus.AWAITING_REVIEWS
    ).length;
    return totalGuides > 0 ? Math.round((completedGuides / totalGuides) * 100) : 0;
  }, [extendedGuides]);

  // Calculate average grades by module and category with specialty guide logic
  const moduleGrades = useMemo(() => {
    return modules
      .filter(module => module.number !== 0 && module.number !== 2) // Exclude modules 0 and 2
      .map(module => {
        const moduleGuides = extendedGuides.filter(guide =>
          extractModuleNumber(guide.module.title) === module.number
        );
        
        // Separate regular and specialty guides by discipline.
        const isCoding = (g: ExtendedGuideInfo) => getDiscipline(g) === 'code';
        const isDesign = (g: ExtendedGuideInfo) => getDiscipline(g) === 'design';
        const regularCodingGuides = moduleGuides.filter(g => isCoding(g) && !getIsSpecialty(g));
        const specialtyCodingGuides = moduleGuides.filter(g => isCoding(g) && getIsSpecialty(g));
        const regularDesignGuides = moduleGuides.filter(g => isDesign(g) && !getIsSpecialty(g));
        const specialtyDesignGuides = moduleGuides.filter(g => isDesign(g) && getIsSpecialty(g));
        
        // Calculate final coding grades with specialty logic
        const finalCodingGrades = calculateFinalGrades(regularCodingGuides, specialtyCodingGuides);
        const finalDesignGrades = calculateFinalGrades(regularDesignGuides, specialtyDesignGuides);
        
        return {
          module,
          codingAverage: finalCodingGrades.length > 0 
            ? Math.round(finalCodingGrades.reduce((a, b) => a + b, 0) / finalCodingGrades.length * 10) / 10
            : null,
          designAverage: finalDesignGrades.length > 0 
            ? Math.round(finalDesignGrades.reduce((a, b) => a + b, 0) / finalDesignGrades.length * 10) / 10
            : null
        };
      });
  }, [extendedGuides, modules]);

  const hasNothingToDo =
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
        Widgets are placed by span on a 12-column grid. To add one, drop in a
        <Section $span={n}> — the row packing takes care of itself.
        Order: what needs doing, then where you stand, then passive info.
      */}
      <MainContent>
        {/* Priority 1: peer reviews owed — time-sensitive, needs room for cards */}
        {organizedGuides.guidesNeedingReview.length > 0 && (
          <Section $span={12}>
            <WidgetHeader>
              <SectionTitle>Give Reviews</SectionTitle>
              <SectionSubtitle>Help peers by providing reviews</SectionSubtitle>
            </WidgetHeader>
            <GuidesList>
              {organizedGuides.guidesNeedingReview.map((guide, index) => (
                <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
              ))}
            </GuidesList>
          </Section>
        )}

        {/* Priority 2: what to work on next, best first */}
        {organizedGuides.nextGuidesToReturn.length > 0 && (
          <Section $span={8}>
            <WidgetHeader>
              <SectionTitle>Continue Learning</SectionTitle>
              <SectionSubtitle>
                {organizedGuides.nextGuidesToReturn.length === 1
                  ? "Next guide in your sequence"
                  : "Next guides in your sequence"}
              </SectionSubtitle>
            </WidgetHeader>
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

        {/* Progress */}
        <Section $span={4}>
          <WidgetHeader>
            <SectionTitle>Progress</SectionTitle>
          </WidgetHeader>

          <div style={{ marginBottom: "0.75rem" }}>
            <ProgressLabel>Overall</ProgressLabel>
            <ProgressBar>
              <ProgressValue style={{ width: `${Math.max(overallProgress, 5)}%` }}>
                {overallProgress}%
              </ProgressValue>
            </ProgressBar>
          </div>

          <ProgressLabel style={{ marginBottom: "0.35rem" }}>By Module</ProgressLabel>
          {moduleProgress.map((module) => (
            <ModuleProgress key={module.number}>
              <ModuleProgressLabel>
                M{module.number} ({module.completedGuides}/{module.totalGuides})
              </ModuleProgressLabel>
              <ModuleProgressBar>
                <ModuleProgressValue style={{ width: `${Math.max(module.progress, 5)}%` }}>
                  {module.progress}%
                </ModuleProgressValue>
              </ModuleProgressBar>
            </ModuleProgress>
          ))}
        </Section>

        {/* Grades — full width so the module cards tile instead of leaving
            two thirds of the row empty next to Continue Learning + Progress */}
        <Section $span={12}>
          <WidgetHeader>
            <SectionTitle>Grades</SectionTitle>
          </WidgetHeader>

          <GradesList>
            {moduleGrades.map((moduleGrade) => (
              <GradeCard key={moduleGrade.module.number}>
                <GradeTitle>Module {moduleGrade.module.number}</GradeTitle>
                <GradeValues>
                  <GradeItem>
                    <GradeLabel>Code:</GradeLabel>
                    <GradeValue>
                      {moduleGrade.codingAverage !== null ? moduleGrade.codingAverage : "-"}
                    </GradeValue>
                  </GradeItem>
                  <GradeItem>
                    <GradeLabel>Design:</GradeLabel>
                    <GradeValue>
                      {moduleGrade.designAverage !== null ? moduleGrade.designAverage : "-"}
                    </GradeValue>
                  </GradeItem>
                </GradeValues>
              </GradeCard>
            ))}
          </GradesList>
        </Section>

        {/* Passive: nothing to act on here, so it sits last */}
        {organizedGuides.guidesAwaitingProjects.length > 0 && (
          <Section $span={12}>
            <WidgetHeader>
              <SectionTitle>Waiting for Projects to Review</SectionTitle>
              <SectionSubtitle>
                You still owe reviews on these guides, but no peer projects are
                available yet. There&apos;s nothing to do right now &mdash; we&apos;ll
                surface them under &ldquo;Give Reviews&rdquo; as soon as a project shows up.
              </SectionSubtitle>
            </WidgetHeader>
            <GuidesList>
              {organizedGuides.guidesAwaitingProjects.map((guide, index) => (
                <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
              ))}
            </GuidesList>
          </Section>
        )}

        {hasNothingToDo && (
          <EmptyState $span={12}>
            <WidgetHeader>
              <SectionTitle>All caught up</SectionTitle>
              <SectionSubtitle>
                You&apos;ve completed all your current tasks. Great job!
              </SectionSubtitle>
            </WidgetHeader>
          </EmptyState>
        )}
      </MainContent>
    </HomeContainer>
  );
};

// Helper function to calculate final grades with specialty guide replacement logic.
// Regular guides are required: unfinished ones count as 0 so the denominator is the
// full set of required guides. Specialty guides are extra — they can only raise the
// score by replacing the lowest current grade, never lower it, and are not counted
// in the denominator themselves.
function calculateFinalGrades(regularGuides: ExtendedGuideInfo[], specialtyGuides: ExtendedGuideInfo[]): number[] {
  const finalGrades = regularGuides.map(guide => guide.grade ?? 0);

  const specialtyGrades = specialtyGuides
    .filter(guide => guide.grade !== undefined)
    .map(guide => guide.grade!);

  for (const specialtyGrade of specialtyGrades) {
    if (finalGrades.length === 0) break;

    const lowestIndex = finalGrades.reduce(
      (minIndex, current, index, array) => current < array[minIndex] ? index : minIndex,
      0
    );

    if (specialtyGrade > finalGrades[lowestIndex]) {
      finalGrades[lowestIndex] = specialtyGrade;
    }
  }

  return finalGrades;
}

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
  const completedGuides = guides.filter(
    (guide) => guide.returnStatus !== ReturnStatus.NOT_RETURNED,
  );
  const unreturnedGuides = guides.filter(
    (guide) => guide.returnStatus === ReturnStatus.NOT_RETURNED,
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
  const completedGuides = allGuides.filter(
    (g) =>
      g.returnStatus === ReturnStatus.PASSED ||
      g.returnStatus === ReturnStatus.HALL_OF_FAME ||
      g.returnStatus === ReturnStatus.FAILED ||
      g.returnStatus === ReturnStatus.AWAITING_REVIEWS,
  );

  return completedGuides.length + 1 + queueIndex;
}
