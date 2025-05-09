"use client";
import React from "react";

interface FilterButtonProps {
  setFilter: React.Dispatch<
    React.SetStateAction<{ tagStatus: string; guideCategory: string }>
  >;
  filter: { tagStatus: string; guideCategory: string };
}

export const FilterButton = ({ setFilter, filter }: FilterButtonProps) => {
  const handleFilterChange = () => {
    if (filter.tagStatus === "review" && filter.guideCategory === "code") {
      setFilter({ tagStatus: "", guideCategory: "" });
    } else {
      setFilter({
        tagStatus: "review",
        guideCategory: "code",
      });
    }
  };

  return (
    <button onClick={handleFilterChange}>
      {filter.tagStatus || filter.guideCategory
        ? "Reset Filter"
        : "Apply Filter"}
    </button>
  );
};
