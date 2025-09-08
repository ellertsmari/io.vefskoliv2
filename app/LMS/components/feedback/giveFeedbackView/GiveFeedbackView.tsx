import { ReturnOverview } from "../returnOverview/ReturnOverview";

import {
  VoteContainer,
  VoteIcon,
  VotingContainer,
  WriteFeedbackContainer,
} from "../../../../guides/components/guideCard/style";
import { SubHeading1 } from "globalStyles/text";
import MarkdownEditor from "UIcomponents/markdown/editor";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "globalStyles/buttons/default/style";
import { useGuide } from "providers/GuideProvider";
import { returnFeedback } from "serverActions/returnFeedback";
import { Vote } from "models/review";
import { StyleColors } from "globalStyles/colors";
import { RedCross, GreenTick, PurpleStar } from "assets/Icons";
import { FeedbackInfoContainer } from "./style";
import { useLocalState } from "utils/hooks/useStorage";
import { set } from "mongoose";

export const GiveFeedbackView = ({ guideTitle }: { guideTitle: string }) => {
  const LOCAL_STORAGE_KEY = `feedback for ${guideTitle}`;

  const [comment, setComment, loading] = useLocalState<string>(
    LOCAL_STORAGE_KEY,
    ""
  );
  const [vote, setVote] = useState<Vote | undefined>(undefined);
  const [state, formAction, isPending] = useActionState(
    returnFeedback,
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      setComment("");
      window.location.reload(); // lazy way to force state update as we have no DB listeners setup yet
    }
  }, [state?.success, setComment]);

  const handleSetVote = useCallback((vote: Vote) => setVote(vote), []);
  const handleSetComment = useCallback(
    (comment: string) => setComment(comment),
    [setComment]
  );

  const { guide } = useGuide();
  const { availableForFeedback } = guide;
  // Take the first return - it's deterministically assigned to this user by the backend
  // (sorted by: fewest reviews → user-specific assignment → oldest first → consistent tiebreaker)
  const theReturn = availableForFeedback[0];
  const canSubmit = comment && comment.length >= 2;

  const handleSubmit = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (vote && comment && theReturn) {
      formAction({
        vote,
        comment,
        returnId: theReturn._id.toString(),
        guideId: theReturn.guide.toString(),
      });
    }
  };

  if (!guide || loading) return null;

  return (
    <FeedbackInfoContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <VoteSelector selectedVote={vote} setVote={handleSetVote} />
        <ReturnOverview theReturn={theReturn} />
      </div>
      <WriteFeedbackContainer>
        <SubHeading1>WRITE A REVIEW</SubHeading1>
        <MarkdownEditor value={comment || ""} setValue={handleSetComment} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            $styletype={canSubmit ? "default" : "outlined"}
            onClick={canSubmit ? handleSubmit : undefined}
            disabled={!canSubmit}
          >
            SUBMIT REVIEW
          </Button>
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
      <VotingContainer>
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
    <VoteContainer onClick={() => setVote(vote)}>
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
    </VoteContainer>
  );
};
