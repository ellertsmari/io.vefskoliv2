"use client";
import { image } from "@uiw/react-md-editor";
import FinishedInfo from "./finishedInfo";
import FinishedInfo2 from "./finishedInfo";
import ModulesInfo from "./modulesInfo";
import { GuidesContainer, GuidesBox, GuideColumn } from "./style";
import Figmaimg from "../../assets/Component 1.svg";
import Icon1 from "../../assets/Component2.svg";
import Icon2 from "../../assets/Component3.svg";
import Icon3 from "../../assets/Component4.svg";
import Icon4 from "../../assets/Component5.svg";
import Icon5 from "../../assets/Component6.svg";
import GradesInfo from "./gradesInfo";

const DummyData = [
  {
    ModuleT: "Module 1",
    GuidesN: 12,
    image: Figmaimg,
  },
  {
    ModuleT: "Module 2",
    GuidesN: 10,
    image: Icon1,
  },
  {
    ModuleT: "Module 3",
    GuidesN: 6,
    image: Icon2,
  },
  {
    ModuleT: "Module 4",
    GuidesN: 4,
    image: Icon3,
  },
  {
    ModuleT: "Module 5",
    GuidesN: 7,
    image: Icon4,
  },
  {
    ModuleT: "Module 6",
    GuidesN: 7,
    image: Icon5,
  },
];

const GuidesWidget = () => {
  return (
    <GuidesContainer>
      <h2>Guides</h2>
      <GuidesBox>
        <GuideColumn>
          <h2>Modules</h2>
          {DummyData.map((module, index) => {
            return (
              <ModulesInfo
                ModuleTitle={module.ModuleT}
                GuidesNumber={module.GuidesN}
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
          <GradesInfo>
            
          </GradesInfo>
        </GuideColumn>
      </GuidesBox>
      <p>View All</p>
    </GuidesContainer>
  );
};

export default GuidesWidget;
