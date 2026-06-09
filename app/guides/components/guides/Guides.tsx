"use client";

import { Container, GuideDropdownContainer } from "./style";
import { ModuleOptions } from "UIcomponents/dropdown/Dropdown";
import { ExtendedGuideInfo, Module, ReturnStatus } from "types/guideTypes";
import { useLocalState } from "utils/hooks/useStorage";
import { extractModuleNumber } from "utils/moduleUtils";
import { GuidesClient } from "../guidesClient/GuidesClient";
import { StatusLegend } from "./StatusLegend";
import { LoadingSpinner } from "UIcomponents/states/States";

const LOCAL_STORAGE_KEY = "selectedModule";

export const Guides = ({
  extendedGuides,
  modules,
}: {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}) => {
  // null = "All modules". JSON (de)serialization handles null natively, and
  // previously-stored plain numbers ("3") parse unchanged.
  const [selectedModule, setSelectedModule, loading] =
    useLocalState<number | null>(LOCAL_STORAGE_KEY, null);

  if (!extendedGuides || !modules) return null;
  if (loading) return <LoadingSpinner label="Loading guides…" />;

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
          key={selectedModule ?? "all"}
          options={options}
          currentOption={options.find(
            (option) =>
              option.optionName === currentOptionName(selectedModule, modules)
          )}
        />
      </GuideDropdownContainer>
      {showLegend && <StatusLegend />}
      <GuidesClient guides={filteredGuides} useGuideOrder={selectedModule !== null} />
    </Container>
  );
};

const ALL_MODULES = "All modules";

/** The capsule label for a module — its real title ("3 - The fundamentals"),
 *  falling back to "Module N" if a title is ever missing. */
const moduleLabel = (module: Module) =>
  module.title?.trim() || "Module " + module.number;

const currentOptionName = (
  selectedModule: number | null,
  modules: Module[]
) => {
  if (selectedModule === null) return ALL_MODULES;
  const module = modules.find((m) => m.number === selectedModule);
  return module ? moduleLabel(module) : ALL_MODULES;
};

const createOptions = (
  modules: Module[],
  setSelectedModule: (value: number | null) => void
) => {
  return [
    { optionName: ALL_MODULES, onClick: () => setSelectedModule(null) },
    ...modules.map((module) => ({
      optionName: moduleLabel(module),
      onClick: () => setSelectedModule(module.number),
    })),
  ];
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
  currentOptionName,
};
