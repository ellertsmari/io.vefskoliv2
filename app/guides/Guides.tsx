"use client";
import GuidesClient from "./guidesClient";

import { useState } from "react";
import { Container, GuideDropdownContainer } from "./style";
import { Dropdown } from "../components/dropdown/dropdown";
import { ExtendedGuideInfo, Module } from "../../types/guideTypes";

export const Guides = ({
  extendedGuides,
  modules,
}: {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}) => {
  const [selectedModule, setSelectedModule] = useState<number | undefined>(
    undefined
  );

  if (!extendedGuides || !modules) return null;

  const filteredGuides = filterGuides(selectedModule, extendedGuides);

  const options = createOptions(modules, setSelectedModule);

  return (
    <Container>
      <GuideDropdownContainer>
        <Dropdown
          options={options}
          titleOption={{
            optionName: "All Modules",
            onClick: () => setSelectedModule(undefined),
          }}
        />
      </GuideDropdownContainer>
      <GuidesClient guides={filteredGuides} useGuideOrder={!!selectedModule} />
    </Container>
  );
};

const createOptions = (
  modules: Module[],
  setSelectedModule: React.Dispatch<number | undefined>
) => {
  return modules.map((module) => ({
    optionName: "Module " + module.number,
    onClick: () => setSelectedModule(module.number),
  }));
};

const filterGuides = (
  selectedModule: number | undefined,
  extendedGuides: ExtendedGuideInfo[]
) => {
  if (selectedModule === undefined) return extendedGuides;
  return extendedGuides.filter((guide) => {
    if (guide.module.title[0] === "" + selectedModule) return guide;
  });
};

export const exportedForTesting = {
  createOptions,
  filterGuides,
};
