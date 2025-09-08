import styled from "styled-components";
import { ExtendedGuideInfo } from "types/guideTypes";
import { FeedbackDocument, GradedFeedbackDocument, Vote } from "models/review";

const ModalWrapper = styled.div`
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.5rem;
`;

const ModalHeader = styled.div`
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 0.5rem 0;
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

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 1rem 0;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
`;

const ReviewCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const VoteBadge = styled.span<{ vote: Vote }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  
  background: ${props => {
    switch (props.vote) {
      case Vote.PASS:
        return '#d4edda';
      case Vote.RECOMMEND_TO_GALLERY:
        return '#fff3cd';
      case Vote.NO_PASS:
        return '#f8d7da';
      default:
        return '#e9ecef';
    }
  }};
  
  color: ${props => {
    switch (props.vote) {
      case Vote.PASS:
        return '#155724';
      case Vote.RECOMMEND_TO_GALLERY:
        return '#856404';
      case Vote.NO_PASS:
        return '#721c24';
      default:
        return '#495057';
    }
  }};
`;

const GradeBadge = styled.span`
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const ReviewComment = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #212529;
  white-space: pre-wrap;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 2rem;
  font-style: italic;
`;

interface ReviewDetailsModalProps {
  guide: ExtendedGuideInfo;
  studentName: string;
}

export const ReviewDetailsModal = ({ guide, studentName }: ReviewDetailsModalProps) => {
  const reviewsReceived = guide.feedbackReceived || [];
  const reviewsGiven = guide.feedbackGiven || [];
  const gradesGiven = guide.gradesGiven || [];

  return (
    <ModalWrapper>
      <ModalHeader>
        <ModuleBadge>Module {+guide.module.title[0]}</ModuleBadge>
        <ModalTitle>{guide.title}</ModalTitle>
        <p style={{ margin: 0, color: '#6c757d' }}>
          Review details for {studentName}
        </p>
      </ModalHeader>

      {/* Reviews Received Section */}
      <Section>
        <SectionTitle>Reviews Received ({reviewsReceived.length})</SectionTitle>
        {reviewsReceived.length > 0 ? (
          reviewsReceived.map((review: FeedbackDocument, index: number) => (
            <ReviewCard key={review._id.toString()}>
              <ReviewHeader>
                <VoteBadge vote={review.vote}>{review.vote}</VoteBadge>
                {review.grade && <GradeBadge>Grade: {review.grade}</GradeBadge>}
              </ReviewHeader>
              <ReviewComment>{review.comment}</ReviewComment>
            </ReviewCard>
          ))
        ) : (
          <EmptyState>No reviews received for this guide</EmptyState>
        )}
      </Section>

      {/* Reviews Given Section */}
      <Section>
        <SectionTitle>Reviews Given ({reviewsGiven.length})</SectionTitle>
        {reviewsGiven.length > 0 ? (
          reviewsGiven.map((review: FeedbackDocument, index: number) => {
            // Find corresponding grade given by this student
            const gradeGiven = gradesGiven.find((grade: GradedFeedbackDocument) => 
              grade._id.toString() === review._id.toString()
            );
            
            // Find corresponding grade received for this feedback
            const gradeReceived = guide.gradesReceived.find((grade: GradedFeedbackDocument) => 
              grade._id.toString() === review._id.toString()
            );
            
            return (
              <ReviewCard key={review._id.toString()}>
                <ReviewHeader>
                  <VoteBadge vote={review.vote}>{review.vote}</VoteBadge>
                  <div>
                    {gradeGiven && <GradeBadge>Grade Given: {gradeGiven.grade}</GradeBadge>}
                    {gradeReceived && <GradeBadge style={{ backgroundColor: '#28a745' }}>Grade Received: {gradeReceived.grade}</GradeBadge>}
                  </div>
                </ReviewHeader>
                <ReviewComment>{review.comment}</ReviewComment>
              </ReviewCard>
            );
          })
        ) : (
          <EmptyState>No reviews given for this guide</EmptyState>
        )}
      </Section>
    </ModalWrapper>
  );
};