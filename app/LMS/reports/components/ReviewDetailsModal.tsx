import React, { useState, useActionState, startTransition } from "react";
import { ExtendedGuideInfo } from "types/guideTypes";
import { FeedbackDocument, GradedFeedbackDocument } from "models/review";
import { returnGrade } from "serverActions/returnGrade";
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
  GradeAdjustmentContainer,
  GradeAdjustmentHeader,
  GradeAdjustmentTitle,
  GradeSlider,
  GradeDisplay,
  GradeValue,
  GradeTooltip,
  GradeReferenceChart,
  GradeReferenceTitle,
  GradeReferenceItem,
  GradeNumber,
  SaveGradeButton,
  EditButton,
} from "./styles.ReviewDetailsModal";

const gradeMeanings = [
  '1 - The feedback was not helpfull at all (could be something like just "good" or "bad")',
  '2- The feedback was not very helpfull (could be something like "good job" or "I liked it")',
  "3 - The feedback was not helpfull (maybe just one line of text or something like that)",
  "4 - The feedback was hardly helpfull (was maybe less than a paragraph long)",
  "5 - The feedback pointed out some specific things that could be improved or that they liked (maybe a few sentences)",
  "6 - The feedback was helpfull (it was clear that the reviewer had looked at the project and thought about it)",
  "7 - The feedback was very helpfull (it was clear that the reviewer had looked at the project and thought about it and they gave some specific advice)",
  "8 - The feedback was very helpfull (it was a thoughtful and a very thorough review with specific advice)",
  "9 - The feedback was very helpfull (it was a thoughtful and thorough review with specific advice and suggestions for improvement OR praise for the good parts)",
  "10 - The feedback was very helpfull (it was a thoughtful and thorough review with specific advice and suggestions for improvement AND praise for the good parts)",
];

interface GradeAdjustmentProps {
  review: FeedbackDocument;
  currentGrade?: number | null;
}

const GradeAdjustment = ({ review, currentGrade }: GradeAdjustmentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempGrade, setTempGrade] = useState(currentGrade ?? 5);
  const [state, formAction, isPending] = useActionState(returnGrade, undefined);

  const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGrade = parseInt(e.target.value);
    setTempGrade(newGrade);
  };

  const handleSaveGrade = () => {
    console.log('Saving grade:', {
      grade: tempGrade,
      reviewId: review._id.toString(),
      reviewData: review
    });
    
    startTransition(() => {
      formAction({ 
        grade: tempGrade, 
        reviewId: review._id.toString() 
      });
    });
  };

  // Handle the action state changes
  React.useEffect(() => {
    if (state?.success) {
      console.log('Grade saved successfully:', state);
      setIsEditing(false);
      // Refresh the page to show updated grade
      window.location.reload();
    } else if (state && !state.success) {
      console.error('Failed to save grade:', state);
      alert('Failed to save grade. Please try again.');
    }
  }, [state]);

  const displayGrade = currentGrade ?? tempGrade;

  if (!isEditing && (currentGrade === null || currentGrade === undefined)) {
    return (
      <EditButton onClick={() => setIsEditing(true)}>
        Add Grade
      </EditButton>
    );
  }

  if (!isEditing) {
    return (
      <GradeAdjustmentContainer>
        <GradeAdjustmentHeader>
          <GradeAdjustmentTitle>Teacher Grade</GradeAdjustmentTitle>
          <EditButton onClick={() => setIsEditing(true)}>
            Adjust
          </EditButton>
        </GradeAdjustmentHeader>
        <GradeDisplay>
          <GradeValue>Grade: {displayGrade}/10</GradeValue>
        </GradeDisplay>
        <GradeTooltip>
          {gradeMeanings[displayGrade - 1]}
        </GradeTooltip>
      </GradeAdjustmentContainer>
    );
  }

  return (
    <GradeAdjustmentContainer>
      <GradeAdjustmentHeader>
        <GradeAdjustmentTitle>Adjust Grade</GradeAdjustmentTitle>
      </GradeAdjustmentHeader>
      <GradeDisplay>
        <GradeValue>Grade: {tempGrade}/10</GradeValue>
      </GradeDisplay>
      <GradeSlider
        type="range"
        min="1"
        max="10"
        value={tempGrade}
        onChange={handleGradeChange}
      />
      <GradeTooltip>
        {gradeMeanings[tempGrade - 1]}
      </GradeTooltip>
      <div>
        <SaveGradeButton 
          onClick={handleSaveGrade}
          disabled={isPending}
        >
          {isPending ? 'Saving...' : 'Save Grade'}
        </SaveGradeButton>
        <EditButton 
          onClick={() => {
            setIsEditing(false);
            setTempGrade(currentGrade ?? 5);
          }}
          style={{ marginLeft: '0.5rem' }}
        >
          Cancel
        </EditButton>
      </div>
    </GradeAdjustmentContainer>
  );
};

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
                  <GradeAdjustment 
                    review={review} 
                    currentGrade={review.grade} 
                  />
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
                    <GradeAdjustment 
                      review={review} 
                      currentGrade={gradeReceived?.grade} 
                    />
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