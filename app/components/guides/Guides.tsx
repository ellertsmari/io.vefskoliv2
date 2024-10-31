"use client";
import GuidesClient from "./guidesClient";

import { Container, GuideDropdownContainer } from "./style";
import { Dropdown } from "../../UIcomponents/dropdown/dropdown";
import { ExtendedGuideInfo, Module } from "../../../types/guideTypes";
import { useLocalState } from "../../hooks/useLocalState";

const LOCAL_STORAGE_KEY = "selectedModule";

export const Guides = ({
  extendedGuides,
  modules,
}: {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}) => {
  const [selectedModule, setSelectedModule] =
    useLocalState<number>(LOCAL_STORAGE_KEY);

  if (!extendedGuides || !modules) return null;

  const filteredGuides = filterGuides(selectedModule, extendedGuides);

  const options = createOptions(modules, setSelectedModule);

  return (
    <Container>
      <GuideDropdownContainer>
        <Dropdown
          options={options}
          currentOption={options.find(
            (option) => option.optionName === "Module " + selectedModule
          )}
          titleOption={{
            optionName: "All Modules",
            onClick: () => setSelectedModule(null),
          }}
        />
      </GuideDropdownContainer>
      <GuidesClient guides={filteredGuides} useGuideOrder={!!selectedModule} />
    </Container>
  );
};

const createOptions = (
  modules: Module[],
  setSelectedModule: React.Dispatch<number | null>
) => {
  return modules.map((module) => ({
    optionName: "Module " + module.number,
    onClick: () => setSelectedModule(module.number),
  }));
};

const filterGuides = (
  selectedModule: number | null,
  extendedGuides: ExtendedGuideInfo[]
) => {
  if (!selectedModule) return extendedGuides;
  return extendedGuides.filter((guide) => {
    if (guide.module.title[0] === "" + selectedModule) return guide;
  });
};

export const exportedForTesting = {
  createOptions,
  filterGuides,
};
