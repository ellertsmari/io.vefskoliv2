"use client";

import { ExtendedGuideInfo, Module } from "types/guideTypes";
import { useState, useEffect, useActionState, startTransition } from "react";
import Modal from "UIcomponents/modal/modal";
import MarkdownReader from "UIcomponents/markdown/reader";
import { getUngradedReviews, UngradedReviewWithDetails } from "serverActions/getUngradedReviews";
import { returnGrade } from "serverActions/returnGrade";
import {
  ActionGrid,
  ActionCard,
  ActionIcon,
  ActionTitle,
  BadgeCount,
  GradingModalWrapper,
  GradingModalHeader,
  GradingModalTitle,
  GradingModalSubtitle,
  ReviewsList,
  ReviewItem,
  ReviewItemHeader,
  ReviewItemInfo,
  ReviewGuideTitle,
  ReviewMeta,
  ReviewVoteBadge,
  ReviewComment,
  GradeInputContainer,
  GradeSlider,
  GradeValue,
  SubmitGradeButton,
  EmptyGradingState,
  ProjectLinks,
  ProjectLink,
} from "./styles.TeacherHomePage";

interface TeacherHomePageProps {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}

const GradingReviewItem = ({
  review,
  onGraded
}: {
  review: UngradedReviewWithDetails;
  onGraded: (reviewId: string) => void;
}) => {
  const [grade, setGrade] = useState(5);
  const [state, formAction, isPending] = useActionState(returnGrade, undefined);

  useEffect(() => {
    if (state?.success) {
      onGraded(review._id);
    }
  }, [state, review._id, onGraded]);

  const handleSubmit = () => {
    startTransition(() => {
      formAction({
        grade,
        reviewId: review._id
      });
    });
  };

  return (
    <ReviewItem>
      <ReviewItemHeader>
        <ReviewItemInfo>
          <ReviewGuideTitle>{review.guide.title}</ReviewGuideTitle>
          <ReviewMeta>
            Review by <strong>{review.reviewer.name}</strong> on <strong>{review.returnOwner.name}</strong>&apos;s project
          </ReviewMeta>
          <ProjectLinks>
            <ProjectLink href={review.return.projectUrl} target="_blank" rel="noopener noreferrer">
              Project URL
            </ProjectLink>
            <ProjectLink href={review.return.liveVersion} target="_blank" rel="noopener noreferrer">
              Live Version
            </ProjectLink>
          </ProjectLinks>
        </ReviewItemInfo>
        <ReviewVoteBadge $vote={review.vote}>{review.vote}</ReviewVoteBadge>
      </ReviewItemHeader>
      <ReviewComment>
        <MarkdownReader>{review.comment}</MarkdownReader>
      </ReviewComment>
      <GradeInputContainer>
        <GradeSlider
          type="range"
          min="1"
          max="10"
          value={grade}
          onChange={(e) => setGrade(parseInt(e.target.value))}
        />
        <GradeValue>{grade}/10</GradeValue>
        <SubmitGradeButton onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving...' : 'Grade'}
        </SubmitGradeButton>
      </GradeInputContainer>
      {state && !state.success && (
        <p style={{ color: '#dc3545', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Error: {state.error}
        </p>
      )}
    </ReviewItem>
  );
};

const GradingModal = () => {
  const [reviews, setReviews] = useState<UngradedReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const data = await getUngradedReviews();
      setReviews(data);
      setLoading(false);
    };
    fetchReviews();
  }, []);

  const handleGraded = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r._id !== reviewId));
  };

  if (loading) {
    return (
      <GradingModalWrapper>
        <GradingModalHeader>
          <GradingModalTitle>Grade Reviews</GradingModalTitle>
        </GradingModalHeader>
        <EmptyGradingState>Loading reviews...</EmptyGradingState>
      </GradingModalWrapper>
    );
  }

  return (
    <GradingModalWrapper>
      <GradingModalHeader>
        <GradingModalTitle>Grade Reviews</GradingModalTitle>
        <GradingModalSubtitle>
          {reviews.length > 0
            ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} waiting to be graded`
            : 'All reviews have been graded!'}
        </GradingModalSubtitle>
      </GradingModalHeader>
      {reviews.length > 0 ? (
        <ReviewsList>
          {reviews.map(review => (
            <GradingReviewItem
              key={review._id}
              review={review}
              onGraded={handleGraded}
            />
          ))}
        </ReviewsList>
      ) : (
        <EmptyGradingState>
          All reviews have been graded. Great job!
        </EmptyGradingState>
      )}
    </GradingModalWrapper>
  );
};

export const TeacherHomePage = ({ extendedGuides, modules }: TeacherHomePageProps) => {
  const [ungradedCount, setUngradedCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const reviews = await getUngradedReviews();
      setUngradedCount(reviews.length);
    };
    fetchCount();
  }, []);

  return (
    <ActionGrid>
      <Modal
        modalTrigger={
          <ActionCard>
            <ActionIcon>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </ActionIcon>
            <ActionTitle>GRADE REVIEWS</ActionTitle>
            {ungradedCount !== null && ungradedCount > 0 && (
              <BadgeCount>{ungradedCount}</BadgeCount>
            )}
          </ActionCard>
        }
        modalContent={<GradingModal />}
      />

      <ActionCard>
        <ActionIcon>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </ActionIcon>
        <ActionTitle>CREATE NEW GUIDE</ActionTitle>
      </ActionCard>

      <ActionCard onClick={() => window.location.href = '/LMS/reports'}>
        <ActionIcon>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        </ActionIcon>
        <ActionTitle>REPORTS</ActionTitle>
      </ActionCard>

      <ActionCard>
        <ActionIcon>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-13.5h.008v.008H12V8.25Z" />
          </svg>
        </ActionIcon>
        <ActionTitle>EDIT CALENDAR</ActionTitle>
      </ActionCard>

      <ActionCard>
        <ActionIcon>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </ActionIcon>
        <ActionTitle>ALIAS</ActionTitle>
      </ActionCard>

      <ActionCard>
        <ActionIcon>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </ActionIcon>
        <ActionTitle>GROUP PROJECTS</ActionTitle>
      </ActionCard>

      <ActionCard onClick={() => window.location.href = '/LMS/edit-guides'}>
        <ActionIcon>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </ActionIcon>
        <ActionTitle>EDIT GUIDES</ActionTitle>
      </ActionCard>

      <ActionCard>
        <ActionIcon>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </ActionIcon>
        <ActionTitle>GROUP FORMATION</ActionTitle>
      </ActionCard>
    </ActionGrid>
  );
};