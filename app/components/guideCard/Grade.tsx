import { Slider } from "components/slider/Slider";
import { SubTitle } from "globalStyles/text";

export const Grade = ({
  grade,
  gradeable,
}: {
  grade: number | null | undefined;
  gradeable: boolean;
}) => {
  if (!grade && !gradeable) return null;

  return (
    <>
      <SubTitle>GRADE</SubTitle>
      <Slider
        options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        value={2}
        selectable={gradeable}
        helpLink={"linkToGradingCriteria"}
      />
    </>
  );
};
