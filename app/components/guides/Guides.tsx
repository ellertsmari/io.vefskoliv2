"use client";

import { useState } from "react";
import {
  Container,
  GuideDropdownContainer,
  ModuleOptionContainer,
} from "./style";
import { ExtendedGuideInfo, Module } from "types/guideTypes";
import { useLocalState } from "react-session-hooks";
import { GuidesClient } from "components/guidesClient/GuidesClient";

const LOCAL_STORAGE_KEY = "selectedModule";

export const Guides = ({
  extendedGuides,
  modules,
}: {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}) => {
  const [selectedModule, setSelectedModule, loading] =
    useLocalState<number>(LOCAL_STORAGE_KEY);
  const [filter, setFilter] = useState<{
    tagStatus: string;
    guideCategory: string;
  }>({
    tagStatus: "",
    guideCategory: "",
  });

  if (!extendedGuides || !modules || loading) return null;

  const filteredGuides = filterGuides(selectedModule, extendedGuides, filter);
  const options = createOptions(modules, setSelectedModule);

  return (
    <Container>
      <GuideDropdownContainer>
        {options.map((option) => (
          <ModuleOptionContainer
            key={option.optionName}
            onClick={option.onClick}
            isActive={
              selectedModule === Number(option.optionName.split(" ")[1])
            }
          >
            <p>{option.optionName}</p>
          </ModuleOptionContainer>
        ))}
      </GuideDropdownContainer>

      <GuidesClient guides={filteredGuides} useGuideOrder={!!selectedModule} />
    </Container>
  );
};

const createOptions = (
  modules: Module[],
  setSelectedModule: React.Dispatch<number | null>
) => {
  return modules
    .filter((module) => module.number !== 0)
    .map((module) => ({
      optionName: "Module " + module.number,
      onClick: () => setSelectedModule(module.number),
    }));
};

const filterGuides = (
  selectedModule: number | null,
  extendedGuides: ExtendedGuideInfo[],
  filter: { tagStatus: string; guideCategory: string }
) => {
  if (selectedModule === null) return extendedGuides;

  return extendedGuides.filter((guide) => {
    const matchesModule = guide.module.title[0] === "" + selectedModule;

    return matchesModule;
  });
};
