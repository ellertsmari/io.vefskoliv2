"use client";

import { Container, GuideDropdownContainer} from "./style";
import { Dropdown } from "UIcomponents/dropdown/Dropdown";
import { ExtendedGuideInfo, Module,  } from "types/guideTypes";
import { useLocalState } from "react-session-hooks";
import { GuidesClient } from "components/guidesClient/GuidesClient";
import GuideNav from "components/guidesNav/GuideNav";
const LOCAL_STORAGE_KEY = "selectedModule";

export const Guides = ({
  extendedGuides,
  modules,
}: {
  extendedGuides: ExtendedGuideInfo[];
  modules: Module[];
}) => {
  const [selectedModule, setSelectedModule, loading] =
    useLocalState<number>(LOCAL_STORAGE_KEY);

  if (!extendedGuides || !modules || loading) return null;

  const filteredGuides = filterGuides(selectedModule, extendedGuides);

  const options = createOptions(modules, setSelectedModule);

  return (
      <>
   

    <GuideNav guides={extendedGuides}/>

      {/* <GuideDropdownContainer>
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
      </GuideDropdownContainer> */}
      {/* <GuidesClient guides={filteredGuides} useGuideOrder={!!selectedModule} /> */}
    </>
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
