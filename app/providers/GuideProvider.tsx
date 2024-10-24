"use client";
import { createContext, useState } from "react";
import React from "react";
import { ExtendedGuideInfo, GradesGivenStatus } from "../guides/types";

type GuideContextProps = {
  children: React.ReactNode | null;
  guide: ExtendedGuideInfo;
};

const GuideContext = createContext<{
  guide: ExtendedGuideInfo;
  updateGradeStatus: () => void;
}>({ guide: {} as ExtendedGuideInfo, updateGradeStatus: () => {} });

export const GuideProvider = ({ children, guide }: GuideContextProps) => {
  const [currentGuide, setCurrentGuide] = useState<ExtendedGuideInfo>(guide);

  if (!currentGuide._id) return null;

  const updateGradeStatus = () => {
    const newGradesGivenStatus =
      currentGuide.gradesGiven.length >= 1
        ? GradesGivenStatus.GRADES_GIVEN
        : GradesGivenStatus.AWAITING_FEEDBACK;

    // may be some issue causes as spreading a Mongoose Document
    // just turns it into a normal JS Object
    // but don't believe it does not cause any issues
    const tmp = {
      ...currentGuide,
      gradesGivenStatus: newGradesGivenStatus,
    };

    setCurrentGuide(tmp);
  };

  return (
    <GuideContext.Provider value={{ guide: currentGuide, updateGradeStatus }}>
      {children}
    </GuideContext.Provider>
  );
};

export function useGuide() {
  const context = React.useContext(GuideContext);
  if (!context) {
    throw new Error("useGuide must be used within a GuideProvider");
  }
  return context;
}
