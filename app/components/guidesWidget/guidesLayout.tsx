"use client";
import ModulesInfo from "./modulesInfo";
import { GuidesContainer, GuidesBox } from "./style";

const GuidesWidget = () => {
  return (
    <GuidesContainer>
      <h2>Guides</h2>
      <GuidesBox>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2>Modules</h2>
          <ModulesInfo />
          <ModulesInfo />
          <ModulesInfo />
        </div>
        <h2>Finished</h2>
        <h2>Grades</h2>
      </GuidesBox>
    </GuidesContainer>
  );
};

export default GuidesWidget;
