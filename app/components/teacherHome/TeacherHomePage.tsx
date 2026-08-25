"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "UIcomponents/modal/modal";
import MarkdownReader from "UIcomponents/markdown/reader";
import { getUngradedReviews, UngradedReviewWithDetails } from "serverActions/getUngradedReviews";
import { returnGrade } from "serverActions/returnGrade";
import {
  ActionGrid,
  PageContainer,
  GroupLabel,
  PrimaryAction,
  PrimaryText,
  PrimaryTitle,
  PrimarySubtitle,
  ShortcutLink,
  ShortcutButton,
  ActionIcon,
  ActionText,
  ActionTitle,
  ActionDescription,
  BadgeCount,
  ErrorText,
  GradeErrorText,
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
import { PageTitle, PageSubtitle, TitleBlock } from "globalStyles/pageStyles";
import {
  StarIcon,
  PlusIcon,
  ChartIcon,
  CalendarIcon,
  GroupsIcon,
  PencilIcon,
} from "./icons";

/**
 * Everything on this page that is just a destination. Real links rather than
 * window.location assignments, so they navigate client-side and can be opened
 * in a new tab.
 */
const SHORTCUTS = [
  {
    href: "/LMS/edit-guides",
    title: "Edit guides",
    description: "Update existing guide content",
    icon: <PencilIcon />,
  },
  {
    href: "/LMS/reports",
    title: "Reports",
    description: "Student progress and grades",
    icon: <ChartIcon />,
  },
  {
    href: "/LMS/groups",
    title: "Group projects",
    description: "Teams and their submissions",
    icon: <GroupsIcon />,
  },
  {
    href: "/LMS/calendar",
    title: "Course calendar",
    description: "Lectures, deadlines and events",
    icon: <CalendarIcon />,
  },
] as const;

// Calculate suggested grade based on review comment length
const calculateSuggestedGrade = (comment: string): number => {
  const length = comment.length;
  if (length >= 800) return 10;
  if (length >= 500) return 9;
  if (length >= 300) return 8;
  if (length >= 200) return 7;
  if (length >= 100) return 6;
  return 5;
};

const GradingReviewItem = ({
  review,
  onGraded
}: {
  review: UngradedReviewWithDetails;
  onGraded: (reviewId: string) => void;
}) => {
  const [grade, setGrade] = useState(() => calculateSuggestedGrade(review.comment));
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
        <GradeErrorText>Error: {state.message}</GradeErrorText>
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
        <EmptyGradingState>Loading reviews…</EmptyGradingState>
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

export const TeacherHomePage = () => {
  const [ungradedCount, setUngradedCount] = useState<number | null>(null);
  const [creatingGuide, setCreatingGuide] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCount = async () => {
      const reviews = await getUngradedReviews();
      setUngradedCount(reviews.length);
    };
    fetchCount();
  }, []);

  // Create a draft guide, then open it in the edit form to fill in.
  const handleCreateGuide = async () => {
    if (creatingGuide) return;
    setCreatingGuide(true);
    setCreateError(null);
    try {
      const response = await fetch("/api/guides", { method: "POST" });
      if (!response.ok) {
        setCreateError("Could not create a new guide. Please try again.");
        setCreatingGuide(false);
        return;
      }
      const { id } = await response.json();
      router.push(`/LMS/edit-guides/${id}`);
    } catch (error) {
      console.error("Error creating guide:", error);
      setCreateError("Could not create a new guide. Please try again.");
      setCreatingGuide(false);
    }
  };

  const hasUngraded = ungradedCount !== null && ungradedCount > 0;

  return (
    <PageContainer>
      <TitleBlock>
        <PageTitle>Teacher dashboard</PageTitle>
        <PageSubtitle>Grade student work and manage the course</PageSubtitle>
      </TitleBlock>

      {/*
        The grading queue is the only thing here that can be outstanding, so it
        gets the full width and a live count. Everything below is navigation.
      */}
      <Modal
        size="lg"
        modalTrigger={
          <PrimaryAction $waiting={hasUngraded} type="button">
            <ActionIcon $tone={hasUngraded ? "accent" : undefined}>
              <StarIcon />
            </ActionIcon>
            <PrimaryText>
              <PrimaryTitle>Grade reviews</PrimaryTitle>
              <PrimarySubtitle>
                {ungradedCount === null
                  ? "Checking the queue…"
                  : hasUngraded
                    ? `${ungradedCount} review${ungradedCount === 1 ? "" : "s"} waiting to be graded`
                    : "Everything is graded — nothing waiting"}
              </PrimarySubtitle>
            </PrimaryText>
            {hasUngraded && <BadgeCount>{ungradedCount}</BadgeCount>}
          </PrimaryAction>
        }
        modalContent={<GradingModal />}
      />

      <GroupLabel>Manage</GroupLabel>
      <ActionGrid>
        <ShortcutButton
          type="button"
          onClick={handleCreateGuide}
          disabled={creatingGuide}
        >
          <ActionIcon>
            <PlusIcon />
          </ActionIcon>
          <ActionText>
            <ActionTitle>
              {creatingGuide ? "Creating…" : "Create new guide"}
            </ActionTitle>
            <ActionDescription>Start a draft and fill it in</ActionDescription>
          </ActionText>
        </ShortcutButton>

        {SHORTCUTS.map((shortcut) => (
          <ShortcutLink key={shortcut.href} href={shortcut.href}>
            <ActionIcon>{shortcut.icon}</ActionIcon>
            <ActionText>
              <ActionTitle>{shortcut.title}</ActionTitle>
              <ActionDescription>{shortcut.description}</ActionDescription>
            </ActionText>
          </ShortcutLink>
        ))}
      </ActionGrid>

      {createError && <ErrorText>{createError}</ErrorText>}
    </PageContainer>
  );
};