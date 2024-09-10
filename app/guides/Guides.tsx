"use client";
import GuidesClient from "./guidesClient";
import { GuideType } from "../models/guide";
import React, { useMemo, useState } from "react";
import { Module } from "../utils/types";
import { Container } from "./style";
import { Dropdown } from "components/dropdown/Dropdown";

type Guides = (GuideType & { individualGuideLink: string })[];

export const Guides = ({
  fetchedGuides,
}: {
  fetchedGuides: (GuideType & { individualGuideLink: string })[];
}) => {
  const [selectedModule, setSelectedModule] = useState<number | undefined>(
    undefined
  );

  // Get all modules from fetchedGuides and sort them
  const modules: Module[] = useMemo(() => {
    return fetchModules(fetchedGuides);
  }, [fetchedGuides]);

  const filteredGuides = useMemo(() => {
    return filterGuides(selectedModule, fetchedGuides);
  }, [fetchedGuides, selectedModule, modules]);

  const options = useMemo(() => {
    return createOptions(modules, setSelectedModule);
  }, [modules]);

  return (
    <Container>
      <Dropdown
        options={options}
        title={"All Modules"}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "1rem",
        }}
      />
      <GuidesClient fetchedGuides={filteredGuides} />
    </Container>
  );
};

const fetchModules = (fetchedGuides: Guides) => {
  return fetchedGuides
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
  fetchedGuides: Guides
) => {
  if (selectedModule === undefined) return fetchedGuides;
  return fetchedGuides.filter((guide) => {
    if (guide.module.title[0] === "" + selectedModule) return guide;
  });
};

const createOptions = (
  modules: Module[],
  setSelectedModule: React.Dispatch<number | undefined>
) => {
  return [
    { optionName: "All", onClick: () => setSelectedModule(undefined) },
  ].concat(
    modules.map((module) => ({
      optionName: "Module " + module.number,
      onClick: () => setSelectedModule(module.number),
    }))
  );
};

export const exportedForTesting = {
  fetchModules,
  filterGuides,
  createOptions,
};
