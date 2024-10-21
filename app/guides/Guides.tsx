"use client";
import GuidesClient from "./guidesClient";

import React, { useEffect, useState } from "react";
import { Container, GuideDropdownContainer } from "./style";
import { Dropdown } from "../components/dropdown/dropdown";
import { ExtendedGuideInfo, GuideInfo, Module } from "./types";
import { extendGuides } from "./utils";

export const Guides = ({ fetchedGuides }: { fetchedGuides: GuideInfo[] }) => {
  const [extendedGuides, setExtendedGuides] = useState<ExtendedGuideInfo[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | undefined>(
    undefined
  );

  if (fetchedGuides.length < 1) return null;

  useEffect(() => {
    const getExtendedGuides = async () => {
      setExtendedGuides(await extendGuides(fetchedGuides));
    };
    getExtendedGuides();
  }, []);

  if (extendedGuides.length < 1) return null;

  // Get all modules from fetchedGuides and sort them
  const modules: Module[] = fetchModules(extendedGuides);

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
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            // marginTop: "1rem",
            // marginLeft: "6rem",
          }}
        />
      </GuideDropdownContainer>
      <GuidesClient
        fetchedGuides={filteredGuides}
        useGuideOrder={!!selectedModule}
      />
    </Container>
  );
};

const fetchModules = (extendedGuides: ExtendedGuideInfo[]) => {
  return extendedGuides
    .reduce((acc: Module[], guideToCheck) => {
      if (
        !acc.some(
          (existingGuide) =>
            (+guideToCheck.module.title[0] as number) === existingGuide.number
        )
      ) {
        acc.push({
          title: guideToCheck.module.title,
          number: +guideToCheck.module.title[0] as number,
        });
      }
      return acc;
    }, [] as { title: string; number: number }[])
    .sort((a, b) => a.number - b.number);
};

// Not ideal but improving this would require a refactor of the data model as we don't store number explicitly
// Currently, we are assuming that the module title is a number
const filterGuides = (
  selectedModule: number | undefined,
  extendedGuides: ExtendedGuideInfo[]
) => {
  if (selectedModule === undefined) return extendedGuides;
  return extendedGuides.filter((guide) => {
    if (guide.module.title[0] === "" + selectedModule) return guide;
  });
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

export const exportedForTesting = {
  fetchModules,
  filterGuides,
  createOptions,
};
