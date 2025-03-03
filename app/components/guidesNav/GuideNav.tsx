import React, { useEffect, useState } from "react";
import { Button86, GuideContainer, ButtonContainer } from "./style";
import { ExtendedGuideInfo } from "types/guideTypes";
import GuideCard from "components/guideCard/GuideCard";
// import useLocalStorage from "utils/useLocalStorage";
// import { useSearchParams } from "next/navigation";

interface Props {
  guides: ExtendedGuideInfo[];
}

export default function GuideNav({ guides }: Props) {
  let guideNumber = 0;

  // const searchParams = useSearchParams();
  // const moduleParam = searchParams.get("module");

  // const [moduleSelected, setModuleSelected] = useLocalStorage(
  //   "Selected module",
  //   { selected: moduleParam }
  // );
  // useEffect(() => {
  //   moduleParam && setModuleSelected({ selected: moduleParam });
  // }, [moduleParam]);
  // const { selected } = moduleSelected;
  // const option = (selected: string) => {
  //   setModuleSelected({ selected });
  // };

  const [selectedModule, setSelectedModule] = useState("0 - Preparation");

  const [isClicked, setIsClicked] = useState(false);

  return (
    <>
      <ButtonContainer>
        <Button86 onClick={() => setSelectedModule("0 - Preparation")}>
          Intro
        </Button86>
        <Button86 onClick={() => setSelectedModule("1 - Introductory Course")}>
          Module 1
        </Button86>
        <Button86
          onClick={() => setSelectedModule("2 - Community & Networking")}
        >
          Module 2
        </Button86>
        <Button86 onClick={() => setSelectedModule("3 - The fundamentals")}>
          Module 3
        </Button86>
        <Button86
          onClick={() => setSelectedModule("4 - Connecting to the World")}
        >
          Module 4
        </Button86>
        <Button86
          onClick={() => setSelectedModule("5 - Back-end & Infrastructure")}
        >
          Module 5
        </Button86>
        <Button86 onClick={() => setSelectedModule("6 - Growing complexity")}>
          Module 6
        </Button86>
        <Button86 onClick={() => setSelectedModule("7 - Exploration")}>
          Module 7
        </Button86>
      </ButtonContainer>
      <GuideContainer>
        {guides.map((guide, index) => {
          if (selectedModule && guide.module.title === selectedModule) {
            guideNumber++;

            return <GuideCard guide={guide} key={index} order={guideNumber} />;
          }
        })}
      </GuideContainer>
    </>
  );
}
