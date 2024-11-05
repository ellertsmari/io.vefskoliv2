import { Slider } from "UIcomponents/slider/Slider";
import { SubTitle } from "globalStyles/text";
import { startTransition, useActionState, useEffect, useState } from "react";
import { ButtonContainer, GradeContainer, SubmitButton } from "./style";

import { returnGrade } from "serverActions/returnGrade";

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
    if (state?.success && state.data) {
      setCanGrade(false);
      window.location.reload(); // lazy way to force state update as we have no DB listeners setup yet
    }
  }, [state?.success]);

  const handleSubmit = () => {
    startTransition(async () => {
      await formAction({ grade: tempGrade, reviewId });
    });
  };

  if (!grade && !gradeable) return null;
  if (gradeable && !reviewId)
    throw new Error(
      "Grade component requires a reviewId when gradeable is true"
    );

  return (
    <GradeContainer>
      <SubTitle>GRADE</SubTitle>
      <Slider
        options={Array.from({ length: 11 }, (_, i) => i)}
        value={tempGrade}
        selectable={canGrade}
        helpLink={"linkToGradingCriteria"}
        handleOnChange={handleOnGradeChange}
        id="grade-slider"
      />
      {canGrade && (
        <ButtonContainer>
          <SubmitButton
            $styletype="default"
            onClick={handleSubmit}
            disabled={isPending}
          >
            SUBMIT GRADE
          </SubmitButton>
        </ButtonContainer>
      )}
    </GradeContainer>
  );
};
