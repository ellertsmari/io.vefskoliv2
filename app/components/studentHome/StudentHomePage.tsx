"use client";

import { ExtendedGuideInfo, Module, FeedbackStatus, GradesGivenStatus, ReturnStatus } from "types/guideTypes";
import GuideCard from "components/guideCard/GuideCard";
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
    // 1. Most important: Guides that need grading (feedback received but no grade given)
    const guidesNeedingGrade = extendedGuides.filter(guide => 
      guide.gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE
    );

    // 2. Second priority: Guides that need feedback
    const guidesNeedingFeedback = extendedGuides.filter(guide => 
      guide.feedbackStatus === FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK
    );

    // 3. Third priority: Guides from most recently returned module
    const mostRecentModule = getMostRecentModule(extendedGuides);
    const guidesFromRecentModule = extendedGuides.filter(guide => 
      guide.module.number === mostRecentModule?.number
    );

    return {
      guidesNeedingGrade,
      guidesNeedingFeedback,
      guidesFromRecentModule,
      mostRecentModule
    };
  }, [extendedGuides]);

  // Calculate progress for each module
  const moduleProgress = useMemo(() => {
    return modules.map(module => {
      const moduleGuides = extendedGuides.filter(guide => guide.module.number === module.number);
      const completedGuides = moduleGuides.filter(guide => 
        guide.returnStatus === ReturnStatus.PASSED || 
        guide.returnStatus === ReturnStatus.HALL_OF_FAME
      );
      const progress = (completedGuides.length / moduleGuides.length) * 100;
      
      return {
        ...module,
        totalGuides: moduleGuides.length,
        completedGuides: completedGuides.length,
        progress: Math.round(progress)
      };
    });
  }, [extendedGuides, modules]);

  // Calculate overall course progress
  const overallProgress = useMemo(() => {
    const totalGuides = extendedGuides.length;
    const completedGuides = extendedGuides.filter(guide => 
      guide.returnStatus === ReturnStatus.PASSED || 
      guide.returnStatus === ReturnStatus.HALL_OF_FAME
    ).length;
    return Math.round((completedGuides / totalGuides) * 100);
  }, [extendedGuides]);

  // Calculate average grades by module and category
  const moduleGrades = useMemo(() => {
    return modules.map(module => {
      const moduleGuides = extendedGuides.filter(guide => guide.module.number === module.number);
      
      const codingGuides = moduleGuides.filter(guide => guide.category === 'coding');
      const designGuides = moduleGuides.filter(guide => guide.category === 'design');
      
      const codingGrades = codingGuides
        .map(guide => guide.grade)
        .filter(grade => grade !== undefined) as number[];
      
      const designGrades = designGuides
        .map(guide => guide.grade)
        .filter(grade => grade !== undefined) as number[];
      
      return {
        module,
        codingAverage: codingGrades.length > 0 
          ? Math.round(codingGrades.reduce((a, b) => a + b, 0) / codingGrades.length * 10) / 10
          : null,
        designAverage: designGrades.length > 0 
          ? Math.round(designGrades.reduce((a, b) => a + b, 0) / designGrades.length * 10) / 10
          : null
      };
    });
  }, [extendedGuides, modules]);

  return (
    <HomeContainer>
      <Section>
        <SectionTitle>Welcome back!</SectionTitle>
        <SectionSubtitle>Here's what you need to focus on today</SectionSubtitle>
      </Section>

      {/* Priority 1: Guides needing grades */}
      {organizedGuides.guidesNeedingGrade.length > 0 && (
        <Section>
          <SectionTitle>🚨 Action Required: Grade Feedback</SectionTitle>
          <SectionSubtitle>
            You have received feedback on these guides. Please grade the feedback quality.
          </SectionSubtitle>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {organizedGuides.guidesNeedingGrade.map((guide, index) => (
              <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
            ))}
          </div>
        </Section>
      )}

      {/* Priority 2: Guides needing feedback */}
      {organizedGuides.guidesNeedingFeedback.length > 0 && (
        <Section>
          <SectionTitle>📝 Give Feedback</SectionTitle>
          <SectionSubtitle>
            Help your peers by providing feedback on these guides.
          </SectionSubtitle>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {organizedGuides.guidesNeedingFeedback.map((guide, index) => (
              <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
            ))}
          </div>
        </Section>
      )}

      {/* Priority 3: Guides from recent module */}
      {organizedGuides.guidesFromRecentModule.length > 0 && (
        <Section>
          <SectionTitle>📚 Continue Learning: Module {organizedGuides.mostRecentModule?.number}</SectionTitle>
          <SectionSubtitle>
            Keep working on guides from your most recent module.
          </SectionSubtitle>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {organizedGuides.guidesFromRecentModule.map((guide, index) => (
              <GuideCard key={guide._id.toString()} guide={guide} order={index + 1} />
            ))}
          </div>
        </Section>
      )}

      {/* Progress Section */}
      <ProgressSection>
        <SectionTitle>📊 Your Progress</SectionTitle>
        
        {/* Overall Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <ProgressLabel>Overall Course Progress</ProgressLabel>
          <ProgressBar>
            <ProgressValue style={{ width: `${overallProgress}%` }}>
              {overallProgress}%
            </ProgressValue>
          </ProgressBar>
        </div>

        {/* Module Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <ProgressLabel>Module Progress</ProgressLabel>
          {moduleProgress.map((module) => (
            <ModuleProgress key={module.number}>
              <ModuleProgressLabel>
                Module {module.number}: {module.title[0]} ({module.completedGuides}/{module.totalGuides})
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
        <SectionTitle>🎯 Your Grades</SectionTitle>
        <SectionSubtitle>Average grades by module and category</SectionSubtitle>
        
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {moduleGrades.map((moduleGrade) => (
            <GradeCard key={moduleGrade.module.number}>
              <GradeTitle>Module {moduleGrade.module.number}</GradeTitle>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--primary-black-60)', fontSize: '14px' }}>Coding:</span>
                  <GradeValue>
                    {moduleGrade.codingAverage !== null ? moduleGrade.codingAverage : 'N/A'}
                  </GradeValue>
                </div>
                <div>
                  <span style={{ color: 'var(--primary-black-60)', fontSize: '14px' }}>Design:</span>
                  <GradeValue>
                    {moduleGrade.designAverage !== null ? moduleGrade.designAverage : 'N/A'}
                  </GradeValue>
                </div>
              </div>
            </GradeCard>
          ))}
        </div>
      </GradeSection>

      {/* Empty State */}
      {organizedGuides.guidesNeedingGrade.length === 0 && 
       organizedGuides.guidesNeedingFeedback.length === 0 && 
       organizedGuides.guidesFromRecentModule.length === 0 && (
        <EmptyState>
          <SectionTitle>🎉 All caught up!</SectionTitle>
          <SectionSubtitle>
            You've completed all your current tasks. Great job!
          </SectionSubtitle>
        </EmptyState>
      )}
    </HomeContainer>
  );
};

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
