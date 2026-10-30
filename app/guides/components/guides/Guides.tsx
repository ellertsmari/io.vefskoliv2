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
import { GuidesClient } from "../guidesClient/GuidesClient";
import { StatusLegend } from "./StatusLegend";
import { useCallback, useEffect, useState } from "react";
import {
  LEGACY_STORAGE_KEY,
  MODULE_COOKIE,
  moduleCookie,
  parseModuleChoice,
} from "./moduleFilter";

export const Guides = ({
  extendedGuides,
  modules,
  initialModule = null,
}: {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
  /** The remembered filter, read from its cookie by the server. */
  initialModule?: number | null;
}) => {
  // null = "All modules". Rendered on the server straight away, with no
  // loading state: the list is in the HTML for people and crawlers alike.
  const [selectedModule, setSelected] = useState<number | null>(initialModule);
  const setSelectedModule = useCallback((module: number | null) => {
    setSelected(module);
    document.cookie = moduleCookie(module);
  }, []);
  useCarryOverLegacyChoice(setSelectedModule);

  if (!extendedGuides || !modules) return null;

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

/**
 * Students' choice used to live in localStorage. Carry it over to the cookie
 * once, so nobody's filter resets with this change; later visits have the
 * cookie and skip this.
 */
const useCarryOverLegacyChoice = (
  setSelectedModule: (module: number | null) => void
) => {
  useEffect(() => {
    if (document.cookie.includes(`${MODULE_COOKIE}=`)) return;
    try {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const module = parseModuleChoice(stored);
      if (module !== null) setSelectedModule(module);
    } catch {
      // Storage blocked: there is nothing to carry over.
    }
  }, [setSelectedModule]);
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
    (guide) => guide.module.number === selectedModule
  );
};

export const exportedForTesting = {
  createOptions,
  filterGuides,
  currentOptionName,
};
