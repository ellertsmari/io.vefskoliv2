"use client";

import { Container, GuideDropdownContainer } from "./style";
import { ExtendedGuideInfo, Module } from "types/guideTypes";
import { useSessionState } from "react-session-hooks";
import { GuidesClient } from "components/guidesClient/GuidesClient";
import { Dropdown } from "UIcomponents/dropdown/Dropdown";

const LOCAL_STORAGE_KEY = "selectedModule";

export const Guides = ({
  extendedGuides,
  modules,
}: {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}) => {
  const [selectedModule, setSelectedModule, loading] =
    useSessionState<number>(LOCAL_STORAGE_KEY);

  if (!extendedGuides || !modules || loading) return null;

  const filteredGuides = filterGuides(selectedModule, extendedGuides);

  const options = createOptions(modules, setSelectedModule);

  return (
    <Container>
      <GuideDropdownContainer>
        <Dropdown
          key={selectedModule}
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
  if (selectedModule === null) return extendedGuides;
  return extendedGuides.filter((guide) => {
    if (guide.module.title[0] === "" + selectedModule) return guide;
  });
};

export const exportedForTesting = {
  createOptions,
  filterGuides,
};
