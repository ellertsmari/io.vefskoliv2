"use client";
import { createContext } from "react";
import React from "react";
import { ExtendedGuideInfo } from "../../types/guideTypes";

type GuideContextProps = {
  children: React.ReactNode | null;
  guide: ExtendedGuideInfo;
};

const GuideContext = createContext<{
  guide: ExtendedGuideInfo;
}>({ guide: {} as ExtendedGuideInfo });

export const GuideProvider = ({ children, guide }: GuideContextProps) => {
  if (!guide._id) return null;

  return (
    <GuideContext.Provider value={{ guide }}>
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
