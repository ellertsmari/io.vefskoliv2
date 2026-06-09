import { ReturnOverview } from "../returnOverview/ReturnOverview";

import {
  VoteContainer,
  VoteDescription,
  VoteIcon,
  VotingContainer,
  WriteFeedbackContainer,
} from "../../../../guides/components/guideCard/style";
import { SubHeading1 } from "globalStyles/text";
import { isCodeCategory } from "utils/guideTaxonomy";
import RichTextEditor from "UIcomponents/markdown/RichTextEditor";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "globalStyles/buttons/default/style";
import { useGuide } from "providers/GuideProvider";
import { returnReview } from "serverActions/returnFeedback";
import { Vote } from "models/review";
import { StyleColors } from "globalStyles/colors";
import { RedCross, GreenTick, PurpleStar } from "assets/Icons";
import { FeedbackInfoContainer } from "./style";
import { useLocalState } from "utils/hooks/useStorage";
import { LoadingSpinner } from "UIcomponents/states/States";
import styled from "styled-components";

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 14px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: "⚠️";
  }
`;

const TipsPanel = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  background: #fafafa;
  font-size: 0.9rem;

  ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.2rem;
  }

  li {
    margin-bottom: 0.25rem;
  }
`;

const SuccessPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 0;
`;

/** One-line student-facing criteria for each vote, shown under the icon. */
const VOTE_DESCRIPTIONS: Record<Vote, string> = {
  [Vote.NO_PASS]: "Doesn't meet the guide's requirements yet",
  [Vote.PASS]: "Meets the guide's requirements",
  [Vote.RECOMMEND_TO_GALLERY]: "Outstanding — deserves to be showcased",
};

const CODE_TIPS = [
  "Code readability and structure",
  "Problem-solving approach",
  "Best practices implementation",
  "Edge case handling",
  "Performance considerations",
];

const DESIGN_TIPS = [
  "Visual hierarchy and layout",
  "Color and typography choices",
  "User experience flow",
  "Responsive design",
  "Accessibility considerations",
];

export const GiveFeedbackView = ({ guideTitle }: { guideTitle: string }) => {
  const LOCAL_STORAGE_KEY = `feedback for ${guideTitle}`;

  // Both the comment AND the vote survive a refresh — losing one but not the
  // other felt arbitrary to students.
  const [comment, setComment, loadingComment] = useLocalState<string>(
    LOCAL_STORAGE_KEY,
    ""
  );
  const [vote, setVoteStored, loadingVote] = useLocalState<Vote | null>(
    `${LOCAL_STORAGE_KEY} (vote)`,
    null
  );
  const [showErrors, setShowErrors] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [state, formAction, isPending] = useActionState(
    returnReview,
    undefined
  );
  const router = useRouter();

  // On success, clear the draft. We deliberately do NOT auto-refresh here:
  // the student first sees a confirmation; "CONTINUE" triggers the refresh
  // (which re-renders the modal with their updated review status).
  useEffect(() => {
    if (state?.success) {
      setComment("");
      setVoteStored(null);
    }
  }, [state?.success, setComment, setVoteStored]);

  const handleSetVote = useCallback(
    (newVote: Vote) => {
      setVoteStored(newVote);
      if (showErrors && newVote) {
        setShowErrors(false);
      }
    },
    [showErrors, setVoteStored]
  );

  const handleSetComment = useCallback(
    (newComment: string) => {
      setComment(newComment);
      if (showErrors && newComment && newComment.length >= 2) {
        setShowErrors(false);
      }
    },
    [setComment, showErrors]
  );

  const { guide } = useGuide();
  const availableForReview = guide?.availableForReview ?? [];
  // Take the first return - it's deterministically assigned to this user by the backend
  // (sorted by: fewest reviews → user-specific assignment → oldest first → consistent tiebreaker)
  const theReturn = availableForReview[0];

  // Error checking functions
  const hasVoteError = showErrors && !vote;
  const hasCommentError = showErrors && (!comment || comment.length < 2);

  const handleSubmit = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (vote && comment && comment.length >= 2 && theReturn) {
      setShowErrors(false);
      // useActionState's dispatch must run inside a transition, otherwise
      // React warns and isPending never flips (no SUBMITTING… state).
      startTransition(() => {
        formAction({
          vote,
          comment,
          returnId: theReturn._id.toString(),
          guideId: theReturn.guide.toString(),
        });
      });
    } else {
      setShowErrors(true);
    }
  };

  if (!guide || loadingComment || loadingVote) {
    return <LoadingSpinner label="Loading review…" />;
  }

  if (state?.success) {
    const moreAvailable = availableForReview.length > 1;
    return (
      <SuccessPanel>
        <SubHeading1>REVIEW SUBMITTED ✓</SubHeading1>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Thanks for helping a classmate — your review brings them one step
          closer to completing this guide.
          {moreAvailable &&
            " Another project is waiting for your review on this guide."}
        </p>
        <Button
          type="button"
          $styletype="default"
          onClick={() => router.refresh()}
        >
          {moreAvailable ? "CONTINUE" : "DONE"}
        </Button>
      </SuccessPanel>
    );
  }

  const isCodeGuide = isCodeCategory(guide.category);
  const tips = isCodeGuide ? CODE_TIPS : DESIGN_TIPS;

  return (
    <FeedbackInfoContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <VoteSelector selectedVote={vote ?? undefined} setVote={handleSetVote} />
        {hasVoteError && (
          <ErrorMessage>
            Please select a vote (PASS, NO PASS, or GALLERY)
          </ErrorMessage>
        )}
        <ReturnOverview theReturn={theReturn} />
      </div>
      <WriteFeedbackContainer>
        <SubHeading1>WRITE A REVIEW</SubHeading1>
        <RichTextEditor
          value={comment || ""}
          setValue={handleSetComment}
          guideCategory={guide.category}
        />
        {hasCommentError && (
          <ErrorMessage>
            Please write at least 2 characters in your review
          </ErrorMessage>
        )}
        {showTips && (
          <TipsPanel id="review-tips">
            <strong>
              {isCodeGuide ? "Code review focus areas" : "Design review focus areas"}
            </strong>
            <ul>
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </TipsPanel>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            type="button"
            $styletype="outlined"
            onClick={() => setShowTips((prev) => !prev)}
            aria-expanded={showTips}
            aria-controls="review-tips"
            disabled={isPending}
          >
            {showTips ? "HIDE TIPS" : "WHAT SHOULD I LOOK FOR?"}
          </Button>
          <div>
            <Button
              type="button"
              $styletype={
                vote && comment && comment.length >= 2 && !isPending
                  ? "default"
                  : "outlined"
              }
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "SUBMITTING..." : "SUBMIT REVIEW"}
            </Button>
          </div>
        </div>
      </WriteFeedbackContainer>
    </FeedbackInfoContainer>
  );
};

const VoteSelector = ({
  selectedVote,
  setVote,
}: {
  selectedVote: Vote | undefined;
  setVote: (vote: Vote) => void;
}) => {
  return (
    <>
      <SubHeading1>VOTE</SubHeading1>
      <VotingContainer role="radiogroup" aria-label="Your vote on this project">
        {Object.values(Vote)
          .map((vote) => (
            <VoteButton
              key={vote}
              vote={vote}
              setVote={setVote}
              selected={vote === selectedVote}
            />
          ))
          .reverse()}
      </VotingContainer>
    </>
  );
};

const VoteButton = ({
  vote,
  setVote,
  selected,
}: {
  vote: Vote;
  setVote: (vote: Vote) => void;
  selected: boolean;
}) => {
  let color, icon, title;
  switch (vote) {
    case Vote.NO_PASS:
      (color = StyleColors.red), (icon = <RedCross />), (title = "NO PASS");
      break;
    case Vote.PASS:
      (color = StyleColors.green), (icon = <GreenTick />), (title = "PASS");
      break;
    case Vote.RECOMMEND_TO_GALLERY:
      (color = StyleColors.purple),
        (icon = <PurpleStar />),
        (title = "GALLERY");
      break;
  }

  if (!color) {
    throw new Error("Invalid vote passed to VoteButton");
  }

  return (
    <VoteContainer
      type="button"
      onClick={() => setVote(vote)}
      role="radio"
      aria-checked={selected}
    >
      <div>
        <VoteIcon
          style={{
            borderColor: color,
            borderWidth: selected ? "4px" : "1px",
          }}
        >
          <div style={{ height: "72px", width: "72px" }}>{icon}</div>
        </VoteIcon>
      </div>
      <div style={{ color: color }}>{title}</div>
      <VoteDescription>{VOTE_DESCRIPTIONS[vote]}</VoteDescription>
    </VoteContainer>
  );
};
