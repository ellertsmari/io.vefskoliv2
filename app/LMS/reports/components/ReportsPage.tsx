"use client";

import { useState } from "react";
import { ExtendedGuideInfo } from "types/guideTypes";
import { getStudentGuides } from "serverActions/getStudentGuides";
import Modal from "UIcomponents/modal/modal";
import { ReviewDetailsModal } from "./ReviewDetailsModal";
import {
  ReportsContainer,
  Header,
  Title,
  Subtitle,
  ContentLayout,
  StudentsPanel,
  StudentsTitle,
  StudentsList,
  StudentItem,
  StudentName,
  StudentEmail,
  StudentReportPanel,
  EmptyState,
  ReportTitle,
  SectionTitle,
  GuideGrid,
  GuideCard,
  GuideTitle,
  GuideStatus,
  GuideDetails,
  ModuleBadge,
  LoadingState,
} from "./styles.ReportsPage";

type UserForReports = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

interface ReportsPageProps {
  students: UserForReports[];
}

export const ReportsPage = ({ students }: ReportsPageProps) => {
  const [selectedStudent, setSelectedStudent] = useState<UserForReports | null>(null);
  const [studentGuides, setStudentGuides] = useState<ExtendedGuideInfo[] | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Load student data when selected
  const handleStudentSelect = async (student: UserForReports) => {
    setSelectedStudent(student);
    setLoadingStudent(true);
    setStudentGuides(null);

    try {
      const studentGuides = await getStudentGuides(student._id);
      setStudentGuides(studentGuides);
    } catch (error) {
      console.error("Error loading student guides:", error);
    } finally {
      setLoadingStudent(false);
    }
  };

  // Create combined guide data for display
  const getCombinedGuides = () => {
    if (!studentGuides) return [];

    // Create a map to combine guides with both submission and review data
    const guidesMap = new Map();

    // Add all guides that have been returned
    studentGuides.forEach(guide => {
      if (guide.returnsSubmitted && guide.returnsSubmitted.length > 0) {
        guidesMap.set(guide._id.toString(), {
          ...guide,
          hasReturned: true,
          hasReviewed: false,
          reviewCount: 0,
          gradeCount: 0
        });
      }
    });

    // Add review information to existing guides or create new entries
    studentGuides.forEach(guide => {
      const reviewCount = guide.reviewsGiven?.length || 0;
      const gradeCount = guide.gradesGiven?.length || 0;
      
      if (reviewCount > 0 || gradeCount > 0) {
        const guideId = guide._id.toString();
        const existing = guidesMap.get(guideId);

        if (existing) {
          // Update existing guide with review data
          existing.hasReviewed = true;
          existing.reviewCount = reviewCount;
          existing.gradeCount = gradeCount;
        } else {
          // Add guide that only has review activity
          guidesMap.set(guideId, {
            ...guide,
            hasReturned: false,
            hasReviewed: true,
            reviewCount: reviewCount,
            gradeCount: gradeCount
          });
        }
      }
    });

    return Array.from(guidesMap.values()).sort((a, b) => 
      (+a.module.title[0]) - (+b.module.title[0])
    );
  };

  const combinedGuides = getCombinedGuides();

  return (
    <ReportsContainer>
      <Header>
        <Title>Student Reports</Title>
        <Subtitle>Select a student to view their progress and review activity</Subtitle>
      </Header>

      <ContentLayout>
        {/* Students Panel */}
        <StudentsPanel>
          <StudentsTitle>Students ({students.length})</StudentsTitle>
          <StudentsList>
            {students.map((student) => (
              <StudentItem
                key={student.name + student.email}
                selected={selectedStudent?.email === student.email}
                onClick={() => handleStudentSelect(student)}
              >
                <StudentName>{student.name}</StudentName>
                <StudentEmail>{student.email}</StudentEmail>
              </StudentItem>
            ))}
          </StudentsList>
        </StudentsPanel>

        {/* Student Report Panel */}
        <StudentReportPanel>
          {!selectedStudent ? (
            <EmptyState>
              <p>Select a student from the list to view their report</p>
            </EmptyState>
          ) : loadingStudent ? (
            <LoadingState>Loading {selectedStudent.name}&apos;s data...</LoadingState>
          ) : (
            <>
              <ReportTitle>{selectedStudent.name} - Progress Report</ReportTitle>
              
              <SectionTitle>Guide Activity ({combinedGuides.length})</SectionTitle>
              {combinedGuides.length > 0 ? (
                <GuideGrid>
                  {combinedGuides.map((guide) => (
                    <Modal
                      key={guide._id.toString()}
                      modalTrigger={
                        <GuideCard>
                          <ModuleBadge>Module {+guide.module.title[0]}</ModuleBadge>
                          <GuideTitle>{guide.title}</GuideTitle>
                          
                          {guide.hasReturned && (
                            <GuideStatus status={guide.returnStatus}>
                              {guide.returnStatus}
                            </GuideStatus>
                          )}
                          
                          <GuideDetails>
                            <strong>{guide.module.title}</strong><br/>
                            Category: {guide.category}<br/>
                            
                            {guide.hasReturned && (
                              <>
                                Returns submitted: {guide.returnsSubmitted.length}<br/>
                                {guide.grade && `Grade: ${guide.grade}`}<br/>
                              </>
                            )}
                            
                            {guide.hasReviewed && (
                              <>
                                Reviews given: {guide.reviewCount}<br/>
                                Grades given: {guide.gradeCount}
                              </>
                            )}
                            
                            {!guide.hasReturned && !guide.hasReviewed && (
                              <span style={{ color: '#6c757d' }}>No activity</span>
                            )}
                          </GuideDetails>
                        </GuideCard>
                      }
                      modalContent={
                        <ReviewDetailsModal 
                          guide={guide} 
                          studentName={selectedStudent.name}
                        />
                      }
                    />
                  ))}
                </GuideGrid>
              ) : (
                <p style={{ color: '#6c757d' }}>No guide activity yet</p>
              )}
            </>
          )}
        </StudentReportPanel>
      </ContentLayout>
    </ReportsContainer>
  );
};