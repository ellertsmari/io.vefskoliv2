"use client";

import {
  Container,
  GuideDropdownContainer,
  TitleBlock,
  PageTitle,
  PageSubtitle,
} from "./style";
import { ModuleOptions, type Option } from "UIcomponents/dropdown/Dropdown";
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

  const selected = modules.find((module) => module.number === selectedModule);

  return (
    <Container>
      <TitleBlock>
        <PageTitle>Guides</PageTitle>
        {/* The module's real name lives here now that the pill is just a
            number, so choosing a module still tells you what it covers.
            With no module chosen it would only repeat the "All modules" pill
            directly below, so it carries the count instead. */}
        <PageSubtitle>
          {selected
            ? moduleName(selected)
            : `${extendedGuides.length} guides`}
        </PageSubtitle>
      </TitleBlock>

      <GuideDropdownContainer>
        <ModuleOptions
          key={selectedModule ?? "all"}
          label="Filter guides by module"
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

/**
 * The capsule label. Just "Module 3", not the stored title ("3 - The
 * fundamentals"): eight full titles made the filter row wrap over two lines of
 * uneven pills, and the number is what students actually filter by. The full
 * name is not lost — it is the tooltip on the pill, and the page subtitle once
 * a module is chosen.
 */
const moduleLabel = (module: Module) => `Module ${module.number}`;

/**
 * The descriptive half of a module's title, with the leading number stripped:
 * "3 - The fundamentals" becomes "The fundamentals". Falls back to the whole
 * title if it isn't in that shape.
 */
const moduleName = (module: Module) => {
  const title = module.title?.trim() ?? "";
  const withoutNumber = title.replace(/^\d+\s*[-–—:.]?\s*/, "").trim();
  return withoutNumber || title || moduleLabel(module);
};

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
): Option[] => {
  return [
    { optionName: ALL_MODULES, onClick: () => setSelectedModule(null) },
    ...modules.map((module) => ({
      optionName: moduleLabel(module),
      description: moduleName(module),
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
