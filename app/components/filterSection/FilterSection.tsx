"use client";

import { useState } from "react";
import { SearchIcon, FilterIcon } from "assets/Icons";
import {
  FilterContainer,
  ModuleList,
  ModuleItem,
  SearchContainer,
  SearchInput,
  SearchButton,
  SortButton,
} from "./style";

const modules = [1, 2, 3, 4, 5, 6, 7];

export const FilterSection: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <FilterContainer>
      {}
      <ModuleList>
        <span>Module</span>
        {modules.map((module) => (
          <ModuleItem
            key={module}
            selected={selectedModule === module}
            onClick={() => setSelectedModule(module)}
          >
            {module}
          </ModuleItem>
        ))}
      </ModuleList>

      {}
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search Guide"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SearchButton>
          <SearchIcon /> {}
        </SearchButton>
      </SearchContainer>

      {/* Sort Button */}
      <SortButton>
        <FilterIcon />
        <span>Sort By: Deadline</span>
      </SortButton>
    </FilterContainer>
  );
};
