"use client";

import { Container, GuideDropdownContainer } from "./style";
import { ModuleOptions } from "UIcomponents/dropdown/Dropdown";
import { ExtendedGuideInfo, Module, ReturnStatus } from "types/guideTypes";
import { useLocalState } from "utils/hooks/useStorage";
import { extractModuleNumber } from "utils/moduleUtils";
import { GuidesClient } from "../guidesClient/GuidesClient";
import { StatusLegend } from "./StatusLegend";

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

  // Only meaningful for logged-in students with progress; visitors see
  // every card as NOT_RETURNED and don't need a legend.
  const showLegend = extendedGuides.some(
    (guide) => guide.returnStatus !== ReturnStatus.NOT_RETURNED
  );

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
      {showLegend && <StatusLegend />}
      <GuidesClient guides={filteredGuides} useGuideOrder={!!selectedModule} />
    </Container>
  );
};

const createOptions = (
  modules: Module[],
  setSelectedModule: (value: number) => void
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
  return extendedGuides.filter(
    (guide) => extractModuleNumber(guide.module.title) === selectedModule
  );
};

export const exportedForTesting = {
  createOptions,
  filterGuides,
};
