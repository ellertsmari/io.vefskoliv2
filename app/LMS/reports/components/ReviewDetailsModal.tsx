import { ExtendedGuideInfo } from "types/guideTypes";
import { FeedbackDocument, GradedFeedbackDocument } from "models/review";
import {
  ModalWrapper,
  ModalContent,
  LeftColumn,
  RightColumn,
  ModalHeader,
  ModalTitle,
  ModuleBadge,
  Section,
  SectionTitle,
  ReviewCard,
  ReviewHeader,
  VoteBadge,
  GradeBadge,
  ReviewComment,
  EmptyState,
  ReturnCard,
  ReturnHeader,
  ProjectName,
  LinkRow,
  ProjectLink,
  DateInfo,
  ReturnComment,
} from "./styles.ReviewDetailsModal";

interface ReviewDetailsModalProps {
  guide: ExtendedGuideInfo;
  studentName: string;
}

export const ReviewDetailsModal = ({ guide, studentName }: ReviewDetailsModalProps) => {
  const reviewsReceived = guide.feedbackReceived || [];
  const reviewsGiven = guide.feedbackGiven || [];
  const gradesGiven = guide.gradesGiven || [];
  const studentReturns = guide.returnsSubmitted || [];

  return (
    <ModalWrapper>
      <ModalHeader>
        <ModuleBadge>Module {+guide.module.title[0]}</ModuleBadge>
        <ModalTitle>{guide.title}</ModalTitle>
        <p style={{ margin: 0, color: '#6c757d' }}>
          Review details for {studentName}
        </p>
      </ModalHeader>

      <ModalContent>
        <LeftColumn>
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
        </LeftColumn>

        <RightColumn>
          {/* Student Returns Section */}
          <Section>
            <SectionTitle>Student Returns ({studentReturns.length})</SectionTitle>
            {studentReturns.length > 0 ? (
              studentReturns.map((returnDoc, index: number) => (
                <ReturnCard key={returnDoc._id.toString()}>
                  <ReturnHeader>
                    <ProjectName>{returnDoc.projectName}</ProjectName>
                    <LinkRow>
                      <ProjectLink href={returnDoc.projectUrl} target="_blank" rel="noopener noreferrer">
                        Project URL
                      </ProjectLink>
                      <ProjectLink href={returnDoc.liveVersion} target="_blank" rel="noopener noreferrer">
                        Live Version
                      </ProjectLink>
                      {returnDoc.pictureUrl && (
                        <ProjectLink href={returnDoc.pictureUrl} target="_blank" rel="noopener noreferrer">
                          Picture
                        </ProjectLink>
                      )}
                    </LinkRow>
                    <DateInfo>
                      Submitted: {new Date(returnDoc.createdAt).toLocaleDateString()}
                    </DateInfo>
                  </ReturnHeader>
                  <ReturnComment>{returnDoc.comment}</ReturnComment>
                </ReturnCard>
              ))
            ) : (
              <EmptyState>No returns submitted for this guide</EmptyState>
            )}
          </Section>
        </RightColumn>
      </ModalContent>
    </ModalWrapper>
  );
};