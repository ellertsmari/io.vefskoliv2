import { Slider } from "UIcomponents/slider/Slider";
import { SubHeadingLabel} from "globalStyles/text";
import { startTransition, useActionState, useEffect, useState } from "react";
import {
  ButtonContainer,
  GradeContainer,
  SubmitButton,
  GradeMeaningDisplay,
  PendingPanel,
  PendingTitle,
  PendingText,
} from "./style";
import {
  MAX_GRADE,
  REVIEW_GRADE_MEANINGS,
  reviewGradeMeaning,
} from "constants/peerReview";

import { returnGrade } from "serverActions/returnGrade";

/** The rubric doc teachers grade against, linked from the slider. */
const RUBRIC_DOC_URL =
  "https://docs.google.com/document/d/1MbGhamGJQmKHkVQHTCZP91Szmca0T7NQOG8ZNrTCp_U/edit?tab=t.0#heading=h.a3sfbxwldt9";

export const Grade = ({
  grade,
  gradeable,
  reviewId,
}: {
  grade: number | null | undefined;
  gradeable: boolean;
  reviewId?: string;
}) => {
  const [tempGrade, setTempGrade] = useState<number>(grade ?? 5);
  const [canGrade, setCanGrade] = useState(gradeable);
  const [state, formAction, isPending] = useActionState(returnGrade, undefined);

  const handleOnGradeChange = (newGrade: number) => {
    setTempGrade(newGrade);
  };

  useEffect(() => {
    if (state?.success) {
      setCanGrade(false);
      window.location.reload(); // lazy way to force state update as we have no DB listeners setup yet
    }
  }, [state?.success]);

  const handleSubmit = () => {
    startTransition(async () => {
      await formAction({ grade: tempGrade, reviewId });
    });
  };

  // A review nobody has graded yet. Previously this rendered nothing at all,
  // which left the student staring at an empty panel with no way to tell
  // "not graded yet" apart from "something is broken".
  if (grade == null && !gradeable) {
    return (
      <PendingPanel>
        <PendingTitle>NOT GRADED YET</PendingTitle>
        <PendingText>
          A teacher will score this review from 1 to {MAX_GRADE}. Review scores
          are worth up to half of your grade for this guide, so it&apos;s worth
          writing a good one.
        </PendingText>
        <PendingText>
          <a href={RUBRIC_DOC_URL} target="_blank" rel="noopener noreferrer">
            What earns a high score?
          </a>
        </PendingText>
      </PendingPanel>
    );
  }

  if (gradeable && !reviewId)
    throw new Error(
      "Grade component requires a reviewId when gradeable is true"
    );

  return (
    <GradeContainer>
      {/* Display current grade meaning above the label */}
      <GradeMeaningDisplay>
        {reviewGradeMeaning(tempGrade)}
      </GradeMeaningDisplay>
      
      <SubHeadingLabel htmlFor="grade-slider">GRADE</SubHeadingLabel>
      <Slider
        options={Array.from({ length: MAX_GRADE }, (_, i) => i + 1)}
        value={tempGrade}
        selectable={canGrade && !isPending}
        helpLink={RUBRIC_DOC_URL}
        handleOnChange={handleOnGradeChange}
        id="grade-slider"
        titles={REVIEW_GRADE_MEANINGS}
      />
      {canGrade && (
        <ButtonContainer>
          <SubmitButton
            $styletype="default"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "SUBMITTING..." : "SUBMIT GRADE"}
          </SubmitButton>
        </ButtonContainer>
      )}
    </GradeContainer>
  );
};
