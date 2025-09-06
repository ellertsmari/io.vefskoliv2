"use client";

import { Container, GuideDropdownContainer } from "./style";
import { ModuleOptions } from "UIcomponents/dropdown/Dropdown";
import { ExtendedGuideInfo, Module } from "types/guideTypes";
import { useLocalState } from "react-session-hooks";
import { GuidesClient } from "../guidesClient/GuidesClient";

const LOCAL_STORAGE_KEY = "selectedModule";

export const Guides = ({
  extendedGuides,
  modules,
}: {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}) => {
  const [selectedModule, setSelectedModule, loading] =
    useLocalState<number>(LOCAL_STORAGE_KEY, 0, v => v.toString());

  if (!extendedGuides || !modules || loading) return null;

  const filteredGuides = filterGuides(selectedModule, extendedGuides);

  const options = createOptions(modules, setSelectedModule);

  return (
    <Container>
      <GuideDropdownContainer>
        <ModuleOptions
          key={selectedModule}
          options={options}
          currentOption={options.find(
            (option) => option.optionName === "Module " + selectedModule
          )}
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
  console.log(modules)
  return modules.map((module) => ({
    optionName: "Module " + module.number,
    onClick: () => {console.log(module.number); setSelectedModule(module.number)},
  }));
};

const filterGuides = (
  selectedModule: number | null,
  extendedGuides: ExtendedGuideInfo[]
) => {
  if (selectedModule === null) return extendedGuides;
  return extendedGuides.filter((guide) => {
    if (guide.module.title[0] === "" + selectedModule) return guide;
  });
};

export const exportedForTesting = {
  createOptions,
  filterGuides,
};
