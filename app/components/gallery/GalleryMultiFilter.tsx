"use client";

import { useEffect, useRef } from "react";
import styled from "styled-components";

const Dropdown = styled.details`
  position: relative;
  min-width: 0;
  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
    box-sizing: border-box;
    padding: 10px;
    border: 1px solid var(--primary-black-30);
    border-radius: var(--radius-lg);
    background: var(--primary-white);
    color: var(--primary-black-100);
    font-family: "Source Sans 3", sans-serif;
    font-size: 14px;
    cursor: pointer;
    list-style: none;
  }
  summary span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: "⌄"; }
  summary:focus-visible { outline: 2px solid var(--theme-module3-100); outline-offset: 2px; }
`;

const Options = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 25;
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-lg);
  background: var(--primary-white);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  font-family: "Source Sans 3", sans-serif;
  label { display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 4px 8px; cursor: pointer; }
  label:hover { background: rgba(120,100,220,0.08); }
  input { accent-color: var(--theme-module3-100); }
`;

export default function GalleryMultiFilter({ label, allLabel, options, selected, onChange }: {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const dropdown = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  const selectedValues = new Set(selected);
  const summary = selected.length === 0 ? allLabel
    : options.filter(option => selectedValues.has(option.value)).map(option => option.label).join(", ");
  return (
    <Dropdown data-gallery-layout={label.replace("Filter by ", "")} ref={dropdown} onKeyDown={event => {
      if (event.key === "Escape" && dropdown.current) {
        dropdown.current.open = false;
        dropdown.current.querySelector("summary")?.focus();
      }
    }}>
      <summary aria-label={label} title={summary}>
        <span>{selected.length > 1 ? selected.length + " selected" : summary}</span>
      </summary>
      <Options role="group" aria-label={label + " options"}>
        <label>
          <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} />
          {allLabel}
        </label>
        {options.map(option => (
          <label key={option.value}>
            <input type="checkbox" checked={selectedValues.has(option.value)} onChange={() => {
              onChange(selectedValues.has(option.value) ? selected.filter(value => value !== option.value) : [...selected, option.value]);
            }} />
            {option.label}
          </label>
        ))}
      </Options>
    </Dropdown>
  );
}
