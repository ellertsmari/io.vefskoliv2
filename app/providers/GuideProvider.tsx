"use client";
import { createContext } from "react";
import React from "react";
import { GuideType } from "../models/guide";

type GuideContextProps = {
  children: React.ReactNode | null;
  guide: GuideType;
};

const GuideContext = createContext<GuideType | null>(null);

export const GuideProvider = ({ children, guide }: GuideContextProps) => {
  return (
    <GuideContext.Provider value={guide}>{children}</GuideContext.Provider>
  );
};

export function useGuide() {
  return React.useContext(GuideContext);
}
