"use client";
// import { image } from "@uiw/react-md-editor";
import FinishedInfo from "./finishedInfo";
// import FinishedInfo2 from "./finishedInfo";
import ModulesInfo from "./modulesInfo";
import { GuidesContainer, GuidesBox, GuideColumn } from "./style";
import Icon0 from "../../assets/Component 1.svg";
import Icon1 from "../../assets/Component2.svg";
import Icon2 from "../../assets/Component3.svg";
import Icon3 from "../../assets/Component4.svg";
import Icon4 from "../../assets/Component5.svg";
import Icon5 from "../../assets/Component6.svg";
import GradesInfo from "./gradesInfo";
// import { ReactNode } from "react";

type Props = {
  data: {}[];
};
const GuidesWidget = ({ data }: Props) => {
  const icons = [Icon0, Icon1, Icon2, Icon3, Icon4, Icon5, Icon0, Icon2];
  const titlesAndNumbers = [
    { number: 0 },
    { number: 0 },
    { number: 0 },
    { number: 0 },
    { number: 0 },
    { number: 0 },
    { number: 0 },
    { number: 0 },
  ];
  data.forEach((guide) => {
    const moduleNumber = guide.module.title[0];
    titlesAndNumbers[moduleNumber] = {
      number: titlesAndNumbers[moduleNumber].number + 1,
      image: icons[moduleNumber],
    };
  });
  console.log(titlesAndNumbers);
  return (
    <GuidesContainer>
      <h2>Guides</h2>
      <GuidesBox>
        <GuideColumn>
          <h2>Modules</h2>
          {titlesAndNumbers.map((module, index) => {
            return (
              <ModulesInfo
                ModuleTitle={"Module " + (index + 1)}
                GuidesNumber={module.number}
                GuidesImage={module.image}
              />
            );
          })}
        </GuideColumn>
        <GuideColumn>
          <h2>Finished</h2>
          <FinishedInfo />
        </GuideColumn>
        <GuideColumn>
          <h2>Grades</h2>
          <GradesInfo></GradesInfo>
        </GuideColumn>
      </GuidesBox>
      <p>View All</p>
    </GuidesContainer>
  );
};

export default GuidesWidget;
