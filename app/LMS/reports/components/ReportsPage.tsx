"use client";

import { useState } from "react";
import styled from "styled-components";
import { ExtendedGuideInfo, ReturnStatus } from "types/guideTypes";
import { getStudentGuides } from "serverActions/getStudentGuides";
import Modal from "UIcomponents/modal/modal";
import { ReviewDetailsModal } from "./ReviewDetailsModal";

const ReportsContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #000;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin: 0;
`;

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  align-items: start;
`;

const StudentsPanel = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
`;

const StudentsTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 1rem 0;
`;

const StudentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StudentItem = styled.button<{ selected: boolean }>`
  background: ${props => props.selected ? '#f8f9fa' : 'transparent'};
  border: 1px solid ${props => props.selected ? '#000' : 'transparent'};
  border-radius: 6px;
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
    border-color: #6c757d;
  }
`;

const StudentName = styled.div`
  font-weight: 500;
  color: #000;
  font-size: 0.9rem;
`;

const StudentEmail = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;

const StudentReportPanel = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 3rem 1rem;
`;

const ReportTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 1.5rem 0;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
  margin: 2rem 0 1rem 0;
  
  &:first-child {
    margin-top: 0;
  }
`;

const GuideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const GuideCard = styled.div`
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #007bff;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const GuideTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 0.5rem 0;
`;

const GuideStatus = styled.span<{ status: ReturnStatus }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  
  background: ${props => {
    switch (props.status) {
      case ReturnStatus.PASSED:
        return '#d4edda';
      case ReturnStatus.HALL_OF_FAME:
        return '#fff3cd';
      case ReturnStatus.FAILED:
        return '#f8d7da';
      case ReturnStatus.AWAITING_FEEDBACK:
        return '#cce5ff';
      default:
        return '#e9ecef';
    }
  }};
  
  color: ${props => {
    switch (props.status) {
      case ReturnStatus.PASSED:
        return '#155724';
      case ReturnStatus.HALL_OF_FAME:
        return '#856404';
      case ReturnStatus.FAILED:
        return '#721c24';
      case ReturnStatus.AWAITING_FEEDBACK:
        return '#004085';
      default:
        return '#495057';
    }
  }};
`;

const GuideDetails = styled.div`
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #6c757d;
`;

const ModuleBadge = styled.span`
  display: inline-block;
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const LoadingState = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 2rem;
`;

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
      const feedbackCount = guide.feedbackGiven?.length || 0;
      const gradeCount = guide.gradesGiven?.length || 0;
      
      if (feedbackCount > 0 || gradeCount > 0) {
        const guideId = guide._id.toString();
        const existing = guidesMap.get(guideId);
        
        if (existing) {
          // Update existing guide with review data
          existing.hasReviewed = true;
          existing.reviewCount = feedbackCount;
          existing.gradeCount = gradeCount;
        } else {
          // Add guide that only has review activity
          guidesMap.set(guideId, {
            ...guide,
            hasReturned: false,
            hasReviewed: true,
            reviewCount: feedbackCount,
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