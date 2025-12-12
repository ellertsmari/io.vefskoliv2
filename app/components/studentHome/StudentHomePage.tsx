"use client";

import { ExtendedGuideInfo, Module, ReviewStatus, ReturnStatus } from "types/guideTypes";
import GuideCard from "../../guides/components/guideCard/GuideCard";
import {
  HomeContainer,
  Section,
  SectionTitle,
  SectionSubtitle,
  ProgressSection,
  ProgressBar,
  ProgressLabel,
  ProgressValue,
  ModuleProgress,
  ModuleProgressBar,
  ModuleProgressLabel,
  ModuleProgressValue,
  GradeSection,
  GradeCard,
  GradeTitle,
  GradeValue,
  EmptyState
} from "./style";
import { useState, useMemo } from "react";

interface StudentHomePageProps {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}

export const StudentHomePage = ({ extendedGuides, modules }: StudentHomePageProps) => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Organize guides by priority
  const organizedGuides = useMemo(() => {
    // 1. Guides that need review (only for guides you've already returned)
    const guidesNeedingReview = extendedGuides.filter(guide =>
      guide.reviewStatus === ReviewStatus.NEED_TO_REVIEW &&
      (guide.returnStatus === ReturnStatus.PASSED ||
       guide.returnStatus === ReturnStatus.HALL_OF_FAME ||
       guide.returnStatus === ReturnStatus.FAILED ||
       guide.returnStatus === ReturnStatus.AWAITING_REVIEWS)
    );

    // 2. Next guide in sequence that hasn't been returned
    const nextGuideToReturn = getNextGuideToReturn(extendedGuides);

    return {
      guidesNeedingReview,
      nextGuideToReturn
    };
  }, [extendedGuides]);

  // Calculate progress for each module (exclude modules 0 and 2)
  const moduleProgress = useMemo(() => {
    return modules
      .filter(module => module.number !== 0 && module.number !== 2)
      .map(module => {
        const moduleGuides = extendedGuides.filter(guide => 
          +guide.module.title[0] === module.number
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

  // Calculate overall course progress (exclude modules 0 and 2)
  const overallProgress = useMemo(() => {
    const relevantGuides = extendedGuides.filter(guide => 
      +guide.module.title[0] !== 0 && +guide.module.title[0] !== 2
    );
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
          +guide.module.title[0] === module.number
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
      {/* Header */}
      <Section>
        <SectionTitle>Welcome back!</SectionTitle>
        <SectionSubtitle>Here&apos;s what you need to focus on today</SectionSubtitle>
      </Section>

      {/* Main Content Area - Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column - Action Items */}
        <div>
          {/* Priority 1: Guides needing review */}
          {organizedGuides.guidesNeedingReview.length > 0 && (
            <Section style={{ marginBottom: '1.5rem' }}>
              <SectionTitle style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📝 Give Reviews</SectionTitle>
              <SectionSubtitle style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                Help peers by providing reviews.
              </SectionSubtitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {organizedGuides.guidesNeedingReview.map((guide, index) => (
                  <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
                ))}
              </div>
            </Section>
          )}

          {/* Priority 2: Next guide to return */}
          {organizedGuides.nextGuideToReturn && (
            <Section style={{ marginBottom: '1.5rem' }}>
              <SectionTitle style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📚 Continue Learning</SectionTitle>
              <SectionSubtitle style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                Next guide in your learning sequence.
              </SectionSubtitle>
              <GuideCard 
                key={organizedGuides.nextGuideToReturn._id.toString()} 
                guide={organizedGuides.nextGuideToReturn} 
                order={getGuideDisplayOrder(organizedGuides.nextGuideToReturn, extendedGuides)} 
              />
            </Section>
          )}

          {/* Empty State */}
          {organizedGuides.guidesNeedingReview.length === 0 &&
           !organizedGuides.nextGuideToReturn && (
            <EmptyState>
              <SectionTitle>🎉 All caught up!</SectionTitle>
              <SectionSubtitle>
                You&apos;ve completed all your current tasks. Great job!
              </SectionSubtitle>
            </EmptyState>
          )}
        </div>

        {/* Right Column - Progress & Grades */}
        <div>
          {/* Progress Section */}
          <ProgressSection style={{ marginBottom: '2rem' }}>
            <SectionTitle style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📊 Progress</SectionTitle>
            
            {/* Overall Progress */}
            <div style={{ marginBottom: '1.5rem' }}>
              <ProgressLabel style={{ fontSize: '0.9rem' }}>Overall Course</ProgressLabel>
              <ProgressBar>
                <ProgressValue style={{ width: `${overallProgress}%` }}>
                  {overallProgress}%
                </ProgressValue>
              </ProgressBar>
            </div>

            {/* Module Progress */}
            <div style={{ marginBottom: '1rem' }}>
              <ProgressLabel style={{ fontSize: '0.9rem' }}>By Module</ProgressLabel>
              {moduleProgress.map((module) => (
                <ModuleProgress key={module.number} style={{ marginBottom: '0.5rem' }}>
                  <ModuleProgressLabel style={{ fontSize: '0.8rem' }}>
                    Module {module.number} ({module.completedGuides}/{module.totalGuides})
                  </ModuleProgressLabel>
                  <ModuleProgressBar>
                    <ModuleProgressValue style={{ width: `${module.progress}%` }}>
                      {module.progress}%
                    </ModuleProgressValue>
                  </ModuleProgressBar>
                </ModuleProgress>
              ))}
            </div>
          </ProgressSection>

          {/* Grades Section */}
          <GradeSection>
            <SectionTitle style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🎯 Grades</SectionTitle>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {moduleGrades.slice(0, 3).map((moduleGrade) => (
                <GradeCard key={moduleGrade.module.number} style={{ padding: '0.75rem' }}>
                  <GradeTitle style={{ fontSize: '0.9rem' }}>Module {moduleGrade.module.number}</GradeTitle>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <div>
                      <span style={{ color: 'var(--primary-black-60)', fontSize: '12px' }}>Coding:</span>
                      <GradeValue style={{ fontSize: '0.85rem' }}>
                        {moduleGrade.codingAverage !== null ? moduleGrade.codingAverage : 'N/A'}
                      </GradeValue>
                    </div>
                    <div>
                      <span style={{ color: 'var(--primary-black-60)', fontSize: '12px' }}>Design:</span>
                      <GradeValue style={{ fontSize: '0.85rem' }}>
                        {moduleGrade.designAverage !== null ? moduleGrade.designAverage : 'N/A'}
                      </GradeValue>
                    </div>
                  </div>
                </GradeCard>
              ))}
            </div>
          </GradeSection>
        </div>
      </div>
    </HomeContainer>
  );
};

// Helper function to calculate final grades with specialty guide replacement logic
function calculateFinalGrades(regularGuides: ExtendedGuideInfo[], specialtyGuides: ExtendedGuideInfo[]): number[] {
  // Get grades from regular guides that have grades
  const regularGuidesWithGrades = regularGuides
    .filter(guide => guide.grade !== undefined)
    .map(guide => ({ guide, grade: guide.grade! }));
  
  // Get grades from specialty guides that have grades
  const specialtyGuidesWithGrades = specialtyGuides
    .filter(guide => guide.grade !== undefined)
    .map(guide => ({ guide, grade: guide.grade! }));
  
  // If no specialty guides, just return regular grades
  if (specialtyGuidesWithGrades.length === 0) {
    return regularGuidesWithGrades.map(item => item.grade);
  }
  
  // Start with regular guides
  let finalGrades = [...regularGuidesWithGrades];
  
  // For each specialty guide, apply replacement logic
  for (const specialtyItem of specialtyGuidesWithGrades) {
    // Check if there are unreturned regular guides (guides without grades)
    const unreturnedRegularGuides = regularGuides.filter(guide => guide.grade === undefined);
    
    if (unreturnedRegularGuides.length > 0) {
      // Replace an unreturned guide by just adding the specialty grade
      finalGrades.push(specialtyItem);
    } else {
      // All regular guides are returned, replace the lowest grade if specialty grade is better
      if (finalGrades.length > 0) {
        const lowestGradeIndex = finalGrades.reduce((minIndex, current, index, array) => 
          current.grade < array[minIndex].grade ? index : minIndex, 0);
        
        if (specialtyItem.grade > finalGrades[lowestGradeIndex].grade) {
          finalGrades[lowestGradeIndex] = specialtyItem;
        }
      } else {
        // No regular guides with grades, just add specialty grade
        finalGrades.push(specialtyItem);
      }
    }
  }
  
  return finalGrades.map(item => item.grade);
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
