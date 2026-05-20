"use client";

import { ExtendedGuideInfo, Module, ReviewStatus, ReturnStatus } from "types/guideTypes";
import GuideCard from "../../guides/components/guideCard/GuideCard";
import {
  HomeContainer,
  WelcomeHeader,
  MainContent,
  LeftColumn,
  RightColumn,
  Section,
  SectionTitle,
  SectionSubtitle,
  GuidesList,
  ProgressSection,
  ProgressBar,
  ProgressLabel,
  ProgressValue,
  ModuleProgress,
  ModuleProgressBar,
  ModuleProgressLabel,
  ModuleProgressValue,
  GradeSection,
  GradesList,
  GradeCard,
  GradeTitle,
  GradeValues,
  GradeItem,
  GradeLabel,
  GradeValue,
  EmptyState
} from "./style";
import { useMemo } from "react";
import { extractModuleNumber } from "utils/moduleUtils";

interface StudentHomePageProps {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}

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

    // 3. Next guide in sequence that hasn't been returned
    const nextGuideToReturn = getNextGuideToReturn(extendedGuides);

    return {
      guidesNeedingReview,
      guidesAwaitingProjects,
      nextGuideToReturn
    };
  }, [extendedGuides]);

  // Helper to check if a guide is a specialty guide
  const isSpecialtyGuide = (guide: ExtendedGuideInfo) =>
    guide.category === 'codeSpeciality' || guide.category === 'designSpeciality';

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
        
        // Separate regular and specialty guides
        const regularCodingGuides = moduleGuides.filter(guide => guide.category === 'code');
        const specialtyCodingGuides = moduleGuides.filter(guide => guide.category === 'codeSpeciality');
        const regularDesignGuides = moduleGuides.filter(guide => guide.category === 'design');
        const specialtyDesignGuides = moduleGuides.filter(guide => guide.category === 'designSpeciality');
        
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

  return (
    <HomeContainer>
      <WelcomeHeader>
        <SectionTitle>Welcome back!</SectionTitle>
        <SectionSubtitle>Here&apos;s what you need to focus on today</SectionSubtitle>
      </WelcomeHeader>

      <MainContent>
        <LeftColumn>
          {/* Priority 1: Guides needing review */}
          {organizedGuides.guidesNeedingReview.length > 0 && (
            <Section>
              <SectionTitle>Give Reviews</SectionTitle>
              <SectionSubtitle>Help peers by providing reviews</SectionSubtitle>
              <GuidesList>
                {organizedGuides.guidesNeedingReview.map((guide, index) => (
                  <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
                ))}
              </GuidesList>
            </Section>
          )}

          {/* Priority 2: Next guide to return */}
          {organizedGuides.nextGuideToReturn && (
            <Section>
              <SectionTitle>Continue Learning</SectionTitle>
              <SectionSubtitle>Next guide in your learning sequence</SectionSubtitle>
              <GuideCard
                key={organizedGuides.nextGuideToReturn._id.toString()}
                guide={organizedGuides.nextGuideToReturn}
                order={getGuideDisplayOrder(organizedGuides.nextGuideToReturn, extendedGuides)}
              />
            </Section>
          )}

          {/* Priority 3: Guides waiting for peers' projects to review */}
          {organizedGuides.guidesAwaitingProjects.length > 0 && (
            <Section>
              <SectionTitle>Waiting for Projects to Review</SectionTitle>
              <SectionSubtitle>
                You still owe reviews on these guides, but no peer projects are
                available yet. There&apos;s nothing to do right now &mdash; we&apos;ll
                surface them under &ldquo;Give Reviews&rdquo; as soon as a project shows up.
              </SectionSubtitle>
              <GuidesList>
                {organizedGuides.guidesAwaitingProjects.map((guide, index) => (
                  <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
                ))}
              </GuidesList>
            </Section>
          )}

          {/* Empty State */}
          {organizedGuides.guidesNeedingReview.length === 0 &&
           organizedGuides.guidesAwaitingProjects.length === 0 &&
           !organizedGuides.nextGuideToReturn && (
            <EmptyState>
              <SectionTitle>All caught up!</SectionTitle>
              <SectionSubtitle>
                You&apos;ve completed all your current tasks. Great job!
              </SectionSubtitle>
            </EmptyState>
          )}
        </LeftColumn>

        <RightColumn>
          {/* Progress Section */}
          <ProgressSection>
            <SectionTitle>Progress</SectionTitle>

            <div style={{ marginBottom: '0.75rem' }}>
              <ProgressLabel>Overall</ProgressLabel>
              <ProgressBar>
                <ProgressValue style={{ width: `${Math.max(overallProgress, 5)}%` }}>
                  {overallProgress}%
                </ProgressValue>
              </ProgressBar>
            </div>

            <ProgressLabel style={{ marginBottom: '0.35rem' }}>By Module</ProgressLabel>
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
          </ProgressSection>

          {/* Grades Section */}
          <GradeSection>
            <SectionTitle>Grades</SectionTitle>

            <GradesList>
              {moduleGrades.map((moduleGrade) => (
                <GradeCard key={moduleGrade.module.number}>
                  <GradeTitle>Module {moduleGrade.module.number}</GradeTitle>
                  <GradeValues>
                    <GradeItem>
                      <GradeLabel>Code:</GradeLabel>
                      <GradeValue>
                        {moduleGrade.codingAverage !== null ? moduleGrade.codingAverage : '-'}
                      </GradeValue>
                    </GradeItem>
                    <GradeItem>
                      <GradeLabel>Design:</GradeLabel>
                      <GradeValue>
                        {moduleGrade.designAverage !== null ? moduleGrade.designAverage : '-'}
                      </GradeValue>
                    </GradeItem>
                  </GradeValues>
                </GradeCard>
              ))}
            </GradesList>
          </GradeSection>
        </RightColumn>
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

// Helper function to get the most recently returned module
function getMostRecentModule(guides: ExtendedGuideInfo[]): Module | null {
  const guidesWithReturns = guides.filter(guide => 
    guide.returnsSubmitted && guide.returnsSubmitted.length > 0
  );
  
  if (guidesWithReturns.length === 0) return null;
  
  // Find the guide with the most recent return
  const mostRecentGuide = guidesWithReturns.reduce((latest, current) => {
    const latestReturn = latest.returnsSubmitted.reduce((a, b) => 
      a.createdAt > b.createdAt ? a : b
    );
    const currentReturn = current.returnsSubmitted.reduce((a, b) => 
      a.createdAt > b.createdAt ? a : b
    );
    
    return latestReturn.createdAt > currentReturn.createdAt ? latest : current;
  });
  
  return mostRecentGuide.module;
}

// Helper function to get the next guide in sequence that needs to be returned
function getNextGuideToReturn(guides: ExtendedGuideInfo[]): ExtendedGuideInfo | null {
  // Since module data is missing, let's use a smarter approach
  // Find completed guides and try to infer what should come next
  const completedGuides = guides.filter(guide => 
    guide.returnStatus !== ReturnStatus.NOT_RETURNED
  );
  
  const unreturnedGuides = guides.filter(guide => 
    guide.returnStatus === ReturnStatus.NOT_RETURNED
  );
  
  // If the user has completed HTML & CSS guides, look for the next logical guide
  const hasCompletedHTMLCSS = completedGuides.some(guide => 
    guide.title.toLowerCase().includes('html') && guide.title.toLowerCase().includes('css')
  );
  
  if (hasCompletedHTMLCSS) {
    // Look for Figma or other beginner-level guides that should come after HTML/CSS
    const figmaGuide = unreturnedGuides.find(guide => 
      guide.title.toLowerCase().includes('figma') && 
      guide.title.toLowerCase().includes('introduction')
    );
    
    if (figmaGuide) {
      return figmaGuide;
    }
    
    // If no Figma guide, look for other early-stage guides
    const earlyGuides = unreturnedGuides.filter(guide => {
      const title = guide.title.toLowerCase();
      return title.includes('introduction') || 
             title.includes('basic') || 
             title.includes('getting started') ||
             (guide.order !== undefined && guide.order <= 2);
    });
    
    if (earlyGuides.length > 0) {
      // Sort by order if available, otherwise alphabetically
      earlyGuides.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.title.localeCompare(b.title);
      });
      return earlyGuides[0];
    }
  }
  
  // Fallback: just return the first unreturned guide with the lowest order
  const guidesWithOrder = unreturnedGuides.filter(guide => guide.order !== undefined);
  if (guidesWithOrder.length > 0) {
    guidesWithOrder.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return guidesWithOrder[0];
  }
  
  // Last resort: return any unreturned guide
  return unreturnedGuides[0] || null;
}

// Helper function to calculate a meaningful display order for the guide
function getGuideDisplayOrder(guide: ExtendedGuideInfo, allGuides: ExtendedGuideInfo[]): number {
  // Count how many guides have been completed + 1 for the next guide
  const completedGuides = allGuides.filter(g =>
    g.returnStatus === ReturnStatus.PASSED ||
    g.returnStatus === ReturnStatus.HALL_OF_FAME ||
    g.returnStatus === ReturnStatus.FAILED ||
    g.returnStatus === ReturnStatus.AWAITING_REVIEWS
  );
  
  // This should be the next guide in sequence
  return completedGuides.length + 1;
}
